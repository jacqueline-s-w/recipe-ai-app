from services.ai_service import generate_recipe_with_ai

import re
STOP_INGREDIENTS = {
    "salz",
    "pfeffer",
    "öl",
    "wasser"
}

STOPWORDS = {
    "zum", "zur", "der", "die", "das",
    "und", "oder", "mit", "für",
    "etwas", "frisch", "frische",
    "klein", "groß"
}

def tokenize_ingredient(text):
      text= text.lower().strip()
      return re.findall(r"\b\w+\b", text)
       
def process_ingredients(ingredients):
      tokens=set() # Mit set() Duplikate vermeiden, Schnittmenge später einfach
      for ingredient in ingredients:
          word_tokens= tokenize_ingredient(ingredient)
          for token in word_tokens:
               if (token not in STOP_INGREDIENTS and token not in STOPWORDS and not token.isdigit() and len(token)>2):
                tokens.add(token)
      return tokens               


# normalize_word
def normalize_word(word:str)->str:
     #  word= word.lower().strip()
     #  if word.endswith("en"):
     #        return word[:-2]
     #  if word.endswith("n"):
     #        return word[:-1]
      return word.lower().strip()
#_______________________________________________________________________________________________________
# calculate_match_score (singular und substring-logik) NUR für EIN Rezept verantwortlich, keine Schleife über alle Rezepte
# def calculate_match_score(user_ingredients: list[str], recipe_ingredients):
     # User-Zutaten normalisieren
     # normalized_user_ingredients=[normalize_word(ingredient)
     # for ingredient in user_ingredients]

     
     # Rezept-Zutaten normalisieren
     # normalized_recipe_ingredients=[
     #      normalize_word(ingredient.lower().strip())
     #             for ingredient in recipe_ingredients
     #             ]
     # print("USER:",normalized_user_ingredients)
     # print("RECIPE:", normalized_recipe_ingredients)
            
     # score=0
            
     # for user_word in normalized_user_ingredients:
     #         for recipe_word in normalized_recipe_ingredients:
     #              if(
     #                   user_word == recipe_word
     #                   or user_word in recipe_word
     #                   or recipe_word in user_word
     #              ):
     #                   score += 1
     #                   break #doppelte Treffervermeiden

#      return score
# print(calculate_match_score(["Hack"], ["Hack"]))
# calculate_match_percent
# keine Liste als Default, Funktion ist unabhängig und weiß nichts über Zutatenlisten
# Möglichkeiten: die Prozent-Logik ändern,Rundung anpassen, Gewichtung einbauen, Ohne mein Matching anzufassen.
#_____________________________________________________________________________
# def calculate_match_percent(score: int, total_user_count:int)->float:
#       if (total_user_count) == 0:
#             return 0.0
#       return round((score / total_user_count)*100, 2)
      
# print(calculate_match_percent(1, 3))
# _________________________________________________________________________________


# 

def get_missing_ingredients(recipe_ingredients, user_tokens):
     missing_clean=[]
     for ingredient in recipe_ingredients:
          ingredient_tokens= tokenize_ingredient(ingredient)

          #prüfen: kommt irgendein token im user vor?
          if not any(token in user_tokens for token in ingredient_tokens):
               missing_clean.append(ingredient)
     return missing_clean

def find_matching_recipes(user_ingredients: list[str], recipes:list[dict]):
     
     result=[]
     #EINMAL
     user_tokens=process_ingredients(user_ingredients) 

     for recipe in recipes:
          #PRO REZEPT
          recipe_tokens=process_ingredients(recipe["ingredients"])

          matches= user_tokens & recipe_tokens

          missing_tokens=recipe_tokens-user_tokens
          # missing_list=sorted(missing_tokens)
          #Schutz gegen Division durch 0
          # if len(user_tokens)== 0 or len(recipe_tokens)==0:
          #      continue
          score_user = len(matches) / len(user_tokens)
          # score = calculate_match_score(user_ingredients, recipe["ingredients"])
          score_recipe = len(matches) / len(recipe_tokens)
          # percent= calculate_match_percent(score, len(user_ingredients))
          score = (score_user * 0.7) + (score_recipe * 0.3)
          percent = round(score * 100, 2)

          missing_clean= get_missing_ingredients(
               recipe["ingredients",
                      user_tokens]
          )
          print(recipe["title"], score, percent)
          if percent >=30:     
               result.append({"match_percent": percent,"missing_ingredients":missing_clean,"recipe": recipe})
                    
     result.sort(key=lambda x:x["match_percent"],reverse=True)
     print("USER:", user_tokens)
     print("RECIPE:", recipe_tokens)
     print("MATCHES:", matches)
     return result

#  get_recipes_with_fallback
def get_recipes_with_fallback(user_ingredients, recipes):
     matches= find_matching_recipes(user_ingredients, recipes)
     
     if matches:
          return matches
     
     ai_recipe = generate_recipe_with_ai(user_ingredients)

     return  [{"match_percent":0.0, "recipe": ai_recipe}]
