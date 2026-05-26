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

  return (
    <section className="bg-white shadow p-4 rounded-xl">
      <form onSubmit={addIngredient}>
        <label htmlFor="zutat" className="block text-sm font-medium mb-1">
          Zutaten (Komma getrennt):
        </label>

        <input
          // type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="z.B. Tomate, Käse, Basilikum"
        />
        <div className="mt-4">
          <label className="block font-semibold mb-1">
            Zutaten ausschließen
          </label>
          <input
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
          <select
            multiple
            value={intolerances}
            onChange={(e) =>
              setIntolerances(
                Array.from(e.target.selectedOptions, (opt) => opt.value),
              )
            }
            className="w-full p-2 border rounded h-32">
            <option value="gluten">Gluten</option>
            <option value="laktose">Laktose</option>
            <option value="histamin">Histamin</option>
            <option value="fruktose">Fruktose</option>
            <option value="soja">Soja</option>
            <option value="tierisches_eiweiss">Tierisches Eiweiß</option>
            <option value="nuesse">Nüsse</option>
          </select>
        </div>

        <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
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
        className={`w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded font-medium transition-colors`}>
        {loading ? 'Suche...' : 'Rezepte finden'}
      </button>
    </section>
  );
}
