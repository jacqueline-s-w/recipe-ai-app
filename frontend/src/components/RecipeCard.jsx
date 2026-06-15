import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

  const [readMode, setReadMode] = useState('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeechIndex, setCurrentSpeechIndex] = useState(0);
  const [isRecordingVoiceCommand, setIsRecordingVoiceCommand] = useState(false);
  const [voiceControlMessage, setVoiceControlMessage] = useState('');

  const utteranceRef = useRef(null);
  const speechChunksRef = useRef([]);
  const currentSpeechIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldStopSpeechRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceCommandTimeoutRef = useRef(null);

  const steps = useMemo(
    () => recipe.zubereitung || recipe.steps || [],
    [recipe.zubereitung, recipe.steps],
  );
  const time = recipe.time_minutes || recipe.time;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const getAllergenSpeechText = useCallback(() => {
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
  }, [allergens, alternatives]);

  const getMissingIngredientsSpeechText = useCallback(() => {
    if (!missingIngredients.length) return [];

    return [
      `Folgende eingegebene Zutaten wurden nicht verwendet, weil sie fehlen, ausgeschlossen oder wegen einer Unverträglichkeit problematisch sind: ${missingIngredients.join(
        ', ',
      )}.`,
    ];
  }, [missingIngredients]);

  const buildSpeechChunks = useCallback(() => {
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
      return [...ingredientText, ...allergenText, ...missingText];
    }

    if (readMode === 'preparation') {
      return preparationText;
    }

    if (readMode === 'warnings') {
      return [...allergenText, ...missingText];
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
  }, [
    readMode,
    recipe.title,
    recipe.ingredients,
    recipe.portionen,
    steps,
    time,
    getAllergenSpeechText,
    getMissingIngredientsSpeechText,
  ]);

  const speechChunks = useMemo(() => buildSpeechChunks(), [buildSpeechChunks]);

  useEffect(() => {
    speechChunksRef.current = speechChunks;
    currentSpeechIndexRef.current = 0;
    setCurrentSpeechIndex(0);

    stopReading();

    return () => {
      stopReading();
      stopVoiceCommandRecording({ transcribe: false });
    };
  }, [speechChunks]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

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
      isSpeakingRef.current = true;
      isPausedRef.current = false;
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
          isSpeakingRef.current = false;
          isPausedRef.current = false;
          setIsSpeaking(false);
          setIsPaused(false);
          currentSpeechIndexRef.current = 0;
          setCurrentSpeechIndex(0);
        }
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        isPausedRef.current = false;
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 0);
  }

  function startReading() {
    if (isPausedRef.current) {
      window.speechSynthesis.resume();
      isPausedRef.current = false;
      isSpeakingRef.current = true;
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    speakChunk(currentSpeechIndexRef.current);
  }

  function pauseReading() {
    if (!isSpeakingRef.current) return;
    window.speechSynthesis.pause();
    isPausedRef.current = true;
    setIsPaused(true);
  }

  function resumeReading() {
    window.speechSynthesis.resume();
    isPausedRef.current = false;
    isSpeakingRef.current = true;
    setIsPaused(false);
    setIsSpeaking(true);
  }

  function stopReading() {
    shouldStopSpeechRef.current = true;
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    isPausedRef.current = false;
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

  function getSupportedAudioMimeType() {
    if (!window.MediaRecorder?.isTypeSupported) return '';

    return (
      [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ''
    );
  }

  function getAudioFilename(mimeType) {
    if (mimeType.includes('mp4')) return 'command.mp4';
    if (mimeType.includes('ogg')) return 'command.ogg';
    return 'command.webm';
  }

  async function transcribeVoiceCommand(audioBlob, filename) {
    setVoiceControlMessage('Sprachbefehl wird ausgewertet...');

    try {
      const response = await fetch(`${apiUrl}/api/transcribe-voice-command`, {
        method: 'POST',
        headers: {
          'Content-Type': audioBlob.type || 'application/octet-stream',
          'X-Audio-Filename': filename,
        },
        body: audioBlob,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Transkription fehlgeschlagen.');
      }

      const transcript = data.transcript?.trim();

      if (!transcript) {
        setVoiceControlMessage('Kein Sprachbefehl erkannt. Bitte erneut versuchen.');
        return;
      }

      setVoiceControlMessage(`Erkannter Befehl: ${transcript}`);
      handleVoiceCommand(transcript);
    } catch (error) {
      console.log('Fehler beim Auswerten des Sprachbefehls:', error);
      setVoiceControlMessage(
        'Sprachbefehl konnte nicht ausgewertet werden. Bitte erneut versuchen.',
      );
    }
  }

  async function startVoiceCommandRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceControlMessage(
        'Sprachbefehle werden in diesem Browser nicht unterstützt.',
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        setIsRecordingVoiceCommand(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || mimeType || 'audio/webm',
        });

        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          setVoiceControlMessage('Keine Audiodaten erkannt. Bitte erneut versuchen.');
          return;
        }

        transcribeVoiceCommand(
          audioBlob,
          getAudioFilename(mediaRecorder.mimeType || mimeType),
        );
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingVoiceCommand(true);
      setVoiceControlMessage('Sprich jetzt deinen Befehl.');

      voiceCommandTimeoutRef.current = window.setTimeout(() => {
        stopVoiceCommandRecording();
      }, 5000);
    } catch (error) {
      console.log('Fehler beim Starten der Sprachaufnahme:', error);
      setVoiceControlMessage(
        'Mikrofon konnte nicht gestartet werden. Bitte Berechtigung prüfen.',
      );
    }
  }

  function stopVoiceCommandRecording({ transcribe = true } = {}) {
    if (voiceCommandTimeoutRef.current) {
      window.clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      setIsRecordingVoiceCommand(false);
      return;
    }

    if (!transcribe) {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
      };
      audioChunksRef.current = [];
    }

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (!transcribe) {
      mediaRecorderRef.current = null;
      setIsRecordingVoiceCommand(false);
    }
  }

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

      <div className="relative z-0 mb-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100 sm:h-48">
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
              className={`h-44 w-full rounded-md object-cover transition-opacity duration-300 sm:h-48 ${
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
        className={`mt-2 min-h-11 w-full rounded px-4 py-2 font-medium text-white transition-colors sm:w-auto ${
          regenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {regenerating ? 'Generiere Bild...' : 'Bild generieren'}
      </button>

      <h3 className="mt-3 break-words text-lg font-semibold leading-snug sm:text-xl">
        {recipe.title}
      </h3>

      {time && (
        <p className="text-sm text-gray-600 mt-1">
          ⏱ Zubereitungszeit: {time} Minuten
        </p>
      )}

      {recipe.portionen && (
        <p className="text-sm text-gray-600">Portionen: {recipe.portionen}</p>
      )}

      <div className="mt-3 rounded border bg-gray-50 p-3 sm:p-4">
        <label
          htmlFor={`read-mode-${recipe.title}`}
          className="block font-semibold mb-2">
          Vorlesen:
        </label>

        <select
          id={`read-mode-${recipe.title}`}
          value={readMode}
          onChange={(event) => setReadMode(event.target.value)}
          className="mb-3 min-h-11 w-full rounded border p-2 text-base">
          <option value="all">Alles vorlesen</option>
          <option value="ingredients">Zutaten und Hinweise vorlesen</option>
          <option value="warnings">
            Nur Allergene und fehlende Zutaten vorlesen
          </option>
          <option value="preparation">Nur Zubereitung vorlesen</option>
        </select>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <button
            type="button"
            onClick={() => jumpReading(-1)}
            title="Zurückspulen"
            aria-label="Zurückspulen"
            className="min-h-11 rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 sm:text-base">
            Zurück
          </button>

          <button
            type="button"
            onClick={startReading}
            title="Vorlesen starten"
            aria-label="Vorlesen starten"
            className="min-h-11 rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 sm:text-base">
            Start
          </button>

          <button
            type="button"
            onClick={pauseReading}
            title="Vorlesen pausieren"
            aria-label="Vorlesen pausieren"
            disabled={!isSpeaking || isPaused}
            className={`min-h-11 rounded px-3 py-2 text-sm text-white sm:text-base ${
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
            className={`min-h-11 rounded px-3 py-2 text-sm text-white sm:text-base ${
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
            className={`min-h-11 rounded px-3 py-2 text-sm text-white sm:text-base ${
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
          className="mt-2 min-h-11 w-full rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 sm:text-base">
          Vorspulen
        </button>

        <div className="mt-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={
              isRecordingVoiceCommand
                ? () => stopVoiceCommandRecording()
                : startVoiceCommandRecording
            }
            title={
              isRecordingVoiceCommand
                ? 'Sprachaufnahme stoppen'
                : 'Sprachbefehl aufnehmen'
            }
            aria-label={
              isRecordingVoiceCommand
                ? 'Sprachaufnahme stoppen'
                : 'Sprachbefehl aufnehmen'
            }
            className={`min-h-11 rounded px-3 py-2 text-sm text-white sm:text-base ${
              isRecordingVoiceCommand
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {isRecordingVoiceCommand
              ? 'Aufnahme stoppen'
              : 'Sprachbefehl aufnehmen'}
          </button>

          <p className="text-sm leading-relaxed text-gray-600" aria-live="polite">
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
      <ul className="mt-2 list-outside list-disc space-y-1 pl-5">
        {recipe.ingredients?.map((ingredient) => (
          <li className="break-words" key={ingredient}>
            {ingredient}
          </li>
        ))}
      </ul>

      {allergens.length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 rounded">
          <h4 className="font-bold text-red-700 mb-1">⚠️ Allergene</h4>
          <ul className="list-outside list-disc space-y-1 pl-5 text-red-700">
            {allergens.map((allergen) => (
              <li className="break-words" key={allergen}>
                <span className="font-semibold">{capitalize(allergen)}</span>
                {alternatives[allergen] &&
                  alternatives[allergen].length > 0 && (
                    <span className="block text-gray-700 sm:ml-2 sm:inline">
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
        <div className="mt-2 break-words text-sm text-red-500">
          Nicht verwendet: {missingIngredients.join(', ')}
        </div>
      )}

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
