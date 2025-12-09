from pydantic import BaseModel

class IngredientsRequest(BaseModel):
    ingredients: list[str]

@app.post("/api/generate-recipe")
def generate_recipe(request:IngredientRequest):
    # 1. Zutaten entgegen nehmen
    # 2. später KI-Aufrug einbauen
    # 3. strukturierte Antwort zurückgeben
    return {"recipe": "Platzhalter"}