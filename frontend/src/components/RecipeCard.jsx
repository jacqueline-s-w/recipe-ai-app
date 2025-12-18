export default function RecipeCard({ recipe }) {
  return (
    <article className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-xl font-semibold">{recipe.title}</h3>

      <p className="text-sm text-gray-600">⏱ {recipe.time} Minuten</p>

      <ul className="list-disc list-inside mt-2">
        {recipe.ingredients.map((ing) => (
          <li key={ing}>{ing}</li>
        ))}
      </ul>
    </article>
  );
}
