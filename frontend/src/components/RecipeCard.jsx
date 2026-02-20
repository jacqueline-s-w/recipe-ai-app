export default function RecipeCard({ recipe, matchPercent }) {
  function getMatchColor(percent) {
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  }
  return (
    <article className="border rounded-lg p-4 shadow-md backdrop-blur-sm relative">
      {matchPercent > 0 && (
        <div
          className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full ${getMatchColor(matchPercent)}`}>
          {matchPercent}% Match
        </div>
      )}
      {matchPercent === 0 && (
        <div className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-purple-500 text-white">
          AI-Vorschlag
        </div>
      )}
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
