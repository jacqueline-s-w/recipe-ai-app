#Mock AI recipe generator
from dotenv import load_dotenv
load_dotenv()

import os
from groq import Groq
import json

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY)
print("Verfügbare Groq-Modelle:")
for m in client.models.list().data:
    print("-", m.id)


print("GROQ KEY:", GROQ_API_KEY)


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

        return {
            "title": data["title"],
            "ingredients": data["ingredients"],
            "zubereitung": data["zubereitung"],
            "image": None,
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
