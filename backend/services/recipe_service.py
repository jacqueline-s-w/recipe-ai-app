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

            # Prüfen, ob mindestens eine Zuatat passt
            for ingredient in normalized_user_ingredients:
                if ingredient in normalized_recipe_ingredients:
                     result.append(recipe)
                     break #Rezept nur einmal hinzufügen
    if not result:
        ai_recipe = generate_recipe_with_ai(user_ingredients)
        result.append(ai_recipe)
    
    return result