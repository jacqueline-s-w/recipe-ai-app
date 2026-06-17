import { useState } from 'react';

export default function IngredientInput({
  ingredients,
  setIngredients,
  onFindRecipes,
  onClearResults,
  loading,
}) {
  const [input, setInput] = useState('');
  const [excludeIngredients, setExcludeIngredients] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [intolerances, setIntolerances] = useState([]);
  const [showAddIngredientHint, setShowAddIngredientHint] = useState(false);

  const hasPendingInput = input.trim().length > 0;
  const canSearch = ingredients.length > 0;

  function addIngredients(event) {
    event.preventDefault();

    const newIngredients = input
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    if (newIngredients.length === 0) return;

    setShowAddIngredientHint(false);
    setIngredients((previousIngredients) => [
      ...previousIngredients,
      ...newIngredients,
    ]);

    setInput('');
  }

  function removeIngredient(indexToRemove) {
    setIngredients((previousIngredients) => {
      const nextIngredients = previousIngredients.filter(
        (_, index) => index !== indexToRemove,
      );

      if (nextIngredients.length === 0) {
        onClearResults();
      }

      return nextIngredients;
    });
  }

  function clearAllIngredients() {
    setIngredients([]);
    setInput('');
    setShowAddIngredientHint(false);
    onClearResults();
  }

  function handleFindRecipes() {
    if (hasPendingInput) {
      setShowAddIngredientHint(true);
      return;
    }

    onFindRecipes(
      ingredients,
      excludeIngredients
        .split(',')
        .map((ingredient) => ingredient.trim())
        .filter(Boolean),
      intolerances,
      dietaryPreference,
    );
  }

  const dietaryOptions = [
    { value: '', label: 'Keine Einschränkung' },
    { value: 'vegetarian', label: 'Vegetarisch' },
    { value: 'vegan', label: 'Vegan' },
  ];

  const intoleranceOptions = [
    { value: 'gluten', label: 'Gluten' },
    { value: 'laktose', label: 'Laktose' },
    { value: 'histamin', label: 'Histamin' },
    { value: 'fruktose', label: 'Fruktose' },
    { value: 'soja', label: 'Soja' },
    { value: 'tierisches_eiweiss', label: 'Tierisches Eiweiß' },
    { value: 'nuesse', label: 'Nüsse' },
  ];

  return (
    <section className="rounded-xl bg-white p-4 shadow sm:p-5">
      <form onSubmit={addIngredients}>
        <label htmlFor="zutat" className="mb-1 block text-sm font-medium">
          Zutaten (Komma getrennt):
        </label>

        <input
          id="zutat"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setShowAddIngredientHint(false);
          }}
          aria-describedby={
            showAddIngredientHint ? 'add-ingredient-hint' : undefined
          }
          className="min-h-11 w-full rounded border p-2 text-base"
          placeholder="z.B. Tomate, Käse, Basilikum"
        />

        <button
          type="submit"
          title="Zutaten hinzufügen"
          aria-label="Zutaten hinzufügen"
          className="mt-3 min-h-11 w-full rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto">
          Hinzufügen
        </button>

        {showAddIngredientHint && (
          <div
            id="add-ingredient-hint"
            role="alert"
            className="mt-3 rounded-md border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-900">
            Du hast noch Zutaten im Eingabefeld. Bitte klicke zuerst auf
            <span className="font-semibold"> Hinzufügen</span>, bevor du nach
            Rezepten suchst.
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 font-semibold">Hinzugefügte Zutaten:</h2>

            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient}-${index}`}
                  className="flex items-center justify-between gap-3 rounded border px-3 py-2">
                  <span className="min-w-0 break-words">{ingredient}</span>

                  <button
                    type="button"
                    title="Zutat löschen"
                    aria-label={`${ingredient} löschen`}
                    onClick={() => removeIngredient(index)}
                    className="min-h-10 min-w-10 shrink-0 rounded text-xl font-bold leading-none text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              title="Alle Zutaten löschen"
              aria-label="Alle Zutaten löschen"
              onClick={clearAllIngredients}
              className="mt-3 min-h-11 w-full rounded bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Alle Zutaten löschen
            </button>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="ausgeschlossene-zutat"
            className="mb-1 block font-semibold">
            Zutaten ausschließen
          </label>

          <input
            id="ausgeschlossene-zutat"
            type="text"
            placeholder="z.B. Zwiebel, Knoblauch, Zucker"
            value={excludeIngredients}
            onChange={(event) => setExcludeIngredients(event.target.value)}
            className="min-h-11 w-full rounded border p-2 text-base"
          />
        </div>

        <fieldset className="mt-4">
          <legend className="mb-1 font-semibold">Ernährungsweise</legend>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {dietaryOptions.map((option) => (
              <label
                key={option.value || 'none'}
                className="flex min-h-10 items-start gap-2">
                <input
                  type="radio"
                  name="dietary-preference"
                  value={option.value}
                  checked={dietaryPreference === option.value}
                  onChange={(event) => setDietaryPreference(event.target.value)}
                  className="mt-1 h-4 w-4 shrink-0"
                />

                <span className="min-w-0 break-words">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="mb-1 font-semibold">Unverträglichkeiten</legend>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {intoleranceOptions.map((option) => (
              <label
                key={option.value}
                className="flex min-h-10 items-start gap-2">
                <input
                  type="checkbox"
                  value={option.value}
                  checked={intolerances.includes(option.value)}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setIntolerances([...intolerances, option.value]);
                    } else {
                      setIntolerances(
                        intolerances.filter(
                          (intolerance) => intolerance !== option.value,
                        ),
                      );
                    }
                  }}
                  className="mt-1 h-4 w-4 shrink-0"
                />

                <span className="min-w-0 break-words">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      <button
        type="button"
        aria-label="Rezepte anhand der eingegebenen Zutaten suchen"
        onClick={handleFindRecipes}
        disabled={loading || (!canSearch && !hasPendingInput)}
        className={`mt-4 min-h-11 w-full rounded px-4 py-2 font-medium text-white transition-colors ${
          loading || (!canSearch && !hasPendingInput)
            ? 'bg-gray-400'
            : 'bg-green-600 hover:bg-green-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {loading ? 'Suche...' : 'Rezepte finden'}
      </button>
    </section>
  );
}
