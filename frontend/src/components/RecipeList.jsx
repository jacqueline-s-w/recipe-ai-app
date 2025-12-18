import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes }) {
  return (
    <section className="mt-8 max-w-xl mx-auto">
      {recipes && recipes.length !== 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Gefundene Rezepte</h2>
          <ul className="space-y-4">
            {recipes.map((recipe) => (
              <li key={recipe.title}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
