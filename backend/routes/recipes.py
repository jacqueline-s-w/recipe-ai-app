from fastapi import APIRouter
from pydantic import BaseModel

from services.recipe_service import find_matching_recipes

router= APIRouter()



class IngredientsRequest(BaseModel):
    ingredients:list[str]

recipes=[
    {"title": "Pasta Primavera",
     "ingredients": ["Pasta", "Gemüse"],
      "time":20, },
      {"title":"Pasta Bolo",
       "ingredients": ["Pasta","Hack"],
       "time":20,
          
      },
{"title":"Tomatensuppe",
       "ingredients": ["Tomaten","Zwiebeln"],
       "time":10,
          
      },
]




@router.post("/recipes")
def get_recipes(request:IngredientsRequest):
    
    matching_recipes = find_matching_recipes(request.ingredients, recipes)
    # print(result)
    return {"recipes":matching_recipes}

