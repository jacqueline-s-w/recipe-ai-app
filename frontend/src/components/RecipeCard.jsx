export default function RecipeCard({
  recipe,
  matchPercent,
  missingIngredients,
}) {
  function getMatchColor(percent) {
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  }

  // Fallbacks
  const imageUrl = recipe.image || '/placeholder.jpg';

  const steps = recipe.zubereitung || recipe.steps || [];

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

      {/* Bild */}
      <img
        src={imageUrl}
        alt={recipe.title}
        className="w-full h-48 object-cover rounded-md mb-3"
      />

      <h3 className="text-xl font-semibold">{recipe.title}</h3>

      <p className="text-sm text-gray-600">⏱ {recipe.time} Minuten</p>

      <h4 className="mt-2 font font-bold">Zutaten:</h4>
      <ul className="list-disc list-inside mt-2">
        {recipe.ingredients?.map((ing) => (
          <li key={ing}>{ing}</li>
        ))}
      </ul>

      {missingIngredients?.length > 0 && (
        <div className="mt-2 text-sm text-red-500">
          Fehlt: {missingIngredients.join(', ')}
        </div>
      )}

      {/* Zubereitung / Steps */}
      {steps.length > 0 && (
        <>
          <h4 className="mt-4 font-bold">Zubereitung:</h4>
          <ul className="list-decimal list-inside mt-2 space-y-4">
            {steps.map((zub, index) => (
              <li className="marker:font-bold" key={index}>
                {zub}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
