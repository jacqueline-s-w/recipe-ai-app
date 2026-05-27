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
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function findRecipes(ingredients, excludeIngredients, intolerances) {
    if (ingredients.length === 0) {
      setError('Bitte gib mindestens eine Zutat ein.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          exclude_ingredients: excludeIngredients,
          intolerances: intolerances,
        }),
      });

      const data = await res.json();
      setRecipes(data.recipes || []);

      if (!data.recipes || data.recipes.length === 0) {
        setError('Keine passenden Rezepte gefunden.');
      }
    } catch (error) {
      console.log('Fehler beim Abrufen der Rezepte:', error);
      setError('Das Backend ist nicht erreichbar.');
    }

    setLoading(false);
  }

  return (
    <div id="main" className="container mx-auto p-4 md:p-6 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">AI Recipe Finder 🔍🍽️</h1>

      <IngredientInput
        ingredients={ingredients}
        setIngredients={setIngredients}
        onFindRecipes={findRecipes}
        loading={loading}
      />

      {error && <p className="text-red-600 mt-4 font-medium">{error}</p>}

      {loading && (
        <p className="mt-4 text-gray-600 animate-pulse">
          🔄 Suche nach passenden Rezepten...
        </p>
      )}

      <RecipeList recipes={recipes} loading={loading} />
    </div>
  );
}
