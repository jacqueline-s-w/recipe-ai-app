import { useState } from 'react';

export default function IngredientInput() {
  const [ingredients, setIngredients] = useState(false);
  const [input, setInput] = useState(false);
  const [submit, setSubmit] = useState(false);
  async function handleRecipeSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringyfy({ ingredients }),
      });
      const data = await res.json();
    } catch (error) {}
  }
  return (
    <form onSubmit={submit}>
      <div className="bg-white shadow p-4 rounded-xl">
        {' '}
        <label
          htmlFor="zutat"
          className="block text-sm font-medium text-gray-300">
          Zutat:
        </label>
        <input
          type="text"
          value={ingredients}
          onChange={(i) => setIngredients(i.target.value)}
          placeholder="Zutat eingeben..."
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
          Hinzufügen
        </button>
        {/*Liste */}
        <ul className="mt-4">{/*hier erscheinen später die Zutaten */}</ul>
        <button className="mt-6 bg-green-600 text-white px-4 py-2 rounded w-full">
          Rezepte finden
        </button>
      </div>
    </form>
  );
}
