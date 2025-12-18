from fastapi import APIRouter
router= APIRouter()
from pydantic import BaseModel



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

# def generate_recipe_with_ai(ingredients):
# generate ai recipe logik
# verarbeitung response von ai
# safe recipe in db
# return recipe object(s)


# import re

# def normalize(text):
#     return re.sub(r"\s+", " ", text.lower().strip())
def find_matching_recipes(ingredients, recipes):
    normalized_ingredients=[i.lower().strip() for i in ingredients]
    result=[]
    for recipe in recipes:
            recipe_ingredients=[ri.lower() for ri in recipe["ingredients"]]
            for ingredient in normalized_ingredients:
                if ingredient in recipe_ingredients:
                     result.append(recipe)
                     break #Rezept einmal gefunden -> weiter
    #             if not result:
    #                 ai_recipe = generate_recipe_with_ai(ingredients)
    # result.append(ai_recipe)
    
    return result
                

@router.post("/recipes")
def get_recipes(request:IngredientsRequest):
    result = find_matching_recipes(request.ingredients, recipes)
    print(result)
    return {"recipes":result}

