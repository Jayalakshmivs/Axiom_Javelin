import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check_mongo():
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    print(f"Testing connection to {uri}...")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
    try:
        info = await client.server_info()
        print("Connected successfully!")
        print(f"Server info: {info.get('version')}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_mongo())
