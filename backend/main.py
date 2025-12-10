from fastapi import FastAPI
from routes.recipes import router as recipe_router
from routes.generate_recipe import router as generate_router


app= FastAPI()

app.include_router(recipe_router, prefix="/api")
app.include_router(generate_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Backend läuft!"}