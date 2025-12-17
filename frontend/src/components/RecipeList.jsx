import RecipeCard from './RecipeCard';

export default function RecipeList({ recipes }) {
  //   if (!recipes) return null;

  return (
    <section className="mt-8 max-w-xl mx-auto">
      {recipes && (
        <>
          <h2 className="text-2xl font-bold mb-4">Gefundene Rezepte</h2>
          <ul className="space-y-4">
            {recipes.map((recipe, idx) => (
              <RecipeCard key={idx} recipe={recipe} />
            ))}
          </ul>
        </>
      )}
      {!recipes && <h2>Keine Rezepte gefunden.</h2>}
    </section>
  );
}
