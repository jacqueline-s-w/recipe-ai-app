import { useState } from 'react';

export default function RecipeCard({
  recipe,
  matchPercent,
  missingIngredients,
}) {
  // ⭐ STATES MÜSSEN HIER REIN — direkt in die Komponente
  const [imageUrl, setImageUrl] = useState(recipe.image);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  function getMatchColor(percent) {
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  }

  const steps = recipe.zubereitung || recipe.steps || [];

  // ⭐ Handler für „Bild neu generieren“
  async function handleRegenerateImage() {
    setRegenerating(true);
    setImageLoaded(false);

    const res = await fetch('http://localhost:8000/api/regenerate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: recipe.title,
        ingredients: recipe.ingredients,
      }),
    });

    const data = await res.json();
    setImageUrl(data.image);
    setRegenerating(false);
  }

  return (
    <article className="border rounded-lg p-4 shadow-md backdrop-blur-sm relative">
      {matchPercent > 0 && (
        <div
          className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full ${getMatchColor(
            matchPercent,
          )}`}>
          {matchPercent}% Match
        </div>
      )}

      {matchPercent === 0 && (
        <div className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-purple-500 text-white">
          AI-Vorschlag
        </div>
      )}

      {/* ⭐ Bild mit Skeleton Loader */}
      <div className="relative w-full h-48 mb-3">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-md"></div>
        )}

        <img
          src={imageUrl}
          alt={recipe.title}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={`w-full h-48 object-cover rounded-md transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* ⭐ Button: Bild neu generieren */}
      <button
        onClick={handleRegenerateImage}
        disabled={regenerating}
        className={`mt-2 px-3 py-1 rounded text-sm text-white ${
          regenerating ? 'bg-gray-400' : 'bg-blue-600'
        }`}>
        {regenerating ? 'Generiere...' : 'Bild neu generieren'}
      </button>

      <h3 className="text-xl font-semibold mt-3">{recipe.title}</h3>

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
