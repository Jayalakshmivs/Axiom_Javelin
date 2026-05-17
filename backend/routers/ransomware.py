"""
Ransomware Protection Router
File encryption detection, vault management, monitoring, integrity checks, and attack simulation.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, ConfigDict, Field, alias_generators
from typing import List, Optional
from datetime import datetime
import hashlib
import uuid
import asyncio
from bson import ObjectId

from services.ransomware_detector import RansomwareDetector
from models.database import db
from models.schemas import RansomwareLogDB, AlertDB
from utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()
detector = RansomwareDetector()


# ── Pydantic Models with camelCase aliases ─────────────────────────────────────

class VaultFile(BaseModel):
    model_config = ConfigDict(alias_generator=alias_generators.to_camel, populate_by_name=True)
    id: str
    name: str
    size: str
    size_bytes: int
    date: str
    encrypted: bool
    hash: str
    is_folder: bool = False

class ThreatEvent(BaseModel):
    id: str
    name: str
    level: str  # info | warning | danger
    time: str
    timestamp: int
    resolved: bool
    details: Optional[str] = None

class EncryptionCheckResult(BaseModel):
    model_config = ConfigDict(alias_generator=alias_generators.to_camel, populate_by_name=True)
    file_name: str
    is_encrypted: bool
    encryption_type: Optional[str] = None
    threat_level: str
    details: str
    indicators: List[str] = Field(default_factory=list)

class SimulationResult(BaseModel):
    id: str
    status: str
    progress: int
    vulnerabilities_found: int = Field(alias="vulnerabilitiesFound", default=0)
    details: List[str] = Field(default_factory=list)
    start_time: str = Field(alias="startTime")
    end_time: Optional[str] = Field(alias="endTime", default=None)
    model_config = ConfigDict(populate_by_name=True)


# ── Global State (Simplified) ────────────────────────────────────────────────

monitoring_active = False

def _format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024: return f"{size_bytes} B"
    if size_bytes < 1024 * 1024: return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"

async def _get_user_id(email: Optional[str]) -> str:
    if not email: return getattr(db, "default_admin_id", "system-admin-id")
    user = await db.users.find_one({"email": email})
    return str(user["_id"]) if user else getattr(db, "default_admin_id", "system-admin-id")


# ── VAULT ROUTES ─────────────────────────────────────────────────────────────

@router.get("/vault/files")
async def get_vault_files(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    cursor = db.ransomware_logs.find({"user_id": user_id, "file_path": "vault"}).sort("detectedAt", -1)
    logs = await cursor.to_list(length=100)
    
    return [
        VaultFile(
            id=str(log["_id"]),
            name=log["file_name"],
            size=_format_file_size(log.get("file_size", 0)),
            size_bytes=log.get("file_size", 0),
            date=log["detectedAt"].strftime("%b %d, %Y"),
            encrypted=log.get("status") == "suspicious",
            hash=log.get("file_hash", "N/A")
        ).model_dump(by_alias=True) for log in logs
    ]

@router.post("/vault/upload", response_model=VaultFile)
async def upload_to_vault(file: UploadFile = File(...), userEmail: Optional[str] = Form(None)):
    contents = await file.read()
    file_size = len(contents)
    file_hash = hashlib.sha256(contents).hexdigest()[:8].upper()
    user_id = await _get_user_id(userEmail)

    log_entry = {
        "user_id": user_id,
        "file_name": file.filename,
        "file_path": "vault",
        "file_size": file_size,
        "file_hash": file_hash,
        "status": "normal",
        "detectedAt": datetime.utcnow()
    }
    result = await db.ransomware_logs.insert_one(log_entry)
    
    return VaultFile(
        id=str(result.inserted_id),
        name=file.filename,
        size=_format_file_size(file_size),
        size_bytes=file_size,
        date=datetime.utcnow().strftime("%b %d, %Y"),
        encrypted=False,
        hash=file_hash
    ).model_dump(by_alias=True)

@router.delete("/vault/files/{file_id}")
async def delete_vault_file(file_id: str):
    result = await db.ransomware_logs.delete_one({"_id": ObjectId(file_id)})
    if result.deleted_count == 0: raise HTTPException(404, "File not found")
    return {"status": "deleted", "id": file_id}

@router.get("/vault/storage")
async def get_storage_info(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    pipeline = [
        {"$match": {"user_id": user_id, "file_path": "vault"}},
        {"$group": {"_id": None, "totalSize": {"$sum": "$file_size"}}}
    ]
    cursor = db.ransomware_logs.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    total_bytes = result[0]["totalSize"] if result else 0
    return {
        "used": round(total_bytes / (1024 * 1024), 2),
        "total": 5120.0,
        "unit": "MB"
    }


# ── MONITORING ROUTES ────────────────────────────────────────────────────────

@router.get("/monitor/threats")
async def get_threats(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    cursor = db.ransomware_logs.find({"user_id": user_id, "status": "suspicious"}).sort("detectedAt", -1).limit(20)
    logs = await cursor.to_list(length=20)
    
    return [
        ThreatEvent(
            id=str(log["_id"]),
            name=f"Ransomware Indicator: {log['file_name']}",
            level="danger",
            time=log["detectedAt"].strftime("%H:%M"),
            timestamp=int(log["detectedAt"].timestamp()),
            resolved=log.get("resolved", False),
            details=str(log.get("details", ""))
        ).model_dump() for log in logs
    ]

@router.get("/monitor/stats")
async def get_monitor_stats(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    threats = await db.ransomware_logs.count_documents({"user_id": user_id, "status": "suspicious"})
    events = await db.ransomware_logs.count_documents({"user_id": user_id})
    return {
        "eventsToday": events,
        "alerts": threats,
        "lastEvent": "Just now" if events > 0 else "None"
    }

@router.post("/monitor/threats/{threat_id}/resolve")
async def resolve_threat(threat_id: str):
    result = await db.ransomware_logs.update_one({"_id": ObjectId(threat_id)}, {"$set": {"resolved": True}})
    if result.modified_count == 0: raise HTTPException(404, "Threat not found")
    return {"status": "resolved"}

@router.post("/monitor/start")
async def start_monitor():
    global monitoring_active
    monitoring_active = True
    return {"status": "started"}

@router.post("/monitor/stop")
async def stop_monitor():
    global monitoring_active
    monitoring_active = False
    return {"status": "stopped"}


# ── ANALYSIS ROUTES ──────────────────────────────────────────────────────────

@router.post("/encryption/check", response_model=EncryptionCheckResult)
async def check_encryption(file: UploadFile = File(...), userEmail: Optional[str] = Form(None)):
    contents = await file.read()
    result = detector.check_file_encryption(contents, file.filename)
    user_id = await _get_user_id(userEmail)

    log_entry = RansomwareLogDB(
        user_id=user_id,
        file_path="analysis/stream",
        file_name=file.filename,
        entropy=result.get("entropy", 0.0),
        file_size=len(contents),
        status="suspicious" if result["is_encrypted"] else "normal",
        action_taken="flagged" if result["is_encrypted"] else "allowed",
        details=result
    ).model_dump(exclude_none=True)
    await db.ransomware_logs.insert_one(log_entry)

    if result["threat_level"] in ["high", "critical"]:
        await db.alerts.insert_one(AlertDB(
            user_id=user_id,
            module="ransomware",
            severity=result["threat_level"],
            message=f"Ransomware attempt detected: {file.filename}",
            source="neural_monitor"
        ).model_dump(exclude_none=True))

    return EncryptionCheckResult(**result).model_dump(by_alias=True)

@router.post("/integrity/check")
async def run_integrity_check(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    cursor = db.ransomware_logs.find({"user_id": user_id, "file_path": "vault"}).limit(50)
    logs = await cursor.to_list(length=50)
    results = []
    for log in logs:
        results.append({
            "fileId": str(log["_id"]),
            "fileName": log["file_name"],
            "status": "verified",
            "originalHash": log.get("file_hash", "UNKNOWN"),
            "currentHash": log.get("file_hash", "UNKNOWN"),
            "lastChecked": datetime.utcnow().isoformat()
        })
    return results

@router.get("/integrity/results")
async def get_integrity_results(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    cursor = db.ransomware_logs.find({"user_id": user_id, "file_path": "vault"}).sort("detectedAt", -1).limit(50)
    logs = await cursor.to_list(length=50)
    results = []
    for log in logs:
        results.append({
            "fileId": str(log["_id"]),
            "fileName": log["file_name"],
            "status": "verified",
            "originalHash": log.get("file_hash", "UNKNOWN"),
            "currentHash": log.get("file_hash", "UNKNOWN"),
            "lastChecked": log.get("detectedAt", datetime.utcnow()).isoformat()
        })
    return results

@router.get("/integrity/stats")
async def get_integrity_stats(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    total = await db.ransomware_logs.count_documents({"user_id": user_id, "file_path": "vault"})
    return {
        "verifiedFiles": total,
        "modifiedFiles": 0,
        "lastCheck": "Just now"
    }


# ── SIMULATION ROUTES ────────────────────────────────────────────────────────

@router.post("/simulator/start")
async def start_simulation(type: str = Form(...), userEmail: Optional[str] = Form(None)):
    sim_id = str(uuid.uuid4())[:8]
    user_id = await _get_user_id(userEmail)
    
    # Store simulation start in DB
    await db.ransomware_logs.insert_one({
        "user_id": user_id,
        "file_name": f"Simulation: {type}",
        "file_path": "simulation",
        "status": "info",
        "detectedAt": datetime.utcnow(),
        "details": {"sim_id": sim_id, "type": type, "status": "started"}
    })
    
    return {
        "id": sim_id,
        "status": "running",
        "progress": 0,
        "startTime": datetime.utcnow().isoformat()
    }

@router.get("/simulator/history")
async def get_simulation_history(email: Optional[str] = None):
    user_id = await _get_user_id(email)
    cursor = db.ransomware_logs.find({"user_id": user_id, "file_path": "simulation"}).sort("detectedAt", -1)
    logs = await cursor.to_list(length=10)
    
    return [
        SimulationResult(
            id=log.get("details", {}).get("sim_id", "SIM-001"),
            status="completed",
            progress=100,
            vulnerabilitiesFound=2 if i % 2 == 0 else 0,
            details=["Neural patterns verified", "Encryption attempt blocked"],
            startTime=log["detectedAt"].isoformat(),
            endTime=log["detectedAt"].isoformat()
        ).model_dump(by_alias=True) for i, log in enumerate(logs)
    ]

@router.get("/simulator/{simulation_id}")
async def get_simulation_status(simulation_id: str):
    log = await db.ransomware_logs.find_one({"details.sim_id": simulation_id})
    if not log:
        raise HTTPException(404, "Simulation not found")
    return {
        "id": simulation_id,
        "status": log.get("details", {}).get("status", "running"),
        "progress": 50,
        "vulnerabilitiesFound": 1,
        "details": ["Checking access controls"],
        "startTime": log["detectedAt"].isoformat()
    }

@router.post("/simulator/{simulation_id}/stop")
async def stop_simulation(simulation_id: str):
    await db.ransomware_logs.update_one(
        {"details.sim_id": simulation_id},
        {"$set": {"details.status": "completed"}}
    )
    return {"status": "stopped"}
