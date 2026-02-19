from services.ai_service import generate_recipe_with_ai




def find_matching_recipes(user_ingredients: list[str], recipes: list[dict]):
    # User-Zutaten normalisieren
    normalized_user_ingredients=[ingredient.lower().strip()
    for ingredient in user_ingredients]

    result=[]

    for recipe in recipes:
            # Rezept-Zutaten normalisieren
            normalized_recipe_ingredients=[
                 ingredient.lower().strip() 
                 for ingredient in recipe["ingredients"]]
            
            score= len(set(normalized_user_ingredients) & set(normalized_recipe_ingredients))

            # Prüfen, ob mindestens eine Zuatat passt
            # for ingredient in normalized_user_ingredients:
                

            #     if ingredient in normalized_recipe_ingredients:
            #          score += 1
            if score > 0:     
                     result.append((score, recipe))
                    
    result.sort(reverse=True)
    if not result:
        ai_recipe = generate_recipe_with_ai(user_ingredients)
        result.append((0, ai_recipe))
    return result
   