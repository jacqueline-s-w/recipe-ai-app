import { useEffect, useState } from 'react';

import IngredientInput from '../components/IngredientInput';
import RecipeList from '../components/RecipeList';

export default function Home() {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ingredients.length > 0) {
      setError('');
    }
  }, [ingredients]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  function clearResults() {
    setRecipes([]);
    setError('');
  }

  async function findRecipes(
    ingredients,
    excludeIngredients,
    intolerances,
    dietaryPreference,
  ) {
    if (ingredients.length === 0) {
      setError('Bitte gib mindestens eine Zutat ein.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          exclude_ingredients: excludeIngredients,
          intolerances,
          dietary_preference: dietaryPreference,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.detail || 'Die Rezeptsuche ist fehlgeschlagen.',
        );
      }

      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (error) {
      console.log('Fehler beim Abrufen der Rezepte:', error);
      setRecipes([]);
      setError(error.message || 'Das Backend ist nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="main"
      className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 md:px-6">
      <h1 className="mb-6 break-words text-3xl font-bold leading-tight sm:text-4xl">
        AI Recipe Finder
      </h1>

      <IngredientInput
        ingredients={ingredients}
        setIngredients={setIngredients}
        onFindRecipes={findRecipes}
        onClearResults={clearResults}
        loading={loading}
      />

      {error && <p className="mt-4 font-medium text-red-600">{error}</p>}

      {loading && (
        <p className="mt-4 text-gray-600" role="status" aria-live="polite">
          Suche nach passenden Rezepten. Wenn das Backend gerade aufwacht, kann
          die erste Anfrage bis zu 60 Sekunden dauern.
        </p>
      )}

      <RecipeList recipes={recipes} loading={loading} />
    </div>
  );
}
