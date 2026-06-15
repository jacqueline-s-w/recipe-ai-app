from dotenv import load_dotenv
load_dotenv()

import os
import json
import base64
import hashlib
from io import BytesIO
import requests
from groq import Groq
from openai import OpenAI

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OAI_API_KEY = os.getenv("OAI_API_KEY") or os.getenv("OPENAI_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY)

CACHE_DIR = "static/cache"
CACHE_VERSION = "recipe-cache-v3-no-auto-images"
os.makedirs(CACHE_DIR, exist_ok=True)


def get_cache_key(
    ingredients: list[str],
    exclude_ingredients: list[str] | None = None,
    intolerances: list[str] | None = None,
) -> str:
    exclude_ingredients = exclude_ingredients or []
    intolerances = intolerances or []

    key_data = {
        "version": CACHE_VERSION,
        "ingredients": sorted(i.strip().lower() for i in ingredients if i.strip()),
        "exclude_ingredients": sorted(i.strip().lower() for i in exclude_ingredients if i.strip()),
        "intolerances": sorted(i.strip().lower() for i in intolerances if i.strip()),
    }

    return hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()


def clean_cached_recipe(recipe: dict) -> dict:
    recipe["image"] = None
    recipe["is_ai"] = True
    return recipe


def generate_image_from_prompt(prompt: str) -> str | None:
    image_key = hashlib.md5(prompt.encode()).hexdigest()
    filename = f"{image_key}.png"
    filepath = f"static/images/{filename}"

    os.makedirs("static/images", exist_ok=True)

    if os.path.exists(filepath):
        print("IMAGE CACHE HIT - kein neuer OpenAI-Call")
        return f"https://recipe-ai-app-pbyc.onrender.com/static/images/{filename}"

    if not OAI_API_KEY:
        print("IMAGE ERROR: OAI_API_KEY fehlt.")
        return None

    url = "https://api.openai.com/v1/images/generations"

    headers = {
        "Authorization": f"Bearer {OAI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-image-1.5",
        "prompt": prompt,
        "size": "1024x1024",
    }

    response = requests.post(url, headers=headers, json=payload, timeout=90)

    try:
        data = response.json()
    except Exception:
        print("IMAGE ERROR: OpenAI lieferte keine JSON-Antwort:")
        print(response.text[:500])
        return None

    if "data" not in data:
        print("IMAGE ERROR:", data)
        return None

    b64_data = data["data"][0].get("b64_json")
    if not b64_data:
        print("IMAGE ERROR: Kein b64_json erhalten:", data)
        return None

    image_bytes = base64.b64decode(b64_data)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return f"https://recipe-ai-app-pbyc.onrender.com/static/images/{filename}"


def transcribe_audio_command(audio_bytes: bytes, filename: str = "command.webm") -> str:
    if not OAI_API_KEY:
        raise RuntimeError("OAI_API_KEY fehlt.")

    audio_file = BytesIO(audio_bytes)
    audio_file.name = filename

    client = OpenAI(api_key=OAI_API_KEY)
    transcription = client.audio.transcriptions.create(
        model="gpt-4o-mini-transcribe",
        file=audio_file,
        language="de",
        prompt="Kurzer Sprachbefehl für eine Rezept-App: vorlesen, pause, weiter, stopp, zurück oder vor.",
    )

    return transcription.text.strip()


def _fallback_recipe(ingredients: list[str]) -> dict:
    cleaned = [ingredient.strip() for ingredient in ingredients if ingredient.strip()]
    title_base = ", ".join(cleaned[:3]) if cleaned else "verträglichen Zutaten"

    return {
        "title": f"Schnelles Rezept mit {title_base}",
        "time": 25,
        "time_minutes": 25,
        "portionen": "2",
        "ingredients": cleaned,
        "zubereitung": [
            "Alle Zutaten vorbereiten, waschen und in passende Stücke schneiden.",
            "Eine Pfanne oder einen Topf erhitzen und die Zutaten nach Garzeit nacheinander garen.",
            "Mit Salz, Pfeffer und passenden Gewürzen abschmecken.",
            "Alles kurz zusammenziehen lassen und warm servieren.",
        ],
        "image": None,
        "is_ai": True,
    }


def generate_recipe_with_ai(
    ingredients: list[str],
    exclude_ingredients: list[str] | None = None,
    intolerances: list[str] | None = None,
) -> dict:
    exclude_ingredients = exclude_ingredients or []
    intolerances = intolerances or []

    cleaned_ingredients = [ingredient.strip() for ingredient in ingredients if ingredient.strip()]

    cache_key = get_cache_key(cleaned_ingredients, exclude_ingredients, intolerances)
    cache_file = f"{CACHE_DIR}/{cache_key}.json"

    if os.path.exists(cache_file):
      with open(cache_file, "r", encoding="utf-8") as f:
          print("CACHE HIT - kein neuer KI-Call")
          return clean_cached_recipe(json.load(f))

    ingredients_text = ", ".join(cleaned_ingredients)
    exclude_text = ", ".join(exclude_ingredients) if exclude_ingredients else "keine"
    intolerances_text = ", ".join(intolerances) if intolerances else "keine"

    system_prompt = "Du bist ein Rezeptgenerator. Gib ausschließlich gültiges JSON zurück."

    user_prompt = f"""
Erstelle ein alltagstaugliches Rezept auf Deutsch.

Pflicht-Zutaten:
{ingredients_text}

Diese Zutaten dürfen nicht verwendet werden:
{exclude_text}

Diese Unverträglichkeiten müssen berücksichtigt werden:
{intolerances_text}

Wichtige Regeln:
- Verwende die Pflicht-Zutaten sinnvoll.
- Wenn eine Pflicht-Zutat wegen Unverträglichkeit oder Ausschluss nicht geeignet ist, verwende sie nicht und ersetze sie passend.
- Verwende keine ausgeschlossenen Zutaten.
- Bei Histamin keine Tomaten, kein Spinat, keine Avocado, keine Aubergine, keine Kichererbsen, keine Sojasauce, keinen Essig und keinen Wein verwenden.
- Wenn Fleisch, Fisch, Ei oder Milchprodukte eingegeben wurden, darf das Rezept diese Zutaten enthalten, solange keine Unverträglichkeit dagegen spricht.
- Erstelle nicht automatisch ein veganes Rezept.
- Gib eine realistische Zubereitungszeit in Minuten an.
- Gib ausschließlich dieses JSON-Format zurück:

{{
  "title": "kurzer Rezepttitel",
  "time_minutes": 25,
  "portionen": "2",
  "ingredients": ["Zutat mit Menge und Einheit", "..."],
  "zubereitung": ["Schritt-für-Schritt-Anleitung", "..."]
}}
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        data = json.loads(content)

        time_minutes = data.get("time_minutes") or data.get("time") or 25

        result = {
            "title": data.get("title", "KI-Rezept"),
            "time": time_minutes,
            "time_minutes": time_minutes,
            "portionen": data.get("portionen", "2"),
            "ingredients": data.get("ingredients", cleaned_ingredients),
            "zubereitung": data.get("zubereitung", []),
            "image": None,
            "is_ai": True,
        }

        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        return result

    except Exception as e:
        print("AI ERROR:", e)
        return _fallback_recipe(cleaned_ingredients)
