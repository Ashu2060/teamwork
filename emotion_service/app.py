import base64
from typing import Dict, List

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="MoodMate DeepFace Emotion Service")
_deepface_module = None
_cv2_module = None


class AnalyzeRequest(BaseModel):
    image: str


EMOTION_MAP = {
    "fear": "stressed",
    "happy": "happy",
    "sad": "sad",
    "angry": "angry",
    "neutral": "neutral",
    "surprise": "happy",
    "disgust": "angry"
}


def get_cv2():
    global _cv2_module

    if _cv2_module is None:
        import cv2

        _cv2_module = cv2

    return _cv2_module


def pick_best_emotion(emotion_scores: Dict[str, float]) -> str:
    happy = float(emotion_scores.get("happy", 0.0))
    sad = float(emotion_scores.get("sad", 0.0))
    angry = float(emotion_scores.get("angry", 0.0))
    fear = float(emotion_scores.get("fear", 0.0))
    surprise = float(emotion_scores.get("surprise", 0.0))
    disgust = float(emotion_scores.get("disgust", 0.0))
    neutral = float(emotion_scores.get("neutral", 0.0))

    if happy >= 18 or surprise >= 20:
        return "happy"

    if sad >= 16:
        return "sad"

    if angry >= 14 or disgust >= 14:
        return "angry"

    if fear >= 12 or (fear + sad * 0.55 + angry * 0.35) >= 22:
        return "stressed"

    if neutral >= 35:
        return "neutral"

    ranked = sorted(emotion_scores.items(), key=lambda item: item[1], reverse=True)
    top_raw = ranked[0][0] if ranked else "neutral"
    return EMOTION_MAP.get(top_raw, "neutral")


def decode_image(image_data: str):
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    image_bytes = base64.b64decode(image_data)
    image_array = np.frombuffer(image_bytes, np.uint8)
    cv2 = get_cv2()
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image")

    return image


def normalize_scores(emotion_scores: Dict[str, float]) -> List[Dict[str, float]]:
    mapped = {}
    for raw_label, score in emotion_scores.items():
        mapped_label = EMOTION_MAP.get(raw_label, "neutral")
        mapped[mapped_label] = mapped.get(mapped_label, 0) + float(score or 0)

    ranked = sorted(mapped.items(), key=lambda item: item[1], reverse=True)
    return [{"label": label, "value": round(score / 100, 4)} for label, score in ranked[:5]]


def get_deepface():
    global _deepface_module

    if _deepface_module is None:
        from deepface import DeepFace

        _deepface_module = DeepFace

    return _deepface_module


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    try:
        image = decode_image(request.image)
        result = get_deepface().analyze(
            img_path=image,
            actions=["emotion"],
            detector_backend="opencv",
            enforce_detection=False,
            silent=True
        )

        if isinstance(result, list):
            result = result[0]

        emotion_scores = result.get("emotion", {})
        raw_ranked = sorted(emotion_scores.items(), key=lambda item: item[1], reverse=True)
        dominant_emotion = pick_best_emotion(emotion_scores)
        confidence = max(
            (item["value"] for item in normalize_scores(emotion_scores) if item["label"] == dominant_emotion),
            default=0.0
        )

        return {
            "emotion": dominant_emotion,
            "confidence": round(confidence, 4),
            "breakdown": normalize_scores(emotion_scores),
            "rawBreakdown": [
                {"label": label, "value": round(float(score) / 100, 4)}
                for label, score in raw_ranked[:6]
            ],
            "faceDetected": True
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
