from services.ai_service import generate_recipe_with_ai

import re
import unicodedata

from difflib import SequenceMatcher

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

SYNONYMS = {
    "erdbeer": ["erdbeere", "erdbeeren"],
    "zwiebel": ["zwiebeln", "schalotte", "schalotten"],
    "nudel": ["pasta", "spaghetti", "penne", "fusilli", "farfalle", "macaroni", "bandnudeln"],
    "hack": ["hackfleisch", "veganes hack"],
    "knoblauch": ["knoblauchzehe", "knoblauchzehen"],
    "tomat": ["tomate", "tomaten", "cherrytomate", "cherrytomaten"],
    "paprika": ["paprikaschote", "paprikaschoten"],
    "karotte": ["karotten", "möhre", "möhren"],
    "sellerie": ["stangensellerie"],
    "reis": ["basmati", "jasmine", "vollkornreis"],
    "kartoffel": ["kartoffeln", "erdapfel", "erdäpfel"],
    "käse": ["cheddar", "gouda", "mozzarella", "parmesan"],
    "milch": ["vollmilch", "hafermilch", "mandelmilch"],
    "sahne": ["rahm", "schlagsahne"],
    "butter": ["margarine"],
    "öl": ["olivenöl", "sonnenblumenöl", "rapsöl"],
}

ALLERGENS = {
    "gluten": ["weizen", "mehl", "brot", "nudel", "pasta", "spaghetti", "penne"],
    "laktose": ["milch", "sahne", "rahm", "käse", "butter", "joghurt"],
    "nüsse": ["mandel", "haselnuss", "haselnuesse", "haselnüsse", "walnuss", "cashew", "erdnuss"],

    "soja": ["soja", "sojasauce", "tofu"],
    "sellerie": ["sellerie", "stangensellerie"],
    "sesam": ["sesam", "sesamsamen"],
    "ei": ["ei", "eier"],
    "fisch": ["fisch", "lachs", "thunfisch"],
}

ALLERGEN_ALTERNATIVES = {
    "gluten": ["glutenfreie nudeln", "reis", "quinoa"],
    "laktose": ["hafermilch", "mandelmilch", "veganer käse"],
    "nüsse": ["sonnenblumenkerne", "kürbiskerne"],
    "soja": ["kokosaminos", "tamari (glutenfrei)"],
    "sellerie": ["fenchel", "pastinake"],
    "sesam": ["sonnenblumenkerne"],
    "ei": ["leinsamen-ei", "apfelmus"],
    "fisch": ["tofu", "jackfruit"],
}


# def expand_synonyms(token):
#      for key, group in SYNONYMS.items():
#           if token in group:
#                return group
#           return {token}

 
# erweiterte Synonyme
def expand_synonyms(token:str)-> set:
     expanded ={token}
     for key, values in SYNONYMS.items():
          # Wenn token der Hauptbegriff ist
          if token == key:
               expanded.update(values)
               continue
          # Wenn token in der Value-liste vorkommt
          if token in values:
               expanded.add(key)
               expanded.update(values)
     return expanded

# Zutaten klein, ohne LZ,...
def tokenize_ingredient(text):
      text= text.lower().strip()
      return re.findall(r"\b\w+\b", text)
       
# Zutaten Verarbeitung       
def process_ingredients(ingredients):
    tokens = set()

    for ingredient in ingredients:
        word_tokens = tokenize_ingredient(ingredient)

        for token in word_tokens:
            token = normalize_token(token)

            if (
                token not in STOP_INGREDIENTS
                and token not in STOPWORDS
                and not token.isdigit()
                and len(token) > 2
            ):
                tokens.add(token)

    return tokens
          


# normalize_word
# def normalize(word):
#     word = word.lower().strip()

#     # einfache Plural-Singular-Regeln
#     if word.endswith("en"):
#         word = word[:-2]
#     elif word.endswith("n"):
#         word = word[:-1]
#     elif word.endswith("e"):
#         word = word[:-1]
#     elif word.endswith("s"):
#         word = word[:-1]

#     return word
# Normalisieren klein, ohne Leerz, Umlaute, singular,..
def normalize_token(token: str) -> str:
    token = token.lower().strip()

    token = token.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")

    endings = ["en", "er", "n", "e", "s"]
    for end in endings:
        if token.endswith(end) and len(token) > 4:
            token = token[: -len(end)]
            break

    return token


