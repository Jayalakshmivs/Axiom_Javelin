import asyncio
import sys
import os

# Add backend directory to path so we can import local modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from models.database import init_db, db

async def verify_and_seed():
    print("Initializing database...")
    await init_db()
    
    if db.db is not None:
        print("[OK] MongoDB is connected!")
        # Check for admin user
        admin = await db.users.find_one({"email": "admin@axiomjavelin.local"})
        if admin:
            print(f"[OK] Admin user found: {admin.get('email')}")
            print(f"Admin ID: {db.default_admin_id}")
        else:
            print("[ERROR] Admin user not found (seeding might have failed)")
    else:
        print("[ERROR] MongoDB is NOT connected (falling back to in-memory store)")

if __name__ == "__main__":
    asyncio.run(verify_and_seed())
