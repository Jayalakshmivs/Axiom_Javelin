# AXIOM JAVELIN - FastAPI Backend

This folder contains the Python FastAPI backend for AXIOM JAVELIN security application.

## Features

- **Deepfake Detection**: CNN-based image analysis using EfficientNet
- **Phishing Detection**: URL analysis with pattern matching and ML
- **Ransomware Protection**: File encryption detection and monitoring

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Download Pre-trained Model (Optional)

The backend uses EfficientNet for transfer learning. Models are downloaded automatically on first run.

### 3. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Deepfake Detection
- `POST /api/deepfake/analyze` - Analyze image for manipulation
- `GET /api/deepfake/stats` - Get detection statistics

### Phishing Detection
- `POST /api/phishing/scan` - Scan URL for phishing threats
- `GET /api/phishing/history` - Get scan history
- `GET /api/phishing/stats` - Get phishing statistics

### Ransomware Protection
- `POST /api/ransomware/vault/upload` - Upload file to secure vault
- `GET /api/ransomware/vault/files` - List vault files
- `POST /api/ransomware/encryption/check` - Check file for ransomware encryption
- `POST /api/ransomware/integrity/check` - Run integrity check
- `GET /api/ransomware/monitor/threats` - Get threat events

## Environment Variables

Create a `.env` file:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Model Configuration
MODEL_PATH=./models
USE_GPU=false

# Database (optional - uses SQLite by default)
DATABASE_URL=sqlite:///./axiom_javelin.db

# Security
SECRET_KEY=your-secret-key-here
```

## Model Architecture

The deepfake detection uses a multi-layer approach:

1. **EfficientNet-B0**: Pre-trained backbone for feature extraction
2. **Custom Classification Head**: Binary classification (real/fake)
3. **Auxiliary Detectors**: 
   - Face artifact detection
   - Noise pattern analysis
   - Frequency domain analysis

## Training Your Own Model

See `train_model.py` for training instructions using your own dataset.

## Docker Deployment

```bash
docker build -t axiom-javelin-backend .
docker run -p 8000:8000 axiom-javelin-backend
```
