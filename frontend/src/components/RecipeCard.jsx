import { useEffect, useMemo, useState } from 'react';

import RecipeImage from './RecipeImage';
import RecipeWarnings from './RecipeWarnings';

function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getMatchColor(percent) {
  if (percent >= 70) return 'bg-green-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-gray-400';
}

export default function RecipeCard({
  recipe,
  matchPercent,
  missingIngredients = [],
  allergens = [],
  alternatives = {},
}) {
  const [imageUrl, setImageUrl] = useState(recipe.image || null);
  const [imageLoaded, setImageLoaded] = useState(!recipe.image);
  const [imageFailed, setImageFailed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const steps = useMemo(
    () => recipe.zubereitung || recipe.steps || [],
    [recipe.zubereitung, recipe.steps],
  );
  const time = recipe.time_minutes || recipe.time;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    setImageUrl(recipe.image || null);
    setImageLoaded(!recipe.image);
    setImageFailed(false);
  }, [recipe.image]);

  async function handleRegenerateImage() {
    setRegenerating(true);
    setImageLoaded(false);
    setImageFailed(false);

    try {
      const res = await fetch(`${apiUrl}/api/regenerate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recipe.title,
          ingredients: recipe.ingredients,
        }),
      });

      const data = await res.json();

      if (data.image) {
        setImageUrl(data.image);
      } else {
        setImageFailed(true);
      }
    } catch (error) {
      console.log('Fehler beim Generieren des Bildes:', error);
      setImageFailed(true);
    } finally {
      setRegenerating(false);
      setImageLoaded(true);
    }
  }

  return (
    <article className="relative overflow-hidden rounded-lg border p-3 shadow-md backdrop-blur-sm sm:p-4">
      <span className="sr-only">
        {matchPercent > 0
          ? `${matchPercent} Prozent Übereinstimmung`
          : 'KI-generiertes Rezept'}
      </span>

      {matchPercent > 0 && (
        <div
          className={`absolute top-2 right-2 z-10 rounded-full px-2 py-1 text-xs font-bold text-white ${getMatchColor(
            matchPercent,
          )}`}>
          {matchPercent}% Match
        </div>
      )}

      {matchPercent === 0 && (
        <div className="absolute top-2 right-2 z-10 rounded-full bg-purple-500 px-2 py-1 text-xs font-bold text-white">
          KI-Vorschlag
        </div>
      )}

      <RecipeImage
        imageUrl={imageUrl}
        imageLoaded={imageLoaded}
        imageFailed={imageFailed}
        regenerating={regenerating}
        recipeTitle={recipe.title}
        onImageLoad={() => setImageLoaded(true)}
        onImageError={() => {
          setImageFailed(true);
          setImageLoaded(true);
          setImageUrl(null);
        }}
        onRegenerateImage={handleRegenerateImage}
      />

      <h3 className="mt-3 break-words text-lg font-semibold leading-snug sm:text-xl">
        {recipe.title}
      </h3>

      {time && (
        <p className="mt-1 text-sm text-gray-600">
          Zubereitungszeit: {time} Minuten
        </p>
      )}

      {recipe.portionen && (
        <p className="text-sm text-gray-600">Portionen: {recipe.portionen}</p>
      )}

      <h4 className="mt-3 font-bold">Zutaten:</h4>
      <ul className="mt-2 list-outside list-disc space-y-1 pl-5">
        {recipe.ingredients?.map((ingredient) => (
          <li className="break-words" key={ingredient}>
            {ingredient}
          </li>
        ))}
      </ul>

      <RecipeWarnings
        allergens={allergens}
        alternatives={alternatives}
        missingIngredients={missingIngredients}
        onCapitalize={capitalize}
      />

      {steps.length > 0 && (
        <>
          <h4 className="mt-4 font-bold">Zubereitung:</h4>
          <ol className="mt-2 list-outside list-decimal space-y-2 pl-5">
            {steps.map((step, index) => (
              <li
                className="break-words leading-relaxed"
                key={`${recipe.title}-step-${index}`}>
                {step}
              </li>
            ))}
          </ol>
        </>
      )}
    </article>
  );
}
