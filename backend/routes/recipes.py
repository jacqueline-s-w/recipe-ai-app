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
def find_matching_recipes(user_ingredients, recipes):
    # User-Zutaten normalisieren
    normalized_user_ingredients=[ingredient.lower().strip() for ingredient in user_ingredients]

    result=[]

    for recipe in recipes:
            # Rezept-Zutaten normalisieren
            normalized_recipe_ingredients=[ingredient.lower().strip() for ingredient in recipe["ingredients"]]

            # Prüfen, ob mindestens eine Zuatat passt
            for ingredient in normalized_user_ingredients:
                if ingredient in normalized_recipe_ingredients:
                     result.append(recipe)
                     break #Rezept nur einmal hinzufügen
                if not result:
                     ai_recipe = generate_recipe_with_ai(user_ingredients)
     result.append(ai_recipe)
    #_________________________________???
    return result
                

@router.post("/recipes")
def get_recipes(request:IngredientsRequest):
    result = find_matching_recipes(request.ingredients, recipes)
    print(result)
    return {"recipes":result}

