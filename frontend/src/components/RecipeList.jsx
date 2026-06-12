import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes, loading }) {
  if (loading) {
    return null;
  }

  if (!recipes || recipes.length === 0) {
    return (
      <p className="text-gray-600 mt-6 text-center">
        Noch keine Rezepte gefunden.
      </p>
    );
  }

  return (
    <section className="mt-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Gefundene Rezepte</h2>

      <ul className="space-y-4">
        {recipes.map((item) => (
          <li key={`${item.recipe.title}-${item.match_percent}`}>
            <RecipeCard
              recipe={item.recipe}
              matchPercent={item.match_percent}
              missingIngredients={item.missing_ingredients}
              allergens={item.allergens}
              alternatives={item.alternatives}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
