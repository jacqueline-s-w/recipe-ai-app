import RecipeCard from './RecipeCard';
import RecipeSkeleton from './RecipeSkeleton';

export default function RecipeList({ recipes, loading }) {
  return (
    <section className="mt-8 max-w-xl mx-auto">
      {loading && (
        <ul className="space-y-4">
          <RecipeSkeleton />
          <RecipeSkeleton />
        </ul>
      )}

      {!loading && recipes && recipes.length !== 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Gefundene Rezepte</h2>
          <ul className="space-y-4">
            {recipes.map((item) => (
              <li key={item.recipe.title}>
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
        </>
      )}
    </section>
  );
}
