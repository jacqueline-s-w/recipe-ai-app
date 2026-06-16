import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import RecipeImage from './RecipeImage';
import RecipeSpeechControls from './RecipeSpeechControls';
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

function normalizeCommand(command) {
  return command
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:]/g, '')
    .trim();
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
  const [voiceControlEnabled, setVoiceControlEnabled] = useState(false);
  const [isRecordingVoiceCommand, setIsRecordingVoiceCommand] = useState(false);
  const [voiceControlMessage, setVoiceControlMessage] = useState('');

  const utteranceRef = useRef(null);
  const speechChunksRef = useRef([]);
  const currentSpeechIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldStopSpeechRef = useRef(false);
  const voiceControlEnabledRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceCommandTimeoutRef = useRef(null);
  const voiceRestartTimeoutRef = useRef(null);

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
  }, [speechChunks]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    voiceControlEnabledRef.current = voiceControlEnabled;
  }, [voiceControlEnabled]);

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
    const normalizedCommand = normalizeCommand(command);

    if (isPausedRef.current) {
      if (
        normalizedCommand === 'weiter' ||
        normalizedCommand.includes('weiterlesen') ||
        normalizedCommand.includes('fortsetzen') ||
        normalizedCommand.includes('fortfahren')
      ) {
        resumeReading();
        return true;
      }

      if (
        normalizedCommand.includes('stopp') ||
        normalizedCommand.includes('stop') ||
        normalizedCommand.includes('beenden')
      ) {
        stopReading();
        return true;
      }

      setVoiceControlMessage(
        'Pausiert. Sag weiter, um das Vorlesen fortzusetzen.',
      );
      return false;
    }

    if (
      normalizedCommand.includes('vorlesen') ||
      normalizedCommand.includes('start') ||
      normalizedCommand.includes('lesen')
    ) {
      startReading();
      return true;
    }

    if (
      normalizedCommand.includes('pause') ||
      normalizedCommand.includes('pausieren') ||
      normalizedCommand.includes('anhalten')
    ) {
      pauseReading();
      return true;
    }

    if (
      normalizedCommand === 'weiter' ||
      normalizedCommand.includes('weiterlesen') ||
      normalizedCommand.includes('fortsetzen') ||
      normalizedCommand.includes('fortfahren')
    ) {
      resumeReading();
      return true;
    }

    if (
      normalizedCommand.includes('stopp') ||
      normalizedCommand.includes('stop') ||
      normalizedCommand.includes('beenden')
    ) {
      stopReading();
      return true;
    }

    if (
      normalizedCommand.includes('zuruck') ||
      normalizedCommand.includes('vorherig')
    ) {
      jumpReading(-1);
      return true;
    }

    if (
      normalizedCommand.includes('vorspulen') ||
      normalizedCommand.includes('weiter springen') ||
      normalizedCommand.includes('nachster') ||
      normalizedCommand.includes('naechster') ||
      normalizedCommand === 'vor'
    ) {
      jumpReading(1);
      return true;
    }

    setVoiceControlMessage(
      'Befehl nicht erkannt. Möglich sind: vorlesen, pause, weiterlesen, stopp, zurück, vor.',
    );
    return false;
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

  function scheduleNextVoiceCommand() {
    if (!voiceControlEnabledRef.current) return;

    if (voiceRestartTimeoutRef.current) {
      window.clearTimeout(voiceRestartTimeoutRef.current);
    }

    voiceRestartTimeoutRef.current = window.setTimeout(() => {
      voiceRestartTimeoutRef.current = null;
      startVoiceCommandRecording();
    }, 300);
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
        setVoiceControlMessage('Kein Sprachbefehl erkannt. Ich höre weiter zu.');
        scheduleNextVoiceCommand();
        return;
      }

      const commandWasHandled = handleVoiceCommand(transcript);
      setVoiceControlMessage(
        commandWasHandled
          ? `Erkannter Befehl: ${transcript}`
          : `Nicht erkannt: ${transcript}`,
      );
    } catch (error) {
      console.log('Fehler beim Auswerten des Sprachbefehls:', error);
      setVoiceControlMessage(
        'Sprachbefehl konnte nicht ausgewertet werden. Ich höre weiter zu.',
      );
    } finally {
      scheduleNextVoiceCommand();
    }
  }

  async function startVoiceCommandRecording() {
    if (!voiceControlEnabledRef.current || mediaRecorderRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceControlMessage(
        'Sprachbefehle werden in diesem Browser nicht unterstützt.',
      );
      stopVoiceControl();
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

        if (!voiceControlEnabledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || mimeType || 'audio/webm',
        });

        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          setVoiceControlMessage('Keine Audiodaten erkannt. Ich höre weiter zu.');
          scheduleNextVoiceCommand();
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
      setVoiceControlMessage('Sprachbefehle bleiben aktiv. Sprich jetzt.');

      voiceCommandTimeoutRef.current = window.setTimeout(() => {
        stopVoiceCommandRecording();
      }, 3500);
    } catch (error) {
      console.log('Fehler beim Starten der Sprachaufnahme:', error);
      setVoiceControlMessage(
        'Mikrofon konnte nicht gestartet werden. Bitte Berechtigung prüfen.',
      );
      stopVoiceControl();
    }
  }

  function stopVoiceCommandRecording() {
    if (voiceCommandTimeoutRef.current) {
      window.clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      setIsRecordingVoiceCommand(false);
      return;
    }

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  }

  function startVoiceControl() {
    voiceControlEnabledRef.current = true;
    setVoiceControlEnabled(true);
    setVoiceControlMessage(
      'Sprachbefehle aktiv. Sag: vorlesen, pause, weiterlesen, stopp, zurück oder vor.',
    );
    startVoiceCommandRecording();
  }

  function stopVoiceControl() {
    voiceControlEnabledRef.current = false;
    setVoiceControlEnabled(false);

    if (voiceRestartTimeoutRef.current) {
      window.clearTimeout(voiceRestartTimeoutRef.current);
      voiceRestartTimeoutRef.current = null;
    }

    stopVoiceCommandRecording();
    audioChunksRef.current = [];
    setIsRecordingVoiceCommand(false);
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

      <RecipeSpeechControls
        currentSpeechIndex={currentSpeechIndex}
        isPaused={isPaused}
        isRecordingVoiceCommand={isRecordingVoiceCommand}
        isSpeaking={isSpeaking}
        onJumpReading={jumpReading}
        onPauseReading={pauseReading}
        onReadModeChange={setReadMode}
        onResumeReading={resumeReading}
        onStartReading={startReading}
        onStopReading={stopReading}
        onToggleVoiceControl={
          voiceControlEnabled ? stopVoiceControl : startVoiceControl
        }
        readMode={readMode}
        readModeId={`read-mode-${recipe.title}`}
        speechChunkCount={speechChunks.length}
        voiceControlEnabled={voiceControlEnabled}
        voiceControlMessage={voiceControlMessage}
      />

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


