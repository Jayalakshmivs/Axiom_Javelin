from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import hashlib
import os
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

# Import local modules
from routers import deepfake, phishing, ransomware, alerts
from models.database import init_db, db
from models.schemas import UserDB, AuditLogDB
from utils.logger import setup_logger

logger = setup_logger()

app = FastAPI(title="AXIOM JAVELIN API", version="1.0.0")

# CORS — allow all origins so the Capacitor mobile app and browser dev server both work
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class RegisterSchema(BaseModel):
    """Used exclusively for POST /api/auth/signup"""
    name: str
    email: str
    password: str


class LoginSchema(BaseModel):
    """Used exclusively for POST /api/auth/login"""
    email: str
    password: str


# ── Password helpers ───────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    """Simple SHA-256 hash with a salt prefix for self-contained auth."""
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt, hashed = stored.split(":", 1)
        return hashlib.sha256((salt + password).encode()).hexdigest() == hashed
    except Exception:
        return False


# ── AUTHENTICATION ─────────────────────────────────────────────────────────────

@app.post("/api/auth/signup", tags=["Auth"])
async def signup(user: RegisterSchema):
    """Register a new agent account."""
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = _hash_password(user.password)
    
    new_user = UserDB(
        name=user.name,
        email=user.email,
        password=hashed_pw,
        role="user"
    ).model_dump(exclude_none=True)
    
    result = await db.users.insert_one(new_user)
    inserted_id = str(result.inserted_id)
    
    # Audit Log
    audit_log = AuditLogDB(
        user_id=inserted_id,
        action="signup",
        module="auth",
        details={"email": user.email}
    ).model_dump(exclude_none=True)
    await db.audit_logs.insert_one(audit_log)

    return {
        "message": "User registered successfully",
        "user": {"name": user.name, "email": user.email},
    }


@app.post("/api/auth/login", tags=["Auth"])
async def login(user: LoginSchema):
    """Authenticate an existing agent."""
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not _verify_password(user.password, db_user["password"]):
        logger.warning(f"Failed login attempt for email: {user.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update lastLogin timestamp
    try:
        await db.users.update_one({"_id": db_user["_id"]}, {"$set": {"lastLogin": datetime.utcnow()}})
    except Exception as e:
        logger.warning(f"Could not update lastLogin: {e}")

    # Audit Log
    audit_log = AuditLogDB(
        user_id=str(db_user["_id"]),
        action="login",
        module="auth",
        details={"email": user.email}
    ).model_dump(exclude_none=True)
    await db.audit_logs.insert_one(audit_log)

    return {
        "message": "Login successful",
        "user": {"name": db_user["name"], "email": db_user["email"]},
    }


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


# ── ROUTERS ────────────────────────────────────────────────────────────────────
app.include_router(deepfake.router, prefix="/api/deepfake", tags=["Deepfake"])
app.include_router(phishing.router, prefix="/api/phishing", tags=["Phishing"])
app.include_router(ransomware.router, prefix="/api/ransomware", tags=["Ransomware"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])


@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("AXIOM JAVELIN Backend operational -- http://0.0.0.0:8000")


if __name__ == "__main__":
    import uvicorn
    # init_db() will be called by the startup event in the uvicorn loop
    uvicorn.run(app, host="0.0.0.0", port=8000)
