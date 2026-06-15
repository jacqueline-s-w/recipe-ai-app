from fastapi import FastAPI, Request
from fastapi.responses import Response
app= FastAPI()
from fastapi.middleware.cors import CORSMiddleware;

from routes.recipes import router as recipes_router
from routes.generate_recipe import router as generate_recipes_router

from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static")




app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(recipes_router, prefix="/api")
app.include_router(generate_recipes_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Backend läuft!"}

@app.get("/favicon.ico")
async def favicon():
 return Response(status_code=204)

@app.post("/api/regenerate-image")
async def regenerate_image(data: dict):
    title = data.get("title")
    ingredients = data.get("ingredients", [])

    if not title:
        return {"error": "Missing title"}

    ingredients_text = ", ".join(ingredients)

    # Bildprompt wie in ai_service.py
    image_prompt = (
        f"Professionelles Food-Foto von einem veganen Gericht: {title}. "
        f"Hauptzutaten: {ingredients_text}. "
        f"Stil: hochwertige Food Photography, helles natürliches Tageslicht, "
        f"realistisch, 50mm Linse, leichte Tiefenschärfe, serviert auf einem Teller, "
        f"sauberer Hintergrund, von leicht schräg oben fotografiert."
    )

    from services.ai_service import generate_image_from_prompt

    image_url = generate_image_from_prompt(image_prompt)

    return {"image": image_url}


@app.post("/api/transcribe-voice-command")
async def transcribe_voice_command(request: Request):
    audio_bytes = await request.body()

    if not audio_bytes:
        return {"error": "Keine Audiodaten erhalten."}

    filename = request.headers.get("x-audio-filename", "command.webm")

    try:
        from services.ai_service import transcribe_audio_command

        transcript = transcribe_audio_command(audio_bytes, filename)
        return {"transcript": transcript}
    except Exception as error:
        print("VOICE TRANSCRIPTION ERROR:", error)
        return {"error": "Sprachbefehl konnte nicht transkribiert werden."}
