from services.ai_service import generate_recipe_with_ai

import re
from difflib import SequenceMatcher

STOP_INGREDIENTS = {
    "salz",
    "pfeffer",
    "öl",
    "wasser",
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

INTOLERANCE_MAP = {
    "histamin": [
        "tomate", "tomaten", "spinat", "avocado", "aubergine",
        "kichererbse", "sojasauce", "essig", "wein",
    ],
    "fruktose": [
        "apfel", "birne", "honig", "fruchtsaft", "traube", "mango",
    ],
    "laktose": [
        "milch", "sahne", "rahm", "käse", "butter", "joghurt",
    ],
    "gluten": [
        "weizen", "mehl", "nudel", "pasta", "brot", "spaghetti",
    ],
    "tierisches_eiweiss": [
        "ei", "milch", "käse", "joghurt", "fisch", "fleisch",
    ],
    "soja": [
        "soja", "tofu", "sojasauce",
    ],
    "nuesse": [
        "nuss", "nüsse", "haselnuss", "walnuss", "cashew", "erdnuss",
    ],
}


def expand_synonyms(token: str) -> set:
    expanded = {token}
    for key, values in SYNONYMS.items():
        if token == key:
            expanded.update(values)
            continue
        if token in values:
            expanded.add(key)
            expanded.update(values)
    return expanded


def tokenize_ingredient(text: str) -> list[str]:
    text = text.lower().strip()
    return re.findall(r"\b\w+\b", text)


def process_ingredients(ingredients: list[str]) -> set[str]:
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


def normalize_token(token: str) -> str:
    token = token.lower().strip()
    token = token.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")

    endings = ["en", "er", "n", "e", "s"]
    for end in endings:
        if token.endswith(end) and len(token) > 4:
            token = token[: -len(end)]
            break

    return token


def detect_allergens(recipe_ingredients: list[str]) -> list[str]:
    found_allergens = set()

    for ingredient in recipe_ingredients:
        tokens = tokenize_ingredient(ingredient)
        tokens = {normalize_token(t) for t in tokens}

        for allergen, words in ALLERGENS.items():
            for token in tokens:
                if token in words:
                    found_allergens.add(allergen)
                    continue
                for w in words:
                    if len(token) > 2 and len(w) > 2:
                        if fuzzy_match(token, w):
                            found_allergens.add(allergen)
                            break

    return list(found_allergens)


def get_allergen_alternatives(allergens: list[str]) -> dict[str, list[str]]:
    return {a: ALLERGEN_ALTERNATIVES.get(a, []) for a in allergens}


def get_missing_ingredients(recipe_ingredients: list[str], user_tokens: set[str]) -> list[str]:
    missing_clean: list[str] = []

    for ingredient in recipe_ingredients:
        ingredient_tokens = tokenize_ingredient(ingredient)
        ingredient_tokens = {normalize_token(t) for t in ingredient_tokens}

        found = False

        for token in ingredient_tokens:
            if expand_synonyms(token) & user_tokens:
                found = True
                break

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


def fuzzy_match(a: str, b: str) -> bool:
    ratio = SequenceMatcher(None, a, b).ratio()

    # kurze Wörter strenger behandeln
    if len(a) <= 4 or len(b) <= 4:
        return ratio >= 0.9

    # längere Wörter toleranter
    return ratio >= 0.8


def recipe_contains_excluded(recipe: dict, exclude_tokens: set[str]) -> bool:
    recipe_tokens = process_ingredients(recipe["ingredients"])
    return bool(recipe_tokens & exclude_tokens)


def violates_intolerance(recipe: dict, intolerances: list[str]) -> bool:
    recipe_tokens = process_ingredients(recipe["ingredients"])
    for intolerance in intolerances:
        forbidden = INTOLERANCE_MAP.get(intolerance, [])
        forbidden = {normalize_token(f) for f in forbidden}
        if recipe_tokens & forbidden:
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
    result: list[dict] = []

    user_tokens = process_ingredients(user_ingredients)
    exclude_tokens = process_ingredients(exclude_ingredients)

    for recipe in recipes:
        if recipe_contains_excluded(recipe, exclude_tokens):
            continue

        if violates_intolerance(recipe, intolerances):
            continue

        recipe_tokens = process_ingredients(recipe["ingredients"])

        matches: set[str] = set()
        for ut in user_tokens:
            user_group = expand_synonyms(ut)
            u_norm = normalize_token(ut)

            for rt in recipe_tokens:
                recipe_group = expand_synonyms(rt)
                r_norm = normalize_token(rt)

                if user_group & recipe_group:
                    matches.add(rt)
                    continue

                if len(u_norm) > 2 and len(r_norm) > 2:
                    if fuzzy_match(u_norm, r_norm):
                        matches.add(rt)
                        continue

        missing_clean = get_missing_ingredients(recipe["ingredients"], user_tokens)

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

        allergens = detect_allergens(recipe["ingredients"])
        alternatives = get_allergen_alternatives(allergens)

        if percent >= 30:
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

    ai_recipe = generate_recipe_with_ai(user_ingredients)

    if violates_intolerance(ai_recipe, intolerances):
        return []

    exclude_tokens = process_ingredients(exclude_ingredients)
    if recipe_contains_excluded(ai_recipe, exclude_tokens):
        return []

    allergens = detect_allergens(ai_recipe["ingredients"])
    alternatives = get_allergen_alternatives(allergens)

    return [
        {
            "match_percent": 0.0,
            "recipe": ai_recipe,
            "allergens": allergens,
            "alternatives": alternatives,
        }
    ]
