from services.ai_service import generate_recipe_with_ai

import re
from difflib import SequenceMatcher

STOP_INGREDIENTS = {
    "salz",
    "pfeffer",
    "oel",
    "öl",
    "wasser",
}

STOPWORDS = {
    "zum", "zur", "der", "die", "das",
    "und", "oder", "mit", "für", "fuer",
    "etwas", "frisch", "frische",
    "klein", "groß", "gross", "vegan", "vegane",
    "vegetarisch", "vegetarische",
}

SYNONYMS = {
    "haehnchen": ["hähnchen", "huhn", "huehnchen", "hühnchen", "chicken"],
    "huhn": ["hähnchen", "haehnchen", "huehnchen", "hühnchen", "chicken"],
    "erdbeer": ["erdbeere", "erdbeeren"],
    "zwiebel": ["zwiebeln", "schalotte", "schalotten"],
    "nudel": ["pasta", "spaghetti", "penne", "fusilli", "farfalle", "macaroni", "bandnudeln"],
    "hack": ["hackfleisch", "veganes hack"],
    "knoblauch": ["knoblauchzehe", "knoblauchzehen"],
    "tomat": ["tomate", "tomaten", "cherrytomate", "cherrytomaten"],
    "paprika": ["paprikaschote", "paprikaschoten"],
    "karotte": ["karotten", "möhre", "möhren", "moehre", "moehren"],
    "sellerie": ["stangensellerie"],
    "reis": ["basmati", "jasmine", "vollkornreis"],
    "kartoffel": ["kartoffeln", "erdapfel", "erdäpfel", "erdaepfel"],
    "käse": ["kaese", "cheddar", "gouda", "mozzarella", "parmesan"],
    "milch": ["vollmilch", "hafermilch", "mandelmilch"],
    "sahne": ["rahm", "schlagsahne"],
    "butter": ["margarine"],
    "öl": ["oel", "olivenöl", "olivenoel", "sonnenblumenöl", "sonnenblumenoel", "rapsöl", "rapsoel"],
}

ALLERGENS = {
    "gluten": ["weizen", "mehl", "brot", "nudel", "pasta", "spaghetti", "penne"],
    "laktose": ["milch", "sahne", "rahm", "käse", "kaese", "butter", "joghurt"],
    "nüsse": ["mandel", "haselnuss", "haselnuesse", "haselnüsse", "walnuss", "cashew", "erdnuss"],
    "soja": ["soja", "sojasauce", "tofu"],
    "sellerie": ["sellerie", "stangensellerie"],
    "sesam": ["sesam", "sesamsamen"],
    "ei": ["ei", "eier"],
    "fisch": ["fisch", "lachs", "thunfisch"],
}

ALLERGEN_ALTERNATIVES = {
    "gluten": ["glutenfreies Brot", "glutenfreie Nudeln", "Reis", "Quinoa"],
    "laktose": ["Hafermilch", "Mandelmilch", "veganer Käse"],
    "nüsse": ["Sonnenblumenkerne", "Kürbiskerne"],
    "soja": ["Kokosaminos", "Tamari glutenfrei"],
    "sellerie": ["Fenchel", "Pastinake"],
    "sesam": ["Sonnenblumenkerne"],
    "ei": ["Leinsamen-Ei", "Apfelmus"],
    "fisch": ["Tofu", "Jackfruit"],
}

INTOLERANCE_MAP = {
    "histamin": [
        "tomate", "tomaten", "cherrytomate", "cherrytomaten",
        "spinat", "avocado", "aubergine", "kichererbse",
        "kichererbsen", "sojasauce", "essig", "wein",
    ],
    "fruktose": ["apfel", "birne", "honig", "fruchtsaft", "traube", "mango"],
    "laktose": ["milch", "sahne", "rahm", "käse", "kaese", "butter", "joghurt"],
    "gluten": ["weizen", "mehl", "nudel", "pasta", "brot", "spaghetti"],
    "tierisches_eiweiss": [
        "ei", "eier", "milch", "käse", "kaese", "joghurt",
        "fisch", "fleisch", "hähnchen", "haehnchen", "huhn",
        "hühnchen", "huehnchen", "chicken",
    ],
    "soja": ["soja", "tofu", "sojasauce"],
    "nuesse": ["nuss", "nüsse", "nuesse", "haselnuss", "walnuss", "cashew", "erdnuss"],
}


