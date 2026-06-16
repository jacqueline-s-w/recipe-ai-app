export default function RecipeImage({
  imageUrl,
  imageLoaded,
  imageFailed,
  regenerating,
  recipeTitle,
  onImageLoad,
  onImageError,
  onRegenerateImage,
}) {
  return (
    <>
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
              alt={`Rezeptbild: ${recipeTitle}`}
              onLoad={onImageLoad}
              onError={onImageError}
              className={`h-44 w-full rounded-md object-cover transition-opacity duration-300 sm:h-48 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="px-4 text-center text-sm text-gray-600">
            Für dieses KI-Rezept wurde noch kein Bild generiert.
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Bild für dieses Rezept neu generieren"
        title="Bild für dieses Rezept neu generieren"
        onClick={onRegenerateImage}
        disabled={regenerating}
        className={`mt-2 min-h-11 w-full rounded px-4 py-2 font-medium text-white transition-colors sm:w-auto ${
          regenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
        {regenerating ? 'Generiere Bild...' : 'Bild generieren'}
      </button>
    </>
  );
}
