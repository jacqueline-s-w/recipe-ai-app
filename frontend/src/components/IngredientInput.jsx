import { useState } from 'react';

export default function IngredientInput({
  ingredients,
  setIngredients,
  onFindRecipes,
  loading,
}) {
  const [input, setInput] = useState('');
  const [excludeIngredients, setExcludeIngredients] = useState('');
  const [intolerances, setIntolerances] = useState([]);

  const btn = 'px-4 py-2 rounded font-medium transition-colors';
  // Mehrere Zutaten mit Komma getrennt hinzufügen
  async function addIngredient(e) {
    e.preventDefault();
    if (!input.trim()) return;
    // Eingabe splitten, trimmen und leere Strings filtern
    const newIngredients = input
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    setIngredients((prev) => [...prev, ...newIngredients]);
    setInput(''); //Eingabefeld leeren
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
      <form onSubmit={addIngredient}>
        <label htmlFor="zutat" className="block text-sm font-medium mb-1">
          Zutaten (Komma getrennt):
        </label>

        <input
          id="zutat"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="z.B. Tomate, Käse, Basilikum"
        />
        <div className="mt-4">
          <label
            htmlFor="ausgeschlossene zutat"
            className="block font-semibold mb-1">
            Zutaten ausschließen
          </label>
          <input
            id="ausgeschlossene zutat"
            type="text"
            placeholder="z.B. Zwiebel, Knoblauch, Zucker"
            value={excludeIngredients}
            onChange={(e) => setExcludeIngredients(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mt-4">
          <label className="block font-semibold mb-1">
            Unverträglichkeiten
          </label>
          <div className="mt-4">
            <label className="block font-semibold mb-1">
              Unverträglichkeiten
            </label>

            <div className="grid grid-cols-2 gap-2">
              {intoleranceOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={intolerances.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIntolerances([...intolerances, opt.value]);
                      } else {
                        setIntolerances(
                          intolerances.filter((i) => i !== opt.value),
                        );
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded
  hover:bg-blue-700 transition-colors
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Hinzufügen
        </button>
      </form>

      {/*Zutatenliste */}
      <ul className="mt-4 list-disc list-inside">
        {ingredients.map((ing) => (
          <li key={`ingredients-list-${ing}`}>{ing}</li>
        ))}
      </ul>

      <button
        type="button"
        aria-label="Rezepte anhand der eingegebenen Zutaten suchen"
        onClick={() =>
          onFindRecipes(
            ingredients,
            excludeIngredients
              .split(',')
              .map((i) => i.trim())
              .filter(Boolean),
            intolerances,
          )
        }
        disabled={loading}
        className={`w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {loading ? 'Suche...' : 'Rezepte finden'}
      </button>
    </section>
  );
}
