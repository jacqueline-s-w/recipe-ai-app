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
    <section className="bg-white shadow p-4 rounded-xl">
      <form onSubmit={addIngredients}>
        <label htmlFor="zutat" className="block text-sm font-medium mb-1">
          Zutaten (Komma getrennt):
        </label>

        <input
          id="zutat"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="border p-2 rounded w-full"
          placeholder="z.B. Tomate, Käse, Basilikum"
        />

        <button
          type="submit"
          title="Zutaten hinzufügen"
          aria-label="Zutaten hinzufügen"
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded font-medium
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
                  className="flex items-center justify-between gap-3 border rounded px-3 py-2">
                  <span>{ingredient}</span>

                  <button
                    type="button"
                    title="Zutat löschen"
                    aria-label={`${ingredient} löschen`}
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-800 font-bold text-xl leading-none
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded">
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
              className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded font-medium
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
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold mb-1">
            Unverträglichkeiten
          </label>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {intoleranceOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
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
                  className="h-4 w-4"
                />

                <span>{option.label}</span>
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
        } text-white px-4 py-2 rounded font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {loading ? 'Suche...' : 'Rezepte finden'}
      </button>
    </section>
  );
}
