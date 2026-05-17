"""
Ransomware Detection Service
File encryption detection and analysis
"""

import hashlib
from typing import Dict, List, Any

from utils.logger import setup_logger

logger = setup_logger()


class RansomwareDetector:
    """
    Ransomware detection and file analysis system
    
    Detection Methods:
    1. File extension analysis
    2. File header/magic bytes check
    3. Entropy analysis
    4. Known ransomware signatures
    """
    
    def __init__(self):
        # Known ransomware extensions
        self.ransomware_extensions = [
            '.encrypted', '.locked', '.crypto', '.crypt', '.enc',
            '.locky', '.cerber', '.cryptolocker', '.wannacry', '.petya',
            '.zepto', '.odin', '.thor', '.osiris', '.aesir',
            '.crypted', '.cryptowall', '.crypz', '.cryp1', '.crypt1'
        ]
        
        # Known file signatures (magic bytes)
        self.file_signatures = {
            'jpeg': [b'\xff\xd8\xff'],
            'png': [b'\x89PNG\r\n\x1a\n'],
            'gif': [b'GIF87a', b'GIF89a'],
            'pdf': [b'%PDF'],
            'zip': [b'PK\x03\x04'],
            'rar': [b'Rar!\x1a\x07'],
            'doc': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],
            'exe': [b'MZ']
        }
    
    async def check_encryption(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Check if a file has been encrypted by ransomware
        
        Args:
            file_bytes: Raw file bytes
            filename: Original filename
            
        Returns:
            Encryption analysis result
        """
        indicators = []
        threat_level = "none"
        is_encrypted = False
        encryption_type = None
        
        # Check 1: Extension analysis
        ext_result = self._check_extension(filename)
        if ext_result["suspicious"]:
            indicators.append(ext_result["indicator"])
            threat_level = "critical"
            is_encrypted = True
            encryption_type = ext_result.get("type", "Unknown ransomware")
        
        # Check 2: File header analysis
        header_result = self._check_file_header(file_bytes, filename)
        if header_result["suspicious"]:
            indicators.append(header_result["indicator"])
            if threat_level == "none":
                threat_level = "high"
                is_encrypted = True
        
        # Check 3: Entropy analysis
        entropy_result = self._analyze_entropy(file_bytes)
        if entropy_result["high_entropy"]:
            indicators.append(entropy_result["indicator"])
            if threat_level == "none":
                threat_level = "medium"
        
        # Check 4: Content analysis
        content_result = self._analyze_content(file_bytes)
        if content_result["suspicious"]:
            indicators.append(content_result["indicator"])
        
        # Determine details message
        if is_encrypted:
            details = "⚠️ This file appears to be encrypted by ransomware. Original data may be unrecoverable without the decryption key."
        elif indicators:
            details = "Some suspicious characteristics detected. The file may have been modified."
        else:
            details = "No ransomware encryption detected. File appears to be safe."
        
        return {
            "is_encrypted": is_encrypted,
            "encryption_type": encryption_type,
            "threat_level": threat_level,
            "details": details,
            "indicators": indicators
        }
    
    def _check_extension(self, filename: str) -> Dict[str, Any]:
        """Check file extension for ransomware indicators"""
        filename_lower = filename.lower()
        
        for ext in self.ransomware_extensions:
            if filename_lower.endswith(ext):
                return {
                    "suspicious": True,
                    "indicator": f"Known ransomware extension detected: {ext}",
                    "type": f"Ransomware ({ext.replace('.', '').upper()})"
                }
        
        # Check for double extensions (e.g., document.pdf.encrypted)
        parts = filename.split('.')
        if len(parts) > 2:
            last_ext = f'.{parts[-1].lower()}'
            if last_ext in self.ransomware_extensions:
                return {
                    "suspicious": True,
                    "indicator": f"Double extension with ransomware suffix: {last_ext}",
                    "type": "Unknown ransomware"
                }
        
        return {"suspicious": False}
    
    def _check_file_header(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Check file header matches expected type"""
        if len(file_bytes) < 8:
            return {"suspicious": True, "indicator": "File too small to analyze"}
        
        header = file_bytes[:8]
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        
        # Check if header matches expected format
        if ext in self.file_signatures:
            expected_sigs = self.file_signatures[ext]
            header_matches = any(
                file_bytes[:len(sig)] == sig for sig in expected_sigs
            )
            
            if not header_matches:
                return {
                    "suspicious": True,
                    "indicator": f"File header doesn't match .{ext} format (possible encryption)"
                }
        
        # Check for random-looking header (encrypted)
        if self._looks_random(header):
            return {
                "suspicious": True,
                "indicator": "File header appears to be encrypted/randomized"
            }
        
        return {"suspicious": False}
    
    def _analyze_entropy(self, file_bytes: bytes) -> Dict[str, Any]:
        """Analyze file entropy (encrypted files have high entropy)"""
        if len(file_bytes) == 0:
            return {"high_entropy": False, "entropy": 0}
        
        # Calculate byte frequency
        byte_counts = [0] * 256
        for byte in file_bytes[:10000]:  # Analyze first 10KB
            byte_counts[byte] += 1
        
        # Calculate entropy
        total = min(len(file_bytes), 10000)
        entropy = 0.0
        
        for count in byte_counts:
            if count > 0:
                freq = count / total
                entropy -= freq * (freq and __import__('math').log2(freq))
        
        # High entropy (> 7.5) suggests encryption
        high_entropy = entropy > 7.5
        
        return {
            "high_entropy": high_entropy,
            "entropy": entropy,
            "indicator": f"Very high entropy ({entropy:.2f}/8) suggests encryption" if high_entropy else None
        }
    
    def _analyze_content(self, file_bytes: bytes) -> Dict[str, Any]:
        """Analyze file content for ransomware indicators"""
        content = file_bytes[:5000]  # Analyze first 5KB
        
        # Check for ransom note signatures
        ransom_signatures = [
            b'YOUR FILES ARE ENCRYPTED',
            b'DECRYPT YOUR FILES',
            b'PAY BITCOIN',
            b'RANSOM',
            b'wallet address',
            b'.onion'
        ]
        
        for sig in ransom_signatures:
            if sig.lower() in content.lower():
                return {
                    "suspicious": True,
                    "indicator": "Ransom note text detected in file"
                }
        
        return {"suspicious": False}
    
    def _looks_random(self, data: bytes) -> bool:
        """Check if data looks random (potential encryption)"""
        if len(data) < 8:
            return False
        
        # Check byte distribution
        unique_bytes = len(set(data))
        
        # Random data typically has high unique byte ratio
        return unique_bytes > len(data) * 0.8
