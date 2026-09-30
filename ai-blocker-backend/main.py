from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from detector.vision import SyntheticImageDetector

app = FastAPI(title="Unplug AI Engine")

# Allow extension to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["POST"],
)

image_detector = SyntheticImageDetector(threshold=0.82)

@app.post("/api/v1/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")
        
    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")
        
        # TODO: Add Redis caching here keyed by image hash to prevent re-analyzing viral images
        results = image_detector.analyze(img)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))