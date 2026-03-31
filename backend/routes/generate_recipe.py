from fastapi import APIRouter
from pydantic import BaseModel

router=APIRouter()

class GenerateRequest(BaseModel):
    ingredients: list[str]
    zubereitung: list[str]


@router.post("/generate-recipe")
def generate_recipe(request:GenerateRequest):
    #später durch "echten" KI-Code ersetzen
    
    return {"recipe": {"title":"Platzhalter-Rezept",                   
    "schritte":request.zubereitung,
    "igredients_used": request.ingredients
    }}