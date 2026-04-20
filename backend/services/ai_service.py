from dotenv import load_dotenv
load_dotenv()

import os
import json
import requests
from groq import Groq

# -------------------------------------------------------------------
# API Keys
# -------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
FAL_API_KEY = os.getenv("FAL_API_KEY")   # <-- DEIN FAL KEY

client = Groq(api_key=GROQ_API_KEY)

print("Verfügbare Groq-Modelle:")
for m in client.models.list().data:
    print("-", m.id)

print("GROQ KEY:", GROQ_API_KEY)
print("FAL KEY:", FAL_API_KEY)


# -------------------------------------------------------------------
# Bildgenerierung mit FAL.AI (kostenlos)
# -------------------------------------------------------------------
def generate_image_from_prompt(prompt: str) -> str:
    url = "https://fal.run/fal-ai/flux-lora"

    headers = {
        "Authorization": f"Bearer {FAL_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": prompt,
        "image_size": "square"
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        print("IMAGE ERROR:", response.text)
        return None

    data = response.json()

    # Fal.ai liefert direkte Bild-URLs
    image_url = data["images"][0]["url"]

    return image_url  # keine Speicherung nötig!


# -------------------------------------------------------------------
# Rezeptgenerierung mit Groq
# -------------------------------------------------------------------
def generate_recipe_with_ai(ingredients: list[str]) -> dict:
    ingredients_text = ", ".join(ingredients)

    prompt = f"""
Erstelle ein veganes Rezept auf Deutsch basierend auf diesen Zutaten:
{ingredients_text}

Antworte ausschließlich als JSON im folgenden Format:

{{
  "title": "string",
  "ingredients": ["string", ...],
  "zubereitung": ["string", ...],
  "image_prompt": "string"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        # Bild generieren (Fal.ai)
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
