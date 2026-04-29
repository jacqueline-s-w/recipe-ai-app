from dotenv import load_dotenv
load_dotenv()

import os
import json
import base64
import hashlib
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
# Caching: gleiche Zutaten → kein neuer KI-Call
# -------------------------------------------------------------------
CACHE_DIR = "static/cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_key(ingredients: list[str]) -> str:
    key = ",".join(sorted(ingredients))
    return hashlib.md5(key.encode()).hexdigest()


# -------------------------------------------------------------------
# Bildgenerierung über OpenAI (günstig & optimiert)
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
        "size": "1024x1024"   # HALBIERT die Kosten!
    }

    response = requests.post(url, headers=headers, json=payload)

    try:
        data = response.json()
    except:
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

    filename = f"generated_{abs(hash(prompt))}.png"
    filepath = f"static/{filename}"

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return f"http://localhost:8000/static/{filename}"


# -------------------------------------------------------------------
# Rezeptgenerierung mit Groq (extrem gekürzt & günstig)
# -------------------------------------------------------------------
def generate_recipe_with_ai(ingredients: list[str]) -> dict:
    # Caching prüfen
    cache_key = get_cache_key(ingredients)
    cache_file = f"{CACHE_DIR}/{cache_key}.json"

    if os.path.exists(cache_file):
        with open(cache_file, "r", encoding="utf-8") as f:
            print("CACHE HIT – kein neuer KI-Call")
            return json.load(f)

    ingredients_text = ", ".join(ingredients)

    system_prompt = "Gib ausschließlich gültiges JSON zurück."

    user_prompt = f"""
Erstelle ein veganes Rezept aus: {ingredients_text}

Format:
{{
  "title": "",
  "ingredients": [],
  "zubereitung": []
}}
"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1
        )

        content = response.choices[0].message.content.strip()

        if content.startswith("```"):
            content = content.split("```")[1].strip()

        data = json.loads(content)

        # AUTOMATISCHER Bildprompt → spart Tokens
        image_prompt = f"Professionelles Food-Foto von {data['title']}, helles Tageslicht, realistisch, 50mm"

        image_url = generate_image_from_prompt(image_prompt)

        result = {
            "title": data["title"],
            "ingredients": data["ingredients"],
            "zubereitung": data["zubereitung"],
            "image": image_url,
            "is_ai": True,
        }

        # In Cache speichern
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        return result

    except Exception as e:
        print("AI ERROR:", e)
        return {
            "title": "AI Rezept (Fallback)",
            "ingredients": ingredients,
            "zubereitung": ["Fehler bei der KI-Generierung."],
            "image": None,
            "is_ai": True,
        }
