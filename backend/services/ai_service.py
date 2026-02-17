#Mock AI recipe generator

def generate_recipe_with_ai(ingredients: list[str]) ->dict:
    return{
        "title": "AI Überraschungsrezept",
        "ingredients": ingredients,
        "steps":[
            "Alle Zutaten vorbereiten",
            "Alles zusammen kochen",
            "servieren und genießen"
        ],
        "time": 30,
        "is_ai": True,    
    }