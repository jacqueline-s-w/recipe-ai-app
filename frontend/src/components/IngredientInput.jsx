import { useState } from 'react';

export default function IngredientInput({
  ingredients,
  setIngredients,
  onFindRecipes,
}) {
  const [input, setInput] = useState('');

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

        <button
          // type="submit"
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
          Hinzufügen
        </button>
      </form>

      {/*Zutatenliste */}
      <ul className="mt-4 list-disc list-inside">
        {ingredients.map((ing, idx) => (
          <li key={idx}>{ing}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onFindRecipes}
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded w-full">
        Rezepte finden
      </button>
    </section>
  );
}
