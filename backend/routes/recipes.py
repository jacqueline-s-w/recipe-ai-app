from fastapi import APIRouter
router= APIRouter()
from pydantic import BaseModel



class IngredientsRequest(BaseModel):
    ingredients:list[str]

@router.post("/recipes")
def get_recipes(request:IngredientsRequest):
    return{
        "recipes":[
            {"title": "Pasta Primavera", "ingredients": ["Pasta","Gemüse"], "time":20},
            {"title": "Tomatensuppe", "ingredients": ["Tomaten", "Zwiebeln"], "time":10},
        ]
    }