import { useEffect, useMemo, useRef, useState } from 'react';

export default function RecipeCard({
  recipe,
  matchPercent,
  missingIngredients,
  allergens = [],
  alternatives = {},
}) {
  const fallbackImage = '/images/Allergene_Alternativen.png';

  const [imageUrl, setImageUrl] = useState(recipe.image || fallbackImage);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [readMode, setReadMode] = useState('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeechIndex, setCurrentSpeechIndex] = useState(0);

  const utteranceRef = useRef(null);
  const speechChunksRef = useRef([]);
  const currentSpeechIndexRef = useRef(0);
  const shouldStopSpeechRef = useRef(false);

  const steps = recipe.zubereitung || recipe.steps || [];
  const time = recipe.time_minutes || recipe.time;

  function capitalize(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function getMatchColor(percent) {
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  }

  function buildSpeechChunks() {
    const titleText = recipe.title ? [`Rezept: ${recipe.title}.`] : [];
    const timeText = time ? [`Zubereitungszeit: ${time} Minuten.`] : [];
    const portionsText = recipe.portionen
      ? [`Portionen: ${recipe.portionen}.`]
      : [];

    const ingredientText =
      recipe.ingredients?.length > 0
        ? [`Zutaten: ${recipe.ingredients.join(', ')}.`]
        : [];

    const preparationText =
      steps.length > 0
        ? [
            'Zubereitung:',
            ...steps.map((step, index) => `Schritt ${index + 1}: ${step}`),
          ]
        : [];

    if (readMode === 'ingredients') {
      return [...titleText, ...ingredientText];
    }

    if (readMode === 'preparation') {
      return [...titleText, ...preparationText];
    }

    return [
      ...titleText,
      ...timeText,
      ...portionsText,
      ...ingredientText,
      ...preparationText,
    ];
  }

  const speechChunks = useMemo(
    () => buildSpeechChunks(),
    [readMode, recipe.title, recipe.ingredients, recipe.portionen, steps, time],
  );

  useEffect(() => {
    speechChunksRef.current = speechChunks;
    currentSpeechIndexRef.current = 0;
    setCurrentSpeechIndex(0);

    stopReading();

    return () => {
      stopReading();
    };
  }, [speechChunks]);

  function speakChunk(index) {
    const chunks = speechChunksRef.current;

    if (!chunks.length) return;

    const safeIndex = Math.min(Math.max(index, 0), chunks.length - 1);

    shouldStopSpeechRef.current = true;
    window.speechSynthesis.cancel();

    window.setTimeout(() => {
      shouldStopSpeechRef.current = false;
      currentSpeechIndexRef.current = safeIndex;
      setCurrentSpeechIndex(safeIndex);
      setIsSpeaking(true);
      setIsPaused(false);

      const utterance = new SpeechSynthesisUtterance(chunks[safeIndex]);
      utterance.lang = 'de-DE';
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => {
        if (shouldStopSpeechRef.current) return;

        const nextIndex = currentSpeechIndexRef.current + 1;

        if (nextIndex < speechChunksRef.current.length) {
          speakChunk(nextIndex);
        } else {
          setIsSpeaking(false);
          setIsPaused(false);
          currentSpeechIndexRef.current = 0;
          setCurrentSpeechIndex(0);
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 0);
  }

  function startReading() {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    speakChunk(currentSpeechIndex);
  }

  function pauseReading() {
    if (!isSpeaking) return;

    window.speechSynthesis.pause();
    setIsPaused(true);
  }

  function resumeReading() {
    window.speechSynthesis.resume();
    setIsPaused(false);
    setIsSpeaking(true);
  }

  function stopReading() {
    shouldStopSpeechRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    currentSpeechIndexRef.current = 0;
    setCurrentSpeechIndex(0);
  }

  function jumpReading(direction) {
    const chunks = speechChunksRef.current;
    if (!chunks.length) return;

    const nextIndex = Math.min(
      Math.max(currentSpeechIndexRef.current + direction, 0),
      chunks.length - 1,
    );

    speakChunk(nextIndex);
  }

  async function handleRegenerateImage() {
    setRegenerating(true);
    setImageLoaded(false);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/regenerate-image`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: recipe.title,
            ingredients: recipe.ingredients,
          }),
        },
      );

      const data = await res.json();

      if (data.image) {
        setImageUrl(data.image);
      }
    } catch (error) {
      console.log('Fehler beim Generieren des Bildes:', error);
      setImageUrl(fallbackImage);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <article className="border rounded-lg p-4 shadow-md backdrop-blur-sm relative">
      <span className="sr-only">
        {matchPercent > 0
          ? `${matchPercent} Prozent Übereinstimmung`
          : 'KI-generiertes Rezept'}
      </span>

      {matchPercent > 0 && (
        <div
          className={`absolute top-2 right-2 z-10 text-white text-xs font-bold px-2 py-1 rounded-full ${getMatchColor(
            matchPercent,
          )}`}>
          {matchPercent}% Match
        </div>
      )}

      {matchPercent === 0 && (
        <div className="absolute top-2 right-2 z-10 text-xs font-bold px-2 py-1 rounded-full bg-purple-500 text-white">
          KI-Vorschlag
        </div>
      )}

      <div className="relative w-full h-48 mb-3 z-0 bg-gray-100 rounded-md overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200" aria-hidden="true" />
        )}

        <img
          src={imageUrl}
          alt={`Rezeptbild: ${recipe.title}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageUrl(fallbackImage);
            setImageLoaded(true);
          }}
          className={`w-full h-48 object-cover rounded-md transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <button
        aria-label="Bild für dieses Rezept neu generieren"
        onClick={handleRegenerateImage}
        disabled={regenerating}
        className={`mt-2 px-4 py-2 rounded font-medium text-white transition-colors ${
          regenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {regenerating ? 'Generiere Bild...' : 'Bild neu generieren'}
      </button>

      <h3 className="text-xl font-semibold mt-3">{recipe.title}</h3>

      {time && (
        <p className="text-sm text-gray-600 mt-1">
          ⏱ Zubereitungszeit: {time} Minuten
        </p>
      )}

      {recipe.portionen && (
        <p className="text-sm text-gray-600">Portionen: {recipe.portionen}</p>
      )}

      <div className="mt-3 border rounded p-3 bg-gray-50">
        <label
          htmlFor={`read-mode-${recipe.title}`}
          className="block font-semibold mb-2">
          Vorlesen:
        </label>

        <select
          id={`read-mode-${recipe.title}`}
          value={readMode}
          onChange={(event) => setReadMode(event.target.value)}
          className="w-full border rounded p-2 mb-3">
          <option value="all">Alles vorlesen</option>
          <option value="ingredients">Nur Zutaten vorlesen</option>
          <option value="preparation">Nur Zubereitung vorlesen</option>
        </select>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => jumpReading(-1)}
            title="Zurückspulen"
            aria-label="Zurückspulen"
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
            Zurück
          </button>

          <button
            type="button"
            onClick={startReading}
            title="Vorlesen starten"
            aria-label="Vorlesen starten"
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
            Start
          </button>

          <button
            type="button"
            onClick={pauseReading}
            title="Vorlesen pausieren"
            aria-label="Vorlesen pausieren"
            disabled={!isSpeaking || isPaused}
            className={`px-3 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
              !isSpeaking || isPaused
                ? 'bg-gray-400'
                : 'bg-yellow-500 hover:bg-yellow-600'
            }`}>
            Pause
          </button>

          <button
            type="button"
            onClick={resumeReading}
            title="Vorlesen fortsetzen"
            aria-label="Vorlesen fortsetzen"
            disabled={!isPaused}
            className={`px-3 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
              !isPaused ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}>
            Weiter
          </button>

          <button
            type="button"
            onClick={stopReading}
            title="Vorlesen stoppen"
            aria-label="Vorlesen stoppen"
            disabled={!isSpeaking && !isPaused}
            className={`px-3 py-2 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
              !isSpeaking && !isPaused
                ? 'bg-gray-400'
                : 'bg-red-600 hover:bg-red-700'
            }`}>
            Stopp
          </button>
        </div>

        <button
          type="button"
          onClick={() => jumpReading(1)}
          title="Vorspulen"
          aria-label="Vorspulen"
          className="mt-2 w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          Vorspulen
        </button>

        {(isSpeaking || isPaused) && (
          <p className="mt-2 text-sm text-gray-600" aria-live="polite">
            Abschnitt {currentSpeechIndex + 1} von {speechChunks.length}
            {isPaused ? ' pausiert' : ' wird vorgelesen'}
          </p>
        )}
      </div>

      <h4 className="mt-3 font-bold">Zutaten:</h4>
      <ul className="list-disc list-inside mt-2">
        {recipe.ingredients?.map((ingredient) => (
          <li key={ingredient}>{ingredient}</li>
        ))}
      </ul>

      {allergens.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded">
          <h4 className="font-bold text-red-700 mb-1">⚠️ Allergene</h4>
          <ul className="list-disc list-inside text-red-700">
            {allergens.map((allergen) => (
              <li key={allergen}>
                <span className="font-semibold">{capitalize(allergen)}</span>
                {alternatives[allergen] &&
                  alternatives[allergen].length > 0 && (
                    <span className="text-gray-700 ml-2">
                      → Alternativen:{' '}
                      {alternatives[allergen].map(capitalize).join(', ')}
                    </span>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingIngredients?.length > 0 && (
        <div className="mt-2 text-sm text-red-500">
          Fehlt: {missingIngredients.join(', ')}
        </div>
      )}

      {steps.length > 0 && (
        <>
          <h4 className="mt-4 font-bold">Zubereitung:</h4>
          <ol className="list-decimal list-inside mt-2 space-y-2">
            {steps.map((step, index) => (
              <li
                className="leading-relaxed"
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
