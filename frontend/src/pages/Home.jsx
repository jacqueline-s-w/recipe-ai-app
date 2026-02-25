import { useEffect, useState } from 'react';

import IngredientInput from '../components/IngredientInput';
import RecipeList from '../components/RecipeList';

export default function Home() {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (ingredients.length > 0) {
      setError('');
    }
  }, [ingredients]);
  // Rezepte anhand der Zutaten abrufen
  async function findRecipes() {
    // setError('');

    if (ingredients.length === 0) {
      setError('Bitte gib mindestens eine Zutat ein.');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      setRecipes(data.recipes); //Ergebnis speichern
    } catch (error) {
      console.log('Fehler beim Abrufen der Rezepte:', error);
    }
  }
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">AI Recipe Finder 🔍🍽️</h1>

      <IngredientInput
        ingredients={ingredients}
        setIngredients={setIngredients}
        onFindRecipes={findRecipes}
      />
      {error && <p className="text-red-600 mt-4 font-medium">{error}</p>}

      <RecipeList recipes={recipes} />
    </div>
  );
}
