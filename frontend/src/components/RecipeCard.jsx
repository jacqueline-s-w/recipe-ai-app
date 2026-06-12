import { useEffect, useMemo, useRef, useState } from 'react';

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

  const [readMode, setReadMode] = useState('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeechIndex, setCurrentSpeechIndex] = useState(0);
  const [voiceControlEnabled, setVoiceControlEnabled] = useState(false);
  const [voiceControlMessage, setVoiceControlMessage] = useState('');

  const utteranceRef = useRef(null);
  const speechChunksRef = useRef([]);
  const currentSpeechIndexRef = useRef(0);
  const shouldStopSpeechRef = useRef(false);
  const recognitionRef = useRef(null);

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

  function getAllergenSpeechText() {
    if (!allergens.length) return [];

    return [
      'Hinweis zu Allergenen:',
      ...allergens.map((allergen) => {
        const alternativeText = alternatives[allergen]?.length
          ? `Alternativen: ${alternatives[allergen].join(', ')}.`
          : 'Keine Alternativen hinterlegt.';

        return `${capitalize(allergen)}. ${alternativeText}`;
      }),
    ];
  }

  function getMissingIngredientsSpeechText() {
    if (!missingIngredients.length) return [];

    return [
      `Folgende eingegebene Zutaten wurden nicht verwendet, weil sie fehlen, ausgeschlossen oder wegen einer Unverträglichkeit problematisch sind: ${missingIngredients.join(
        ', ',
      )}.`,
    ];
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

    const allergenText = getAllergenSpeechText();
    const missingText = getMissingIngredientsSpeechText();

    const preparationText =
      steps.length > 0
        ? [
            'Zubereitung:',
            ...steps.map((step, index) => `Schritt ${index + 1}: ${step}`),
          ]
        : [];

    if (readMode === 'ingredients') {
      return [...titleText, ...ingredientText, ...allergenText, ...missingText];
    }

    if (readMode === 'preparation') {
      return [...titleText, ...preparationText];
    }

    if (readMode === 'warnings') {
      return [...titleText, ...allergenText, ...missingText];
    }

    return [
      ...titleText,
      ...timeText,
      ...portionsText,
      ...ingredientText,
      ...allergenText,
      ...missingText,
      ...preparationText,
    ];
  }

  const speechChunks = useMemo(
    () => buildSpeechChunks(),
    [
      readMode,
      recipe.title,
      recipe.ingredients,
      recipe.portionen,
      steps,
      time,
      allergens,
      alternatives,
      missingIngredients,
    ],
  );

  useEffect(() => {
    speechChunksRef.current = speechChunks;
    currentSpeechIndexRef.current = 0;
    setCurrentSpeechIndex(0);

    stopReading();

    return () => {
      stopReading();
      stopVoiceControl();
    };
  }, [speechChunks]);

  useEffect(() => {
    setImageUrl(recipe.image || null);
    setImageLoaded(!recipe.image);
    setImageFailed(false);
  }, [recipe.image]);

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

  function handleVoiceCommand(command) {
    const normalizedCommand = command.toLowerCase();

    if (
      normalizedCommand.includes('vorlesen') ||
      normalizedCommand.includes('start')
    ) {
      startReading();
      return;
    }

    if (
      normalizedCommand.includes('pause') ||
      normalizedCommand.includes('pausieren')
    ) {
      pauseReading();
      return;
    }

    if (
      normalizedCommand.includes('weiter') ||
      normalizedCommand.includes('fortsetzen')
    ) {
      resumeReading();
      return;
    }

    if (
      normalizedCommand.includes('stopp') ||
      normalizedCommand.includes('stop')
    ) {
      stopReading();
      return;
    }

    if (normalizedCommand.includes('zurück')) {
      jumpReading(-1);
      return;
    }

    if (
      normalizedCommand.includes('vor') ||
      normalizedCommand.includes('weiter springen')
    ) {
      jumpReading(1);
      return;
    }

    setVoiceControlMessage(
      'Befehl nicht erkannt. Möglich sind: vorlesen, pause, weiter, stopp, zurück, vor.',
    );
  }

  function startVoiceControl() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceControlMessage(
        'Sprachbefehle werden in diesem Browser nicht unterstützt. Bitte Chrome oder Edge verwenden.',
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const latestResult = event.results[event.results.length - 1];
      const transcript = latestResult[0].transcript;
      setVoiceControlMessage(`Erkannter Befehl: ${transcript}`);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = () => {
      setVoiceControlMessage(
        'Sprachbefehl konnte nicht erkannt werden. Bitte erneut versuchen.',
      );
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceControlEnabled(true);
    setVoiceControlMessage(
      'Sprachbefehle aktiv. Möglich sind: vorlesen, pause, weiter, stopp, zurück, vor.',
    );
  }

  function stopVoiceControl() {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setVoiceControlEnabled(false);
  }

  async function handleRegenerateImage() {
    setRegenerating(true);
    setImageLoaded(false);
    setImageFailed(false);

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

      <div className="relative w-full h-48 mb-3 z-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
        {imageUrl && !imageFailed ? (
          <>
            {!imageLoaded && (
              <div
                className="absolute inset-0 bg-gray-200"
                aria-hidden="true"
              />
            )}

            <img
              src={imageUrl}
              alt={`Rezeptbild: ${recipe.title}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageFailed(true);
                setImageLoaded(true);
                setImageUrl(null);
              }}
              className={`w-full h-48 object-cover rounded-md transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="text-center px-4 text-sm text-gray-600">
            Für dieses KI-Rezept wurde noch kein Bild generiert.
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Bild für dieses Rezept neu generieren"
        title="Bild für dieses Rezept neu generieren"
        onClick={handleRegenerateImage}
        disabled={regenerating}
        className={`mt-2 px-4 py-2 rounded font-medium text-white transition-colors ${
          regenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {regenerating ? 'Generiere Bild...' : 'Bild generieren'}
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
          <option value="ingredients">Zutaten und Hinweise vorlesen</option>
          <option value="warnings">
            Nur Allergene und fehlende Zutaten vorlesen
          </option>
          <option value="preparation">Nur Zubereitung vorlesen</option>
        </select>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => jumpReading(-1)}
            title="Zurückspulen"
            aria-label="Zurückspulen"
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Zurück
          </button>

          <button
            type="button"
            onClick={startReading}
            title="Vorlesen starten"
            aria-label="Vorlesen starten"
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Start
          </button>

          <button
            type="button"
            onClick={pauseReading}
            title="Vorlesen pausieren"
            aria-label="Vorlesen pausieren"
            disabled={!isSpeaking || isPaused}
            className={`px-3 py-2 text-white rounded ${!isSpeaking || isPaused ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
            Pause
          </button>

          <button
            type="button"
            onClick={resumeReading}
            title="Vorlesen fortsetzen"
            aria-label="Vorlesen fortsetzen"
            disabled={!isPaused}
            className={`px-3 py-2 text-white rounded ${!isPaused ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            Weiter
          </button>

          <button
            type="button"
            onClick={stopReading}
            title="Vorlesen stoppen"
            aria-label="Vorlesen stoppen"
            disabled={!isSpeaking && !isPaused}
            className={`px-3 py-2 text-white rounded ${!isSpeaking && !isPaused ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}>
            Stopp
          </button>
        </div>

        <button
          type="button"
          onClick={() => jumpReading(1)}
          title="Vorspulen"
          aria-label="Vorspulen"
          className="mt-2 w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Vorspulen
        </button>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={voiceControlEnabled ? stopVoiceControl : startVoiceControl}
            title={
              voiceControlEnabled
                ? 'Sprachbefehle deaktivieren'
                : 'Sprachbefehle aktivieren'
            }
            aria-label={
              voiceControlEnabled
                ? 'Sprachbefehle deaktivieren'
                : 'Sprachbefehle aktivieren'
            }
            className={`px-3 py-2 text-white rounded ${
              voiceControlEnabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {voiceControlEnabled ? 'Sprachbefehle aus' : 'Sprachbefehle an'}
          </button>

          <p className="text-sm text-gray-600" aria-live="polite">
            Sag: vorlesen, pause, weiter, stopp, zurück oder vor.
          </p>
        </div>

        {voiceControlMessage && (
          <p className="mt-2 text-sm text-gray-600" aria-live="polite">
            {voiceControlMessage}
          </p>
        )}

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
          Nicht verwendet: {missingIngredients.join(', ')}
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
