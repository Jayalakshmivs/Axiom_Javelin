"""
Phishing Detection Service — MULE (Multi-layered URL Examination)
High-accuracy heuristic URL analysis with Levenshtein typosquatting detection
"""

import re
import asyncio
from typing import Dict, List, Any, Tuple
from urllib.parse import urlparse

try:
    import tldextract
    TLDEXTRACT_AVAILABLE = True
except ImportError:
    TLDEXTRACT_AVAILABLE = False

from utils.logger import setup_logger

logger = setup_logger()


# ── Levenshtein Distance ─────────────────────────────────────────────────────
def _levenshtein(a: str, b: str) -> int:
    """Compute Levenshtein edit-distance between two strings."""
    if len(a) < len(b):
        return _levenshtein(b, a)
    if len(b) == 0:
        return len(a)
    prev_row = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr_row = [i + 1]
        for j, cb in enumerate(b):
            cost = 0 if ca == cb else 1
            curr_row.append(min(
                curr_row[j] + 1,        # insert
                prev_row[j + 1] + 1,    # delete
                prev_row[j] + cost      # substitute
            ))
        prev_row = curr_row
    return prev_row[-1]


class PhishingDetector:
    """
    MULE — Multi-Layered URL Examination engine.

    Detection Layers:
    1. Whitelist fast-pass (known-safe domains)
    2. Typosquatting via Levenshtein distance
    3. TLD reputation scoring
    4. Protocol / HTTPS enforcement
    5. Domain entropy & obfuscation
    6. URL structure anomalies (IP, @, encoding, length)
    7. Keyword analysis
    8. Punycode / IDN homograph detection
    """

    # ── Known-safe domains (registered domain only) ──────────────────────
    WHITELIST = frozenset([
        # Search / Productivity
        "google.com", "google.co.uk", "google.co.in", "google.de",
        "gmail.com", "youtube.com", "docs.google.com",
        "bing.com", "yahoo.com", "duckduckgo.com",
        # Social
        "facebook.com", "fb.com", "instagram.com", "twitter.com", "x.com",
        "linkedin.com", "reddit.com", "pinterest.com", "tiktok.com",
        "whatsapp.com", "telegram.org", "discord.com", "snapchat.com",
        # Tech / Dev
        "github.com", "gitlab.com", "stackoverflow.com", "microsoft.com",
        "outlook.com", "live.com", "office.com", "azure.com",
        "apple.com", "icloud.com",
        # Shopping / Finance
        "amazon.com", "amazon.co.uk", "amazon.in", "amazon.de",
        "paypal.com", "paypal.me", "stripe.com", "shopify.com",
        "ebay.com", "walmart.com", "flipkart.com",
        # Banking
        "chase.com", "wellsfargo.com", "bankofamerica.com",
        "citibank.com", "hsbc.com",
        # Entertainment
        "netflix.com", "spotify.com", "twitch.tv", "hulu.com",
        "disneyplus.com",
        # Information
        "wikipedia.org", "medium.com", "quora.com",
        # Cloud / Infra
        "aws.amazon.com", "cloud.google.com", "dropbox.com",
        "zoom.us", "slack.com",
    ])

    # Brand names to protect against impersonation
    BRAND_NAMES: Dict[str, List[str]] = {
        "paypal":    ["paypal.com", "paypal.me"],
        "amazon":    ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.in"],
        "google":    ["google.com", "google.co.uk", "google.de", "google.co.in", "gmail.com", "youtube.com"],
        "microsoft": ["microsoft.com", "outlook.com", "live.com", "office.com", "azure.com"],
        "apple":     ["apple.com", "icloud.com"],
        "facebook":  ["facebook.com", "fb.com", "messenger.com", "instagram.com"],
        "netflix":   ["netflix.com"],
        "twitter":   ["twitter.com", "x.com"],
        "linkedin":  ["linkedin.com"],
        "chase":     ["chase.com"],
        "instagram": ["instagram.com"],
        "whatsapp":  ["whatsapp.com"],
    }

    HIGH_RISK_TLDS = frozenset([
        "xyz", "tk", "ml", "ga", "cf", "gq", "top",
        "click", "loan", "work", "racing", "download",
        "win", "bid", "stream", "trade", "date", "faith",
        "zip", "mov", "php",
    ])

    PHISHING_KEYWORDS = [
        "login", "signin", "sign-in", "verify", "account", "secure",
        "update", "confirm", "banking", "password", "authenticate",
        "validation", "suspended", "locked", "unusual", "activity",
        "credential", "wallet", "invoice", "billing",
    ]

    SHORTENERS = frozenset([
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd",
        "buff.ly", "ow.ly", "rebrand.ly", "cutt.ly",
    ])

    def __init__(self):
        pass

    # ── Public API ────────────────────────────────────────────────────────
    async def analyze(self, url: str) -> Dict[str, Any]:
        """Run all MULE layers against *url* asynchronously."""
        return await asyncio.to_thread(self._analyze_sync, url)

    def _analyze_sync(self, url: str) -> Dict[str, Any]:
        """Synchronous implementation of MULE analysis."""
        raw = url.strip()
        if not raw:
            return self._safe_result("Empty URL provided.")

        # Normalise
        if not raw.startswith(("http://", "https://")):
            raw = f"https://{raw}"

        # Extract domain parts
        if TLDEXTRACT_AVAILABLE:
            ext = tldextract.extract(raw)
            registered_domain = f"{ext.domain}.{ext.suffix}".lower()
            subdomain = ext.domain.lower()
            tld = ext.suffix.lower()
        else:
            parsed = urlparse(raw)
            registered_domain = parsed.netloc.lower()
            subdomain = registered_domain.split(".")[0] if "." in registered_domain else registered_domain
            tld = registered_domain.split(".")[-1] if "." in registered_domain else ""

        # ── Layer 1: Whitelist fast-pass ──────────────────────────────────
        if registered_domain in self.WHITELIST:
            return {
                "status": "safe",
                "confidence": 99.9,
                "details": f"Verified official domain: {registered_domain}",
                "prevention": "Safe to use.",
                "findings": ["Domain is in the verified whitelist"],
            }

        score = 0
        reasons: List[str] = []

        # ── Layer 2: Typosquatting (Levenshtein) ─────────────────────────
        typo_score, typo_reason = self._check_typosquatting(subdomain, registered_domain)
        score += typo_score
        if typo_reason:
            reasons.append(typo_reason)

        # ── Layer 3: TLD reputation ──────────────────────────────────────
        if tld in self.HIGH_RISK_TLDS:
            score += 35
            reasons.append(f"High-risk TLD (.{tld}) often associated with malicious activity.")

        # ── Layer 4: Protocol check ──────────────────────────────────────
        if raw.startswith("http://"):
            score += 20
            reasons.append("Lacks secure HTTPS encryption.")

        # ── Layer 5: Domain entropy & obfuscation ────────────────────────
        digit_hyphen_count = len(re.findall(r'[0-9\-]', subdomain))
        if digit_hyphen_count > 5:
            score += 20
            reasons.append("High domain entropy: excessive numbers or hyphens.")
        elif digit_hyphen_count > 3:
            score += 10
            reasons.append("Moderate domain entropy: some numbers or hyphens detected.")

        # ── Layer 6: URL structure anomalies ─────────────────────────────
        struct_score, struct_reasons = self._analyze_structure(raw)
        score += struct_score
        reasons.extend(struct_reasons)

        # ── Layer 7: Keyword analysis ────────────────────────────────────
        kw_hits = [k for k in self.PHISHING_KEYWORDS if k in raw.lower()]
        if len(kw_hits) >= 3:
            score += 25
            reasons.append(f"Multiple credential keywords: {', '.join(kw_hits[:4])}")
        elif len(kw_hits) >= 1:
            score += 10
            reasons.append(f"Credential keyword detected: {kw_hits[0]}")

        # ── Layer 8: Punycode / IDN homograph ────────────────────────────
        if "xn--" in registered_domain:
            score += 30
            reasons.append("Punycode (IDN) domain detected — possible homograph attack.")

        # ── Layer 9: URL shortener ───────────────────────────────────────
        if registered_domain in self.SHORTENERS:
            score += 15
            reasons.append("URL shortener detected — destination unknown.")

        # ── Verdict ──────────────────────────────────────────────────────
        # Clamp to 0-100
        score = max(0, min(score, 100))

        if score >= 65:
            status = "malicious"
        elif score >= 30:
            status = "risk"
        else:
            status = "safe"

        # Confidence: how sure we are about the *verdict*
        if status == "safe":
            confidence = max(60, 100 - score)
        else:
            confidence = max(30, min(score, 99))

        details = " | ".join(reasons) if reasons else "Pattern consistent with legitimate domain standards."
        prevention = (
            "Close tab immediately and do NOT enter any personal information."
            if status == "malicious"
            else "Exercise caution — verify the source before proceeding."
            if status == "risk"
            else "Safe to use."
        )

        return {
            "status": status,
            "confidence": round(confidence, 1),
            "details": details,
            "prevention": prevention,
            "findings": reasons if reasons else ["No threats detected"],
        }

    # ── Typosquatting via Levenshtein ─────────────────────────────────────
    def _check_typosquatting(self, subdomain: str, registered_domain: str) -> Tuple[int, str]:
        """
        Compare the domain name against known brand names using edit distance.
        Only flag when the domain is *close* to a brand but NOT the official domain.
        """
        # Also normalise common leet-speak substitutions for comparison
        normalised = (
            subdomain
            .replace("0", "o")
            .replace("1", "l")
            .replace("3", "e")
            .replace("5", "s")
            .replace("@", "a")
            .replace("$", "s")
        )

        for brand, official_domains in self.BRAND_NAMES.items():
            # Skip if this IS an official domain
            if registered_domain in official_domains:
                return 0, ""

            # Exact match after leet-normalisation → strong signal
            if normalised == brand:
                return 70, f"Visual deception detected: impersonation of {brand.capitalize()} via character substitution."

            # Levenshtein distance check — only for domains similar in length
            if abs(len(subdomain) - len(brand)) <= 3:
                dist = _levenshtein(normalised, brand)
                if dist <= 1:
                    return 60, f"Typosquatting detected: '{subdomain}' is 1 edit away from '{brand}'."
                elif dist == 2 and len(brand) >= 5:
                    return 40, f"Possible typosquatting: '{subdomain}' is close to '{brand}' (distance {dist})."

        return 0, ""

    # ── URL structure anomalies ───────────────────────────────────────────
    def _analyze_structure(self, url: str) -> Tuple[int, List[str]]:
        score = 0
        findings: List[str] = []

        # IP address instead of domain
        ip_re = r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'
        if re.search(ip_re, url):
            score += 30
            findings.append("Direct IP address used instead of domain name.")

        # @ in URL (credential trick)
        if "@" in url:
            score += 25
            findings.append("@ symbol in URL (potential credential trick).")

        # Encoded characters
        if "%2F" in url.upper() or "%3A" in url.upper() or "%40" in url.upper():
            score += 15
            findings.append("Suspicious URL-encoded characters detected.")

        # Excessive length
        if len(url) > 200:
            score += 10
            findings.append("Unusually long URL.")

        # Data URI
        if url.lower().startswith("data:"):
            score += 40
            findings.append("Data URI detected — inline content, not a real website.")

        return score, findings

    # ── Convenience helpers ───────────────────────────────────────────────
    @staticmethod
    def _safe_result(details: str) -> Dict[str, Any]:
        return {
            "status": "safe",
            "confidence": 95.0,
            "details": details,
            "prevention": "Safe to use.",
            "findings": [details],
        }