def normalize_token(token: str) -> str:
    token = token.lower().strip()
    token = (
        token.replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
    )

    endings = ["en", "er", "n", "e", "s"]
    for end in endings:
        if token.endswith(end) and len(token) > 4:
            token = token[: -len(end)]
            break

    return token


def expand_synonyms(token: str) -> set[str]:
    expanded = {normalize_token(token)}

    for key, values in SYNONYMS.items():
        normalized_key = normalize_token(key)
        normalized_values = {normalize_token(value) for value in values}

        if normalize_token(token) == normalized_key:
            expanded.update(normalized_values)
            expanded.add(normalized_key)

        if normalize_token(token) in normalized_values:
            expanded.add(normalized_key)
            expanded.update(normalized_values)

    return expanded


def tokenize_ingredient(text: str) -> list[str]:
    text = text.lower().strip()
    return re.findall(r"\b\w+\b", text)


def process_ingredients(ingredients: list[str]) -> set[str]:
    tokens = set()

    for ingredient in ingredients:
        for token in tokenize_ingredient(ingredient):
            token = normalize_token(token)

            if (
                token not in STOP_INGREDIENTS
                and token not in STOPWORDS
                and not token.isdigit()
                and len(token) > 2
            ):
                tokens.add(token)

    return tokens


def fuzzy_match(a: str, b: str) -> bool:
    ratio = SequenceMatcher(None, a, b).ratio()

    if len(a) <= 4 or len(b) <= 4:
        return ratio >= 0.9

    return ratio >= 0.8


def tokens_match(token: str, compare_token: str) -> bool:
    token_group = expand_synonyms(token)
    compare_group = expand_synonyms(compare_token)

    if token_group & compare_group:
        return True

    return fuzzy_match(normalize_token(token), normalize_token(compare_token))


def ingredient_matches_tokens(ingredient: str, forbidden_tokens: set[str]) -> bool:
    ingredient_tokens = process_ingredients([ingredient])

    for ingredient_token in ingredient_tokens:
        for forbidden_token in forbidden_tokens:
            if tokens_match(ingredient_token, forbidden_token):
                return True

    return False


def get_forbidden_tokens_for_intolerances(intolerances: list[str]) -> set[str]:
    forbidden_tokens = set()

    for intolerance in intolerances:
        forbidden = INTOLERANCE_MAP.get(intolerance, [])
        forbidden_tokens.update(normalize_token(item) for item in forbidden)

    return forbidden_tokens


def get_problematic_user_ingredients(
    user_ingredients: list[str],
    exclude_ingredients: list[str],
    intolerances: list[str],
) -> list[str]:
    exclude_tokens = process_ingredients(exclude_ingredients)
    forbidden_tokens = get_forbidden_tokens_for_intolerances(intolerances)
    blocked_tokens = exclude_tokens | forbidden_tokens

    if not blocked_tokens:
        return []

    return [
        ingredient
        for ingredient in user_ingredients
        if ingredient_matches_tokens(ingredient, blocked_tokens)
    ]


def get_safe_user_ingredients(
    user_ingredients: list[str],
    exclude_ingredients: list[str],
    intolerances: list[str],
) -> list[str]:
    problematic = set(
        get_problematic_user_ingredients(user_ingredients, exclude_ingredients, intolerances)
    )

    safe_ingredients = [
        ingredient
        for ingredient in user_ingredients
        if ingredient not in problematic
    ]

    return safe_ingredients or ["Reis", "Kartoffeln", "Karotten"]


def detect_allergens(recipe_ingredients: list[str]) -> list[str]:
    found_allergens = set()

    for ingredient in recipe_ingredients:
        tokens = {normalize_token(t) for t in tokenize_ingredient(ingredient)}

        for allergen, words in ALLERGENS.items():
            normalized_words = {normalize_token(w) for w in words}

            if tokens & normalized_words:
                found_allergens.add(allergen)
                continue

            for token in tokens:
                for word in normalized_words:
                    if word in token and len(word) > 2:
                        found_allergens.add(allergen)
                        break

    return sorted(found_allergens)


def get_allergen_alternatives(allergens: list[str]) -> dict[str, list[str]]:
    return {allergen: ALLERGEN_ALTERNATIVES.get(allergen, []) for allergen in allergens}


