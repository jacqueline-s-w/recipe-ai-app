from fastapi import APIRouter
from pydantic import BaseModel

router=APIRouter()

class GenerateRequest(BaseModel):
    ingredients: list[str]


@router.post("/generate-recipe")
def generate_recipe(request:GenerateRequest):
    #später durch "echten" KI-Code ersetzen
    
    return {"recipe": {"title":"Platzhalter-Rezept",
    "steps":["Schritt 1", "Schritt 2"],
    "igredients_used": request.ingredients
    }}