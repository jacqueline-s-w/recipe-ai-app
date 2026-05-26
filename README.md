# recipe-ai-app

AI-assisted Recipe Finder built with React &amp; FastAPI

📘 AI Recipe Finder – README.md
🧠✨ KI‑gestützte Rezeptsuche basierend auf Zutaten, Ausschlüssen & Intoleranzen
Der AI Recipe Finder ist eine Fullstack‑Webanwendung, die Nutzer:innen ermöglicht,
Rezepte anhand ihrer vorhandenen Zutaten zu finden – inklusive:

Allergenerkennung

Alternativen für Allergene

Intoleranz‑Filter

Hard‑Exclude („ohne Zwiebel“, „ohne Zucker“, …)

KI‑Fallback‑Rezepte

Bildgenerierung für jedes Rezept

Das Projekt wurde mit MERN + Python FastAPI + Groq/OpenAI umgesetzt.

🚀 Live‑Demo
🔗 Live‑Link (Render): wird nach Deployment eingefügt  
🔗 GitHub‑Repo: optional einfügen

📸 Screenshots
Füge hier deine eigenen Screenshots ein:

Code
![Startseite](./screenshots/home.png)
![RecipeCard](./screenshots/recipecard.png)
![Allergene](./screenshots/allergene.png)
🛠️ Tech‑Stack
Frontend
React + Vite

TailwindCSS

Fetch API

Skeleton Loader

Dynamische RecipeCards

Backend
Python FastAPI

Groq / OpenAI API

Eigene Matching‑Engine

Intoleranz‑Filter

Hard‑Exclude

KI‑Fallback

Deployment
Render (Backend + Frontend)

Static Hosting

CORS‑Konfiguration

⭐ Features
🔍 Intelligente Rezeptsuche
Matching basierend auf Zutaten

Synonym‑Matching („Pasta“ → „Nudeln“)

Fuzzy‑Matching („Tomat“ → „Tomate“)

Bonus/Penalty‑System für bessere Treffer

⚠️ Allergene automatisch erkennen
Gluten

Laktose

Nüsse

Soja

Sellerie

Sesam

Ei

Fisch

💡 Alternativen vorschlagen
Beispiel:

Laktose → Hafermilch, Mandelmilch, veganer Käse

Gluten → glutenfreie Nudeln, Reis, Quinoa

🚫 Hard‑Exclude
Nutzer:innen können Zutaten ausschließen:
„ohne Zwiebel“, „ohne Knoblauch“, „ohne Zucker“, …

🧬 Intoleranz‑Filter
Unterstützt u. a.:

Histamin

Fruktose

Gluten

Laktose

Soja

Nüsse

Tierisches Eiweiß

🤖 KI‑Fallback
Wenn keine Rezepte passen:

KI generiert ein vollständiges Rezept

inkl. Zutaten, Schritten & Bild

🖼️ Bild‑Generierung
Automatisch für jedes Rezept

Button: „Bild neu generieren“

📦 Installation & Setup

1. Repository klonen
   bash
   git clone <dein-repo>
   cd ai-recipe-finder
2. Backend starten (FastAPI)
   bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   Backend läuft unter:

Code
http://localhost:8000 3) Frontend starten (React + Vite)
bash
cd frontend
npm install
npm run dev
Frontend läuft unter:

Code
http://localhost:5173
🔌 API‑Endpoints
POST /api/recipes
Findet passende Rezepte.

Body:

json
{
"ingredients": ["nudeln", "tomaten"],
"exclude_ingredients": ["zwiebel"],
"intolerances": ["laktose"]
}
Response:

json
{
"recipes": [
{
"match_percent": 82.5,
"missing_ingredients": ["Basilikum"],
"allergens": ["gluten"],
"alternatives": { "gluten": ["glutenfreie nudeln"] },
"recipe": { ... }
}
]
}
🧪 Matching‑Engine (Kurz erklärt)
Die Matching‑Engine kombiniert:

Tokenisierung

Normalisierung

Synonym‑Erweiterung

Fuzzy‑Matching

Score‑Berechnung

Bonus/Penalty‑System

Intoleranz‑Filter

Hard‑Exclude

Wenn keine Treffer ≥ 30 %:

➡️ KI‑Fallback generiert ein Rezept.

🧑‍💻 Entwickelt von
Jacqueline Scharrer‑Weißgerber  
Fullstack MERN & Python Developer
Hannover, Deutschland
