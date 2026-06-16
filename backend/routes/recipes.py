from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data.recipes_data import recipes
from services.recipe_service import get_recipes_with_fallback

router = APIRouter()


class IngredientsRequest(BaseModel):
    ingredients: list[str]
    exclude_ingredients: list[str] = []
    intolerances: list[str] = []
    dietary_preference: str = ""


@router.post("/recipes")
def get_recipes(request: IngredientsRequest):
    cleaned_ingredients = [
        ingredient.strip()
        for ingredient in request.ingredients
        if ingredient.strip()
    ]

    if not cleaned_ingredients:
        raise HTTPException(
            status_code=400,
            detail="Bitte mindestens eine gültige Zutat eingeben.",
        )

    matching_recipes = get_recipes_with_fallback(
        cleaned_ingredients,
        recipes,
        exclude_ingredients=request.exclude_ingredients,
        intolerances=request.intolerances,
        dietary_preference=request.dietary_preference,
    )

    return {"recipes": matching_recipes}
