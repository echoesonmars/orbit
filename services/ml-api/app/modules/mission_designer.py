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
You are also a friendly assistant who can have normal conversations.

BEHAVIOR RULES:
1. If the user greets you, asks a question, or makes casual conversation (e.g. "привет", "hello", "что ты умеешь?", "help"), respond naturally in plain text. Be friendly, professional, and helpful. Explain what you can do: design satellite missions, recommend orbits, sensors, etc.
2. ONLY when the user describes a real mission requirement or business scenario (e.g. "I need to monitor forests", "следить за портом", "track ships", "analyze agriculture"), generate a technical specification as a JSON object.

WHEN GENERATING A MISSION SPEC (JSON):
- You MUST return ONLY a valid JSON object with exactly these five keys:
{
  "orbit_type": "Sun-synchronous (SSO)",
  "resolution_meters": 0.5,
  "sensor_type": "Optical RGB",
  "explanation": "For counting vehicles in parking lots, a high-resolution optical sensor is needed...",
  "estimated_budget_usd": 85000
}
- Do NOT wrap JSON in markdown (no ```json```).
- If the user needs to track small objects → Optical sensor, high res (<1m), SSO orbit.
- If the scenario involves night/clouds/fog → SAR (Synthetic Aperture Radar).
- Agricultural monitoring → Multispectral, medium resolution (10-30m).
- Weather/continent-scale → Geostationary orbit, low resolution (1000m+).

LANGUAGE RULE: Always respond in the same language the user is using.
"""

def generate_mission_spec(messages_history: list) -> any:
    """
    Sends the user's chat history to OpenAI to generate a response as a stream.
    The AI will either chat normally or generate a JSON mission spec depending on context.
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
            temperature=0.4,
            stream=True
        )
        
        # Async generator pattern for FastAPI StreamingResponse
        async def event_generator():
            for chunk in response_stream:
                content = chunk.choices[0].delta.content
                if content is not None:
                    yield content

        return event_generator()
        
    except Exception as e:
        print(f"Error in generate_mission_spec: {e}")
        raise e

