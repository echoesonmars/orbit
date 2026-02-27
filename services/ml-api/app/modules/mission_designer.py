from pydantic import BaseModel, Field
from openai import OpenAI
import os
import json

class MissionSpec(BaseModel):
    orbit_type: str = Field(description="The target orbit type (e.g. Sun-synchronous, Geostationary, LEO, etc.)")
    resolution_meters: float = Field(description="The ground sample distance (GSD) resolution in meters.")
    sensor_type: str = Field(description="The type of sensor required (e.g. Optical RGB, Multispectral, SAR (Radar), Thermal).")
    explanation: str = Field(description="A brief explanation of why these technical parameters were chosen based on the user's business scenario.")
    estimated_budget_usd: int = Field(description="A rough estimate of the mission budget in USD based on standard commercial prices.")

# Read from .env file or environment variable
# If we deploy via Railway, we need to add OPENAI_API_KEY there too
api_key = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = """You are a Senior Aerospace Mission Design Engineer with 20 years of experience.
Your job is to translate layman business or scientific requirements into precise technical satellite specifications.

RULES:
1. If the user needs to track vehicles, people, or very small details (like counting cars in a parking lot), you MUST assign an Optical sensor with high resolution (< 1.0m) and a Sun-synchronous orbit (SSO).
2. If the user's scenario involves monitoring during the night, penetrating clouds, fog, or tracking ships in bad weather (like London in winter), optical sensors will NOT work. You MUST assign a SAR (Synthetic Aperture Radar) sensor.
3. If they need broad agricultural monitoring (e.g., crop health, NDVI, forestry), assign a Multispectral sensor with medium resolution (e.g., 10m - 30m).
4. If they need weather or continent monitoring, assign a Geostationary orbit with very low resolution (e.g., 1000m+).
5. Provide a strong technical explanation justifying your choices.
6. YOU MUST ONLY RETURN A VALID JSON object with EXACTLY these five keys:
{
  "orbit_type": "string",
  "resolution_meters": float,
  "sensor_type": "string",
  "explanation": "string",
  "estimated_budget_usd": integer
}
Do not use markdown formatting like ```json```.
7. YOU MUST respond in the exactly same language that the user used in their prompt (e.g. if the user writes in Russian, write the explanation and string values in Russian. If Kazakh, use Kazakh. If English, use English).
"""

def generate_mission_spec(messages_history: list) -> any:
    """
    Sends the user's chat history to OpenAI to generate a technical mission specification as a stream.
    """
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in Railway (or .env). Cannot run mission designer.")

    client = OpenAI(api_key=api_key)

    # Prepend the system prompt if the chat history doesn't already have one
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages_history:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    try:
        response_stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={ "type": "json_object" },
            temperature=0.2,
            stream=True # Streaming enabled!
        )
        
        # Async generator pattern for FastAPI StreamingResponse
        async def event_generator():
            for chunk in response_stream:
                content = chunk.choices[0].delta.content
                if content is not None:
                    # Yield raw string fragments
                    yield content

        return event_generator()
        
    except Exception as e:
        print(f"Error in generate_mission_spec: {e}")
        raise e
