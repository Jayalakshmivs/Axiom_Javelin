from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from models.database import db
from models.schemas import AlertDB
from utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()

@router.get("/")
async def get_alerts(email: Optional[str] = None):
    """Fetch all security alerts from MongoDB."""
    query = {}
    if email:
        found_user = await db.users.find_one({"email": email})
        if found_user:
            query["user_id"] = str(found_user["_id"])
    
    cursor = db.alerts.find(query).sort("createdAt", -1).limit(50)
    results = await cursor.to_list(length=50)
    
    formatted = []
    for r in results:
        formatted.append({
            "id": str(r["_id"]),
            "type": r.get("module", "security_alert"),
            "severity": r.get("severity", "medium"),
            "message": r.get("message", ""),
            "source": r.get("source", "system"),
            "timestamp": r.get("createdAt").isoformat() if hasattr(r.get("createdAt"), "isoformat") else str(r.get("createdAt")),
            "resolved": r.get("resolved", r.get("is_read", False))
        })
    return formatted

@router.post("/resolve/{alert_id}")
async def resolve_alert(alert_id: str):
    """Mark an alert as resolved in MongoDB."""
    try:
        result = await db.alerts.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": {"is_read": True, "resolved": True}}
        )
        if result.modified_count == 1:
            return {"status": "success", "message": "Alert resolved"}
        raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid alert ID: {str(e)}")
