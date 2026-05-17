"""
Database layer — uses MongoDB via motor (async).
Falls back to in-memory dict if MongoDB is completely unreachable.

FIX: __getattr__ was causing infinite recursion because accessing self.db
     inside __getattr__ would trigger another __getattr__ call.
     Solution: use object.__getattribute__ / __dict__ for internal state.
"""
import os
import asyncio
from typing import Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from utils.logger import setup_logger

# Load environment variables from .env if it exists
load_dotenv()

logger = setup_logger()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "axiom_javelin")


class _DB:
    """
    Thin wrapper around an AsyncIOMotorDatabase.
    Access any collection as an attribute: db.users, db.audit_logs, etc.
    Falls back to in-memory storage when MongoDB is unreachable.
    """

    def __init__(self):
        # Store all internal state in __dict__ directly to avoid
        # triggering our custom __getattr__.
        object.__setattr__(self, '_client', None)
        object.__setattr__(self, '_motor_db', None)
        object.__setattr__(self, '_fallback_data', {})
        object.__setattr__(self, 'default_admin_id', 'system-admin-id')

    # ── properties that bypass __getattr__ ──────────────────────────────────

    @property
    def client(self):
        return object.__getattribute__(self, '_client')

    @property
    def db(self):
        """Expose the underlying Motor database object (may be None)."""
        return object.__getattribute__(self, '_motor_db')

    @property
    def connected(self) -> bool:
        return object.__getattribute__(self, '_motor_db') is not None

    # ── connection ──────────────────────────────────────────────────────────

    async def connect(self):
        logger.info(f"Attempting to connect to MongoDB at {MONGO_URI} (db={DB_NAME})...")
        try:
            client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Trigger a real connection test
            await client.server_info()
            motor_db = client[DB_NAME]
            object.__setattr__(self, '_client', client)
            object.__setattr__(self, '_motor_db', motor_db)
            logger.info(f"✅ Connected to MongoDB at {MONGO_URI}, database='{DB_NAME}'")
        except Exception as e:
            logger.error(
                f"❌ MongoDB connection failed ({MONGO_URI}): {e}. "
                "Falling back to in-memory store."
            )
            object.__setattr__(self, '_client', None)
            object.__setattr__(self, '_motor_db', None)

    # ── collection access ────────────────────────────────────────────────────

    def __getattr__(self, name: str):
        """
        Return a Motor collection if connected, otherwise a fallback proxy.
        This is only called when the attribute is NOT found via normal lookup,
        so it will never be triggered for _client, _motor_db, etc.
        """
        motor_db = object.__getattribute__(self, '_motor_db')
        if motor_db is not None:
            return motor_db[name]
        return _FallbackCollection(self, name)


class _FallbackCollection:
    """A proxy for MongoDB collections that works in-memory when DB is down."""

    def __init__(self, db_instance: _DB, name: str):
        self._db_instance = db_instance
        self._name = name

    def _get_data(self):
        fb = object.__getattribute__(self._db_instance, '_fallback_data')
        if self._name not in fb:
            fb[self._name] = []
        return fb[self._name]

    async def find_one(self, query: dict) -> Optional[dict]:
        logger.warning(f"[Fallback] find_one on '{self._name}'")
        for item in self._get_data():
            if all(item.get(k) == v for k, v in query.items()):
                doc = item.copy()
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                return doc
        return None

    async def insert_one(self, document: dict) -> Any:
        logger.warning(f"[Fallback] insert_one on '{self._name}'")
        from bson import ObjectId

        if "_id" not in document:
            document["_id"] = ObjectId()

        class MockResult:
            def __init__(self, id_):
                self.inserted_id = id_

        self._get_data().append(document)
        return MockResult(document["_id"])

    async def update_one(self, query: dict, update: dict, upsert: bool = False) -> Any:
        logger.warning(f"[Fallback] update_one on '{self._name}'")

        class MockResult:
            modified_count = 0

        data = self._get_data()
        op_set = update.get("$set", {})
        for item in data:
            if all(item.get(k) == v for k, v in query.items()):
                item.update(op_set)
                return type("MockResult", (), {"modified_count": 1})()
        return MockResult()

    async def delete_one(self, query: dict) -> Any:
        logger.warning(f"[Fallback] delete_one on '{self._name}'")
        data = self._get_data()
        for i, item in enumerate(data):
            if all(item.get(k) == v for k, v in query.items()):
                data.pop(i)
                return type("MockResult", (), {"deleted_count": 1})()
        return type("MockResult", (), {"deleted_count": 0})()

    def find(self, query: dict = None):
        logger.warning(f"[Fallback] find on '{self._name}'")
        data = self._get_data()
        if query:
            data = [item for item in data if all(item.get(k) == v for k, v in query.items())]

        class MockCursor:
            def __init__(self, d):
                self.data = d
            def sort(self, *args, **kwargs):
                return self
            def limit(self, *args, **kwargs):
                return self
            async def to_list(self, length: int):
                return self.data[:length]

        return MockCursor(data)

    async def count_documents(self, query: dict) -> int:
        return len(self._get_data())

    def aggregate(self, pipeline: list):
        logger.warning(f"[Fallback] aggregate on '{self._name}'")

        class MockCursor:
            async def to_list(self, length: int):
                return []

        return MockCursor()


# Singleton
db = _DB()


async def init_db():
    await db.connect()

    if db.connected:
        motor_db = db.db
        existing_collections = await motor_db.list_collection_names()
        required_collections = [
            "users", "audit_logs", "scan_history", 
            "phishing_results", "deepfake_results", 
            "ransomware_logs", "alerts"
        ]
        for coll in required_collections:
            if coll not in existing_collections:
                try:
                    await motor_db.create_collection(coll)
                    logger.info(f"Created collection: {coll}")
                except Exception as e:
                    logger.warning(f"Could not create collection {coll}: {e}")

    # Seed default admin user
    admin_email = "admin@axiomjavelin.local"
    try:
        existing_admin = await db.users.find_one({"email": admin_email})
        if not existing_admin:
            from models.schemas import UserDB
            import hashlib, os as _os
            salt = _os.urandom(16).hex()
            hashed = hashlib.sha256((salt + "admin123").encode()).hexdigest()
            pw = f"{salt}:{hashed}"

            admin_user = UserDB(
                name="System Admin",
                email=admin_email,
                password=pw,
                role="admin"
            ).model_dump(exclude_none=True)

            result = await db.users.insert_one(admin_user)
            object.__setattr__(db, 'default_admin_id', str(result.inserted_id))
            logger.info("✅ Default admin user seeded.")
        else:
            object.__setattr__(db, 'default_admin_id', str(existing_admin["_id"]))
            logger.info("✅ Default admin user already exists.")
    except Exception as e:
        logger.error(f"Admin seed failed: {e}")


async def get_db():
    return db
