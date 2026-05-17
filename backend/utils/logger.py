"""
Logging configuration — Windows-safe (forces UTF-8 on stdout to avoid
UnicodeEncodeError when emoji characters are written to cp1252 terminals).
"""

import io
import os
import sys
from loguru import logger


def _safe_stdout():
    """Return a UTF-8 wrapped stdout so emoji in log lines don't crash on Windows."""
    if sys.platform != "win32":
        return sys.stdout
    try:
        return io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
    except (AttributeError, ValueError):
        # In some environments stdout.buffer may not exist or be closed (e.g. pytest captures, docker)
        return sys.stdout


def setup_logger():
    """Configure and return the loguru logger."""
    logger.remove()   # Remove the default handler

    # Console handler — UTF-8 safe
    logger.add(
        _safe_stdout(),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="INFO",
        colorize=False,
    )

    # File handler — always UTF-8
    os.makedirs("logs", exist_ok=True)
    logger.add(
        "logs/axiom_javelin.log",
        rotation="10 MB",
        retention="7 days",
        level="DEBUG",
        encoding="utf-8",
    )

    return logger