# Allergene_______________________________________________________________________________________________________ 
def detect_allergens(recipe_ingredients):
     found_allergens=set()

     for ingredient in recipe_ingredients:
          tokens= tokenize_ingredient(ingredient)
          tokens= {normalize_token(t) for t in tokens}

          for allergen, words in ALLERGENS.items():
               for token in tokens:
                    # direkter Treffer
                    if token in words:
                         found_allergens.add(allergen)
                         continue
                    # fuzzy Treffer
                    for w in words:
                         if len(token) > 2 and len(w)>2:
                              if fuzzy_match(token, w):
                                   found_allergens.add(allergen)
                                   break
          return list(found_allergens)       


# Allergen Alternativen
def get_allergen_alternatives(allergens):
     return {a: ALLERGEN_ALTERNATIVES.get(a, []) for a in allergens}         
# Fehlende Zutaten_____________________________________________________
def get_missing_ingredients(recipe_ingredients, user_tokens):
    missing_clean = []

    for ingredient in recipe_ingredients:
        ingredient_tokens = tokenize_ingredient(ingredient)
        ingredient_tokens = {normalize_token(t) for t in ingredient_tokens}

        found = False

        for token in ingredient_tokens:
            # Synonym-Matching
            if expand_synonyms(token) & user_tokens:
                found = True
                break

            # Fuzzy Matching
            for ut in user_tokens:
                if len(token) > 2 and len(ut) > 2:
                    if fuzzy_match(token, ut):
                        found = True
                        break

            if found:
                break

        if not found:
            missing_clean.append(ingredient)

    return missing_clean


def fuzzy_match(a,b):
     ratio = SequenceMatcher(None, a, b).ratio()

     # kurze Wörter strenger behandeln
     if len(a) <= 4 or len(b) >= 4:
          return ratio >= 0.9
     
     # längere Wörter toleranter
     return ratio >= 0.8
     

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
               u_norm = normalize_token(ut)

               for rt in recipe_tokens:
                    recipe_group = expand_synonyms(rt)
                    r_norm = normalize_token(rt)

                     # 1) Synonym-Matching
                    if user_group & recipe_group:
                         matches.add(rt)
                         continue

                    # 2) Fuzzy Matching (nur wenn sinnvoll)
                    if len(u_norm) > 2 and len(r_norm) > 2:
                         if fuzzy_match(u_norm, r_norm):
                              matches.add(rt)
                              continue

                          
            

       
        

    
   




        #   missing_tokens=recipe_tokens - user_tokens
          missing_clean = get_missing_ingredients(recipe    ["ingredients"], user_tokens)


          # missing_list=sorted(missing_tokens)
          #Schutz gegen Division durch 0
          # if len(user_tokens)== 0 or len(recipe_tokens)==0:
          #      continue
          score_user = len(matches) / len(user_tokens) if user_tokens else 0
          # score = calculate_match_score(user_ingredients, recipe["ingredients"])
          score_recipe = len(matches) / len(recipe_tokens) if recipe_tokens else 0
          # percent= calculate_match_percent(score, len(user_ingredients))
          score = (score_user * 0.6) + (score_recipe * 0.4)

          # Bonus für hohe Trefferquote
          if score_user >= 0.8:
               score += 0.1

          # Penalty für viele fehlende Zutateten
          missing_ratio = len(missing_clean)/ len(recipe_tokens) if recipe_tokens else 1
          if missing_ratio > 0.5:
               score *= 0.8

          # Penalty für nur 1 Treffer bei vielen User-Zutaten
          if len(matches)== 1 and len(user_tokens) >= 3:
               score *= 0.7

          percent = round(score * 100, 2)

          # Allergene berechnen
          allergens = detect_allergens(recipe["ingredients"])
          alternatives = get_allergen_alternatives(allergens)

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
               result.append({"match_percent": percent,"missing_ingredients":missing_clean,
               "allergens": allergens,
               "alternatives": alternatives,               
               "recipe": recipe})
                    
     result.sort(key=lambda x:x["match_percent"],reverse=True)
    
     return result

#  get_recipes_with_fallback
def get_recipes_with_fallback(user_ingredients, recipes):
     matches= find_matching_recipes(user_ingredients, recipes)
     
     if matches:
          return matches
     
     ai_recipe = generate_recipe_with_ai(user_ingredients)

     return  [{"match_percent":0.0, "recipe": ai_recipe}]
