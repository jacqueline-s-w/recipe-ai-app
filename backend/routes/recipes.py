from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import HTTPException

from services.recipe_service import get_recipes_with_fallback

from data.recipes_data import recipes
router= APIRouter()



class IngredientsRequest(BaseModel):
    ingredients:list[str]






@router.post("/recipes")
def get_recipes(request:IngredientsRequest):


#Zutaten bereinigen , Whitespace entfernen
     cleaned_ingredients=[
        ingredient.strip()
        for ingredient in request.ingredients
        if ingredient.strip()
     ]

   # Validierung
     if not cleaned_ingredients:
        raise HTTPException(
            status_code=400,
            detail="Bitte mindestens eine gültige Zutat eingeben."
        )
    
    # Service aufrufen
     matching_recipes = get_recipes_with_fallback(cleaned_ingredients, recipes)
     print(matching_recipes)
     return {"recipes":matching_recipes}

