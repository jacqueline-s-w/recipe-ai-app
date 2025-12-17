import { useState } from 'react';

import IngredientInput from '../components/IngredientInput';
import RecipeList from '../components/RecipeList';

export default function Home() {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState(null);
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
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">AI Recipe Finder 🔍🍽️</h1>
      {/* <div className="max-w-xl mx-auto">
        <IngredientInput />
      </div> */}
      <IngredientInput
        ingredients={ingredients}
        setIngredients={setIngredients}
        onFindRecipes={findRecipes}
      />

      <RecipeList recipes={recipes} />
    </div>
  );
}
