FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr (important for Docker logs)
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# ── System dependencies ────────────────────────────────────────────────────────
# libgl1 + libglib2.0-0 are needed by OpenCV/PIL for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ────────────────────────────────────────────────────────
# Install CPU-only PyTorch first (smaller, ~800MB vs ~2.5GB for CUDA)
RUN pip install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
COPY . .

# Create runtime directories (logger.py also does this, belt-and-suspenders)
RUN mkdir -p logs data/images

# Ensure the weights file is readable
RUN test -f data/deepfake_weights.pth && echo "Weights found" || echo "WARNING: deepfake_weights.pth not found — model will use heuristic fallback"

# ── Expose & Run ──────────────────────────────────────────────────────────────
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
