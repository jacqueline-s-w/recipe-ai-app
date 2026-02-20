from services.ai_service import generate_recipe_with_ai


def normalize_word(word:str)->str:
      word= word.lower().strip()
      if word.endswith("en"):
            return word[:-2]
      if word.endswith("n"):
            return word[:-1]
      return word

def find_matching_recipes(user_ingredients: list[str], recipes: list[dict]):
    # User-Zutaten normalisieren
     normalized_user_ingredients=[ingredient.lower().strip()
     for ingredient in user_ingredients]

     result=[]

     for recipe in recipes:
            # Rezept-Zutaten normalisieren
            normalized_recipe_ingredients=[
                 normalize_word(ingredient)
                 for ingredient in recipe["ingredients"]]
            
            score=0
            
            for user_ingredient in normalized_user_ingredients:
             user_word= normalize_word(user_ingredient)

             for recipe_word in normalized_recipe_ingredients:
                  if(
                       user_word == recipe_word
                       or user_word in recipe_word
                       or recipe_word in user_word
                  ):
                       score += 1
                       break
            
                  if  normalized_user_ingredients:
                   match_percent= round((score/len (normalized_user_ingredients))*100, 2)
                  else:    
                   match_percent=0.0

            # Prüfen, ob mindestens eine Zuatat passt
            # for ingredient in normalized_user_ingredients:
                

            #     if ingredient in normalized_recipe_ingredients:
                      
            if match_percent >=30:     
                     result.append({"match_percent": match_percent,
                                    "recipe": recipe})
                    
     result.sort(key=lambda x:x["match_percent"] ,reverse=True)
     if not result:
        ai_recipe = generate_recipe_with_ai(user_ingredients)
        result.append({"match_percent":0.0, "recipe": ai_recipe})
     return result
   