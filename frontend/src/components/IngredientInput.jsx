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
  const [intolerances, setIntolerances] = useState([]);

  function addIngredients(event) {
    event.preventDefault();

    const newIngredients = input
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    if (newIngredients.length === 0) return;

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
    onClearResults();
  }

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
        <label htmlFor="zutat" className="block text-sm font-medium mb-1">
          Zutaten (Komma getrennt):
        </label>

        <input
          id="zutat"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="min-h-11 w-full rounded border p-2 text-base"
          placeholder="z.B. Tomate, Käse, Basilikum"
        />

        <button
          type="submit"
          title="Zutaten hinzufügen"
          aria-label="Zutaten hinzufügen"
          className="mt-3 min-h-11 w-full rounded bg-blue-600 px-4 py-2 font-medium text-white sm:w-auto
          hover:bg-blue-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Hinzufügen
        </button>

        {ingredients.length > 0 && (
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Hinzugefügte Zutaten:</h2>

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
                    className="min-h-10 min-w-10 shrink-0 rounded text-xl font-bold leading-none text-red-600 hover:text-red-800
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
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
              className="mt-3 min-h-11 w-full rounded bg-red-600 px-4 py-2 font-medium text-white
              hover:bg-red-700 transition-colors
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Alle Zutaten löschen
            </button>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="ausgeschlossene-zutat"
            className="block font-semibold mb-1">
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

        <div className="mt-4">
          <label className="block font-semibold mb-1">
            Unverträglichkeiten
          </label>

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
        </div>
      </form>

      <button
        type="button"
        aria-label="Rezepte anhand der eingegebenen Zutaten suchen"
        onClick={() =>
          onFindRecipes(
            ingredients,
            excludeIngredients
              .split(',')
              .map((ingredient) => ingredient.trim())
              .filter(Boolean),
            intolerances,
          )
        }
        disabled={loading || ingredients.length === 0}
        className={`mt-4 w-full ${
          loading || ingredients.length === 0
            ? 'bg-gray-400'
            : 'bg-green-600 hover:bg-green-700'
        } min-h-11 rounded px-4 py-2 font-medium text-white transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {loading ? 'Suche...' : 'Rezepte finden'}
      </button>
    </section>
  );
}
