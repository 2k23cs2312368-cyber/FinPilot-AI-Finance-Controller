import json
import os
from typing import Dict, Any, Optional
import httpx
from app.config import settings

class AIService:
    """
    Unified AI Service Layer.
    Provides intelligent responses via Google Gemini API when available,
    and falls back to deterministic rule-based analysis engine when unavailable.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    def is_gemini_active(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def get_ai_mode(self) -> str:
        return "Gemini AI (Active)" if self.is_gemini_active() else "Demo AI Mode (Deterministic Engine)"

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes an AI call via Gemini if configured, or gracefully executes
        the deterministic fallback engine.
        """
        if self.is_gemini_active():
            try:
                # Call Gemini API via modern REST endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": f"System Context:\n{system_prompt}\n\nTask:\n{user_prompt}\n\nRespond ONLY with a JSON object adhering strictly to the facts provided."}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.2,
                        "response_mime_type": "application/json"
                    }
                }
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        result = resp.json()
                        text = result["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text)
                        parsed["ai_engine"] = "Google Gemini 1.5 Flash"
                        return parsed
            except Exception as e:
                # Log and fallback safely
                print(f"[AIService] Gemini call failed or timed out: {e}. Falling back to Deterministic AI Engine.")

        # Fallback to rich deterministic engine output
        fallback_data["ai_engine"] = "Demo AI Mode (Deterministic Financial Engine)"
        return fallback_data

ai_service = AIService()
