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
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY)

print("GROQ KEY:", GROQ_API_KEY)
print("OPENROUTER KEY:", OPENROUTER_API_KEY)


# -------------------------------------------------------------------
# Bildgenerierung über OpenRouter (Stable Diffusion XL)
# -------------------------------------------------------------------
def generate_image_from_prompt(prompt: str) -> str:
    url = "https://openrouter.ai/api/v1/images"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "black-forest-labs/flux-1.1-lite",
        "prompt": prompt,
        "size": "1024x1024"
    }

    response = requests.post(url, headers=headers, json=payload)

    # Falls OpenRouter HTML zurückgibt → Fehler anzeigen
    try:
        data = response.json()
    except:
        print("IMAGE ERROR: Server lieferte keine JSON-Antwort:")
        print(response.text[:500])  # nur die ersten 500 Zeichen
        return None

    if "data" not in data:
        print("IMAGE ERROR:", data)
        return None

    image_url = data["data"][0]["url"]

    # Bild herunterladen
    image_bytes = requests.get(image_url).content

    filename = f"generated_{abs(hash(prompt))}.png"
    filepath = f"static/{filename}"

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return f"http://localhost:8000/static/{filename}"



# -----------------------------------------------------------------
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
