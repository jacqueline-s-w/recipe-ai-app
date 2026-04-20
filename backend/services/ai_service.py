#Mock AI recipe generator
from dotenv import load_dotenv
load_dotenv()


# für Rezeptgenerierung notwendig
import os
from groq import Groq
import json

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)
print("Verfügbare Groq-Modelle:")
for m in client.models.list().data:
    print("-", m.id)


print("GROQ KEY:", GROQ_API_KEY)
# ______________________________________________________________________
#  für Bildgenerierung notwendig
import base64
import requests

STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")

def generate_image_from_promt(prompt: str)-> str:
    url="https://api.stability.ai/v2beta/stable-image/generate/sd3"

    headers={
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Accept": "application/json"
    }

    files={
        "prompt": (None, prompt),
        "output_format": (None, "png")
    }

    # body={
    #     "prompt": prompt,
    #     "output_format": "png"
    # }

    response=requests.post(url, headers=headers, files=files)

    if response.status_code != 200:
        print("IMAGE ERROR:", response.text)
        return None
    
    data = response.json()

    # Bild ist Base64 -> wir speichern es als lokal
    image_base64 = data["image"]
    image_bytes= base64.b64decode(image_base64)

    # Speicherort
    filename = f"generated_{abs(hash(prompt))}.png"
    filepath = f"static/{filename}"

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    # URL für Frontend
    # !!!!!!
    return f"http://localhost:8000/static/{filename}"
    # !!!!!!


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

- title: kurzer, passender Rezepttitel
- ingredients: konkrete Zutatenliste mit Mengenangaben
- zubereitung: Schritt-für-Schritt-Anleitung
- image_prompt: englische Beschreibung eines Food-Fotos
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",   # kostenloses, schnelles Modell
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        image_url= generate_image_from_promt(data["image_prompt"])
        return {
            "title": data["title"],
            "ingredients": data["ingredients"],
            "zubereitung": data["zubereitung"],
            "is_ai": True,
            "image": image_url,
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

