from dotenv import load_dotenv
load_dotenv()

import os
import json
import base64
import requests
from groq import Groq

# -------------------------------------------------------------------
# API Keys
# -------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OAI_API_KEY = os.getenv("OAI_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY)

print("GROQ KEY:", GROQ_API_KEY)
print("OPENAI KEY:", OAI_API_KEY)


# -------------------------------------------------------------------
# Bildgenerierung über OpenAI (gpt-image-1.5)
# -------------------------------------------------------------------
def generate_image_from_prompt(prompt: str) -> str:
    url = "https://api.openai.com/v1/images/generations"

    headers = {
        "Authorization": f"Bearer {OAI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-image-1.5",
        "prompt": prompt,
        "size": "1024x1024"
    }

    response = requests.post(url, headers=headers, json=payload)

    # Fehlerbehandlung
    try:
        data = response.json()
    except:
        print("IMAGE ERROR: OpenAI lieferte keine JSON-Antwort:")
        print(response.text[:500])
        return None

    if "data" not in data:
        print("IMAGE ERROR:", data)
        return None

    # Base64 extrahieren
    b64_data = data["data"][0].get("b64_json")
    if not b64_data:
        print("IMAGE ERROR: Kein b64_json erhalten:", data)
        return None

    # Base64 decodieren
    image_bytes = base64.b64decode(b64_data)

    # Datei speichern
    filename = f"generated_{abs(hash(prompt))}.png"
    filepath = f"static/{filename}"

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return f"http://localhost:8000/static/{filename}"


# -------------------------------------------------------------------
# Rezeptgenerierung mit Groq (stabil)
# -------------------------------------------------------------------
def generate_recipe_with_ai(ingredients: list[str]) -> dict:
    ingredients_text = ", ".join(ingredients)

    system_prompt = """
Du bist ein JSON-Generator. Antworte IMMER mit gültigem JSON.
Kein Text vor oder nach dem JSON. Keine Erklärungen.
"""

    user_prompt = f"""
Erstelle ein veganes Rezept auf Deutsch basierend auf diesen Zutaten:
{ingredients_text}

Gib ausschließlich folgendes JSON zurück:

{{
  "title": "string",
  "ingredients": ["string", ...],
  "zubereitung": ["string", ...],
  "image_prompt": "string"
}}
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )

        content = response.choices[0].message.content

        # JSON reparieren falls nötig
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1].strip()

        data = json.loads(content)

        # Bild passend zum Rezept generieren
        image_url = generate_image_from_prompt(data["image_prompt"])

        return {
            "title": data["title"],
            "ingredients": data["ingredients"],
            "zubereitung": data["zubereitung"],
            "image": image_url,
            "is_ai": True,
        }

    except Exception as e:
        print("AI ERROR:", e)
        return {
            "title": "AI Rezept (Fallback)",
            "ingredients": ingredients,
            "zubereitung": ["Fehler bei der KI-Generierung."],
            "image": None,
            "is_ai": True,
        }
