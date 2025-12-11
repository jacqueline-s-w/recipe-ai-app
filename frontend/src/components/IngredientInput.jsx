import { useState } from 'react';

export default function IngredientInput() {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState(null);

  // Mehrere Zutaten mit Komma getrennt hinzufügen
  async function addIngredient(e) {
    e.preventDefault();
    if (input.trim() === '') return;
    // Eingabe splitten, trimmen und leere Strings filtern
    const newIngredients = input
      .split(',')
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    setIngredients((prev) => [...prev, ...newIngredients]);
    setInput(''); //Eingabefeld leeren
  }

  // Rezepte anhand der Zutaten abrufen
  async function findRecipes() {
    try {
      const res = await fetch('http://localhost:8000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      setRecipes(data); //Ergebnis speichern
    } catch (error) {
      console.log('Fehler beim Abrufen der Rezepte:', error);
    }
  }
  return (
    <form onSubmit={addIngredient}>
      <div className="bg-white shadow p-4 rounded-xl">
        {' '}
        <label
          htmlFor="zutat"
          className="block text-sm font-medium text-gray-300">
          Zutat (Komma getrennt):
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="z.B. Tomate, Käse, Basilikum..."
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
          Hinzufügen
        </button>
        {/*Zutatenliste */}
        <ul className="mt-4 list-disc list-inside">
          {ingredients.map((ing, idx) => (
            <li key={idx}>{ing}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={findRecipes}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded w-full">
          Rezepte finden
        </button>
        {/*Rezepte anzeigen */}
        {recipes && (
          <div className="mt-6">
            <h2 className="text-lg font-bold">Gefundene Rezepte:</h2>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(recipes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </form>
  );
}
