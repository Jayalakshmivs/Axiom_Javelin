from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

# ==========================================
# MongoDB Pydantic Schemas for Axiom Javelin
# ==========================================

class UserDB(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"  # "user" or "admin"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    lastLogin: Optional[datetime] = None

class ScanHistoryDB(BaseModel):
    user_id: str
    module: str  # deepfake/phishing/ransomware
    input_type: str  # image/url/file
    input_value: str
    result: str  # real/fake/safe/malicious
    confidence: float
    status: str = "completed"  # completed/failed
    scannedAt: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

class DeepfakeResultDB(BaseModel):
    scan_id: str
    user_id: str
    image_name: str
    image_path: str
    prediction: str  # real/fake
    confidence: float
    model_used: str = "cnn_v1"
    processedAt: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None

class PhishingResultDB(BaseModel):
    scan_id: str
    user_id: str
    url: str
    domain: str
    ip_address: Optional[str] = None
    result: str  # safe/malicious
    confidence: float
    model_scores: Optional[Dict[str, float]] = None
    scannedAt: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None

class RansomwareLogDB(BaseModel):
    user_id: str
    file_path: str
    file_name: str
    entropy: float
    file_size: int
    status: str  # suspicious/normal
    action_taken: str  # allowed/quarantined/deleted
    detectedAt: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None

class AlertDB(BaseModel):
    user_id: str
    module: str  # deepfake/phishing/ransomware
    severity: str  # low/medium/high/critical
    message: str
    source: str
    is_read: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class SystemSettingDB(BaseModel):
    key: str
    value: Dict[str, Any]
    description: str
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class AuditLogDB(BaseModel):
    user_id: str
    action: str
    module: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
