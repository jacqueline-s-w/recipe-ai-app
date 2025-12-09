@router.post("/recipes")
def get_recipes(ingredients: list[str]):
    return{
        "recipes":[
            {"title": "Pasta Primavera", "ingredients": ["Pasta","Gemüse"], "time":20},
            {"title"; "Tomatensuppe", "igredients": ["Tomaten", "Zwiebeln"], "time":10},
        ]
    }