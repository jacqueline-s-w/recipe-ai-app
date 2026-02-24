from services.ai_service import generate_recipe_with_ai

# normalize_word
def normalize_word(word:str)->str:
      word= word.lower().strip()
      if word.endswith("en"):
            return word[:-2]
      if word.endswith("n"):
            return word[:-1]
      return word

# calculate_match_score (singular und substring-logik) NUR für EIN Rezept verantwortlich, keine Schleife über alle Rezepte
def calculate_match_score(user_ingredients: list[str], recipe_ingredients):
     # User-Zutaten normalisieren
     normalized_user_ingredients=[ingredient.lower().strip()
     for ingredient in user_ingredients]

     
     # Rezept-Zutaten normalisieren
     normalized_recipe_ingredients=[
          normalize_word(ingredient.lower().strip())
                 for ingredient in recipe_ingredients
                 ]
            
     score=0
            
     for user_word in normalized_user_ingredients:
             for recipe_word in normalized_recipe_ingredients:
                  if(
                       user_word == recipe_word
                       or user_word in recipe_word
                       or recipe_word in user_word
                  ):
                       score += 1
                       break #doppelte Treffervermeiden

     return score
print(calculate_match_score(["Hack"], ["Hack"]))
# calculate_match_percent
# keine Liste als Default, Funktion ist unabhängig und weiß nichts über Zutatenlisten
# Möglichkeiten: die Prozent-Logik ändern,Rundung anpassen, Gewichtung einbauen, Ohne mein Matching anzufassen.

def calculate_match_percent(score: int, total_user_count:int)->float:
      if (total_user_count) == 0:
            return 0.0
      return round((score / total_user_count)*100, 2)
      
print(calculate_match_percent(1, 3))


def find_matching_recipes(user_ingredients: list[str], recipes:list[dict]):
     result=[]

     for recipe in recipes:
          score = calculate_match_score(user_ingredients, recipe["ingredients"])
          
          percent= calculate_match_percent(score, len(user_ingredients))

          print(recipe["title"], score, percent)
          if percent >=30:     
               result.append({"match_percent": percent,"recipe": recipe})
                    
     result.sort(key=lambda x:x["match_percent"],reverse=True)
     return result

#  get_recipes_with_fallback
def get_recipes_with_fallback(user_ingredients, recipes):
     matches= find_matching_recipes(user_ingredients, recipes)
     
     if matches:
          return matches
     
     ai_recipe = generate_recipe_with_ai(user_ingredients)

     return  [{"match_percent":0.0, "recipe": ai_recipe}]
