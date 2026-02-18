from fastapi import APIRouter
from pydantic import BaseModel

from services.recipe_service import find_matching_recipes

from data.recipes_data import recipes

router= APIRouter()



class IngredientsRequest(BaseModel):
    ingredients:list[str]






@router.post("/recipes")
def get_recipes(request:IngredientsRequest):
    
    matching_recipes = find_matching_recipes(request.ingredients, recipes)
    print(matching_recipes)
    return {"recipes":matching_recipes}

