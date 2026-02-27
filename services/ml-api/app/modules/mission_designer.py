from pydantic import BaseModel, Field
from openai import OpenAI
import os
import json

class MissionSpec(BaseModel):
    orbit_type: str = Field(description="The target orbit type (e.g. Sun-synchronous, Geostationary, LEO, etc.)")
    resolution_meters: float = Field(description="The ground sample distance (GSD) resolution in meters.")
    sensor_type: str = Field(description="The type of sensor required (e.g. Optical RGB, Multispectral, SAR (Radar), Thermal).")
    explanation: str = Field(description="A brief explanation of why these technical parameters were chosen based on the user's business scenario.")

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
6. YOU MUST ONLY RETURN A VALID JSON object with EXACTLY these four keys:
{
  "orbit_type": "string",
  "resolution_meters": float,
  "sensor_type": "string",
  "explanation": "string"
}
Do not use markdown formatting like ```json```.
"""

def generate_mission_spec(user_prompt: str) -> dict:
    """
    Sends the user's business scenario to OpenAI to generate a technical mission specification.
    """
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in Railway (or .env). Cannot run mission designer.")

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Using 3.5-turbo for speed and cost-effectiveness
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Scenario: {user_prompt}\nGenerate the technical specification in JSON format."}
            ],
            response_format={ "type": "json_object" },
            temperature=0.2 # Lower temperature for more deterministic/technical output
        )
        
        result_content = response.choices[0].message.content
        if not result_content:
            raise ValueError("Empty response from OpenAI")
            
        return json.loads(result_content)
        
    except Exception as e:
        print(f"Error in generate_mission_spec: {e}")
        # Throw it to the endpoint to catch
        raise e
