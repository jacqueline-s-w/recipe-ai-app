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
    "klein", "groß", "vegan", "vegane", "vegetarisch", "vegetarische",
}

SYNONYMS={
     "zwiebel": {"zwiebel", "zwiebeln", "rote zwiebel", "schalotte", "schalotten"},
    "knoblauch": {"knoblauch", "knoblauchzehe", "knoblauchzehen"},
    "tomate": {"tomate", "tomaten", "kirschtomate", "kirschtomaten"},
    "paprika": {"paprika", "paprikaschote", "paprikaschoten"},
    "karotte": {"karotte", "karotten", "möhre", "möhren"},
    "sellerie": {"sellerie", "stangensellerie"},
}

def expand_synonyms(token):
     for key, group in SYNONYMS.items():
          if token in group:
               return group
          return {token}

def tokenize_ingredient(text):
      text= text.lower().strip()
      return re.findall(r"\b\w+\b", text)
       
def process_ingredients(ingredients):
    tokens = set()

    for ingredient in ingredients:
        word_tokens = tokenize_ingredient(ingredient)

        for token in word_tokens:
            token = normalize(token)

            if (
                token not in STOP_INGREDIENTS
                and token not in STOPWORDS
                and not token.isdigit()
                and len(token) > 2
            ):
                tokens.add(token)

    return tokens
          


# normalize_word
def normalize(word):
    word = word.lower().strip()

    # einfache Plural-Singular-Regeln
    if word.endswith("en"):
        word = word[:-2]
    elif word.endswith("n"):
        word = word[:-1]
    elif word.endswith("e"):
        word = word[:-1]
    elif word.endswith("s"):
        word = word[:-1]

    return word

#_______________________________________________________________________________________________________


def get_missing_ingredients(recipe_ingredients, user_tokens):
     missing_clean=[]
     for ingredient in recipe_ingredients:
          ingredient_tokens= tokenize_ingredient(ingredient)
          # Tokens normalisieren!
          ingredient_tokens = {normalize(t) for t in ingredient_tokens}
          #prüfen: kommt irgendein token im user vor?
          if not any(expand_synonyms(token) & user_tokens for token in ingredient_tokens):

               missing_clean.append(ingredient)
     return missing_clean

def find_matching_recipes(user_ingredients: list[str], recipes:list[dict]):
     
     result=[]
     #EINMAL: User-Zutaten normalisieren 
     user_tokens=process_ingredients(user_ingredients) 

     for recipe in recipes:
          #PRO REZEPT
          # recipe_tokens=process_ingredients(recipe["ingredients"])
          recipe_tokens = process_ingredients(recipe["ingredients"])


          matches = set()
          for ut in user_tokens:
                user_group = expand_synonyms(ut)
                for rt in recipe_tokens:
                     recipe_group = expand_synonyms(rt)
                     if user_group & recipe_group:
                          matches.add(rt)
            

       
        

    
   




          missing_tokens=recipe_tokens - user_tokens
          # missing_list=sorted(missing_tokens)
          #Schutz gegen Division durch 0
          # if len(user_tokens)== 0 or len(recipe_tokens)==0:
          #      continue
          score_user = len(matches) / len(user_tokens) if user_tokens else 0
          # score = calculate_match_score(user_ingredients, recipe["ingredients"])
          score_recipe = len(matches) / len(recipe_tokens) if recipe_tokens else 0
          # percent= calculate_match_percent(score, len(user_ingredients))
          score = (score_user * 0.7) + (score_recipe * 0.3)
          percent = round(score * 100, 2)

          # Debug-Ausgaben (jetzt korrekt innerhalb der Schleife)
          print("USER:", user_tokens)
          print("RECIPE:", recipe_tokens)
          print("MATCHES:", matches)
          missing_clean= get_missing_ingredients(
               recipe["ingredients"],
                      user_tokens
          )
          print(recipe["title"], score, percent)
          if percent >=30:     
               result.append({"match_percent": percent,"missing_ingredients":missing_clean,"recipe": recipe})
                    
     result.sort(key=lambda x:x["match_percent"],reverse=True)
    
     return result

#  get_recipes_with_fallback
def get_recipes_with_fallback(user_ingredients, recipes):
     matches= find_matching_recipes(user_ingredients, recipes)
     
     if matches:
          return matches
     
     ai_recipe = generate_recipe_with_ai(user_ingredients)

     return  [{"match_percent":0.0, "recipe": ai_recipe}]