def get_missing_ingredients(recipe_ingredients: list[str], user_tokens: set[str]) -> list[str]:
    missing_clean = []

    for ingredient in recipe_ingredients:
        ingredient_tokens = {normalize_token(t) for t in tokenize_ingredient(ingredient)}
        found = False

        for token in ingredient_tokens:
            if expand_synonyms(token) & user_tokens:
                found = True
                break

            for user_token in user_tokens:
                if len(token) > 2 and len(user_token) > 2 and fuzzy_match(token, user_token):
                    found = True
                    break

            if found:
                break

        if not found:
            missing_clean.append(ingredient)

    return missing_clean


def recipe_contains_excluded(recipe: dict, exclude_tokens: set[str]) -> bool:
    if not exclude_tokens:
        return False

    recipe_tokens = process_ingredients(recipe.get("ingredients", []))
    return bool(recipe_tokens & exclude_tokens)


def violates_intolerance(recipe: dict, intolerances: list[str]) -> bool:
    recipe_ingredients = recipe.get("ingredients", [])
    forbidden_tokens = get_forbidden_tokens_for_intolerances(intolerances)

    for ingredient in recipe_ingredients:
        if ingredient_matches_tokens(ingredient, forbidden_tokens):
            return True

    return False


def find_matching_recipes(
    user_ingredients: list[str],
    recipes: list[dict],
    exclude_ingredients: list[str] | None = None,
    intolerances: list[str] | None = None,
) -> list[dict]:
    exclude_ingredients = exclude_ingredients or []
    intolerances = intolerances or []

    result = []
    user_tokens = process_ingredients(user_ingredients)
    exclude_tokens = process_ingredients(exclude_ingredients)

    for recipe in recipes:
        if recipe_contains_excluded(recipe, exclude_tokens):
            continue

        if violates_intolerance(recipe, intolerances):
            continue

        recipe_tokens = process_ingredients(recipe.get("ingredients", []))
        matches = set()

        for user_token in user_tokens:
            for recipe_token in recipe_tokens:
                if tokens_match(user_token, recipe_token):
                    matches.add(recipe_token)

        missing_clean = get_missing_ingredients(recipe.get("ingredients", []), user_tokens)

        score_user = len(matches) / len(user_tokens) if user_tokens else 0
        score_recipe = len(matches) / len(recipe_tokens) if recipe_tokens else 0
        score = (score_user * 0.6) + (score_recipe * 0.4)

        if score_user >= 0.8:
            score += 0.1

        missing_ratio = len(missing_clean) / len(recipe_tokens) if recipe_tokens else 1
        if missing_ratio > 0.5:
            score *= 0.8

        if len(matches) == 1 and len(user_tokens) >= 3:
            score *= 0.7

        percent = round(score * 100, 2)

        if percent >= 30:
            allergens = detect_allergens(recipe.get("ingredients", []))
            alternatives = get_allergen_alternatives(allergens)

            result.append(
                {
                    "match_percent": percent,
                    "missing_ingredients": missing_clean,
                    "allergens": allergens,
                    "alternatives": alternatives,
                    "recipe": recipe,
                }
            )

    result.sort(key=lambda x: x["match_percent"], reverse=True)
    return result


def get_recipes_with_fallback(
    user_ingredients: list[str],
    recipes: list[dict],
    exclude_ingredients: list[str] | None = None,
    intolerances: list[str] | None = None,
) -> list[dict]:
    exclude_ingredients = exclude_ingredients or []
    intolerances = intolerances or []

    matches = find_matching_recipes(
        user_ingredients,
        recipes,
        exclude_ingredients=exclude_ingredients,
        intolerances=intolerances,
    )

    if matches:
        return matches

    problematic_user_ingredients = get_problematic_user_ingredients(
        user_ingredients,
        exclude_ingredients,
        intolerances,
    )
    safe_user_ingredients = get_safe_user_ingredients(
        user_ingredients,
        exclude_ingredients,
        intolerances,
    )

    ai_recipe = generate_recipe_with_ai(
        safe_user_ingredients,
        exclude_ingredients=exclude_ingredients + problematic_user_ingredients,
        intolerances=intolerances,
    )

    allergens = detect_allergens(ai_recipe.get("ingredients", []))
    alternatives = get_allergen_alternatives(allergens)

    return [
        {
            "match_percent": 0.0,
            "missing_ingredients": problematic_user_ingredients,
            "allergens": allergens,
            "alternatives": alternatives,
            "recipe": ai_recipe,
        }
    ]