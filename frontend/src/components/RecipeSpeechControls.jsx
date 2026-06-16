export default function RecipeSpeechControls({
  currentSpeechIndex,
  isPaused,
  isRecordingVoiceCommand,
  isSpeaking,
  onJumpReading,
  onPauseReading,
  onReadModeChange,
  onResumeReading,
  onStartReading,
  onStopReading,
  onToggleVoiceControl,
  readMode,
  readModeId,
  speechChunkCount,
  voiceControlEnabled,
  voiceControlMessage,
}) {
  return (
    <div className="mt-3 rounded border bg-gray-50 p-3 sm:p-4">
      <label htmlFor={readModeId} className="mb-2 block font-semibold">
        Vorlesen:
      </label>

      <select
        id={readModeId}
        value={readMode}
        onChange={(event) => onReadModeChange(event.target.value)}
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
          onClick={() => onJumpReading(-1)}
          title="Zurückspulen"
          aria-label="Zurückspulen"
          className="min-h-11 rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 sm:text-base">
          Zurück
        </button>

        <button
          type="button"
          onClick={onStartReading}
          title="Vorlesen starten"
          aria-label="Vorlesen starten"
          className="min-h-11 rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 sm:text-base">
          Start
        </button>

        <button
          type="button"
          onClick={onPauseReading}
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
          onClick={onResumeReading}
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
          onClick={onStopReading}
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
        onClick={() => onJumpReading(1)}
        title="Vorspulen"
        aria-label="Vorspulen"
        className="mt-2 min-h-11 w-full rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 sm:text-base">
        Vorspulen
      </button>

      <div className="mt-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onToggleVoiceControl}
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
          className={`min-h-11 rounded px-3 py-2 text-sm text-white sm:text-base ${
            voiceControlEnabled
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}>
          {voiceControlEnabled
            ? isRecordingVoiceCommand
              ? 'Hört zu...'
              : 'Sprachbefehle ausschalten'
            : 'Sprachbefehle an'}
        </button>

        <p className="text-sm leading-relaxed text-gray-600">
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
          Abschnitt {currentSpeechIndex + 1} von {speechChunkCount}
          {isPaused ? ' pausiert' : ' wird vorgelesen'}
        </p>
      )}
    </div>
  );
}
