from fastapi import FastAPI
from routes.recipes import router as recipes_router
from routes.generate_recipe import router as generate_recipes_router


app= FastAPI()

app.include_router(recipes_router, prefix="/api")
app.include_router(generate_recipes_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Backend läuft!"}