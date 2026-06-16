export default function RecipeWarnings({
  allergens,
  alternatives,
  missingIngredients,
  onCapitalize,
}) {
  return (
    <>
      {allergens.length > 0 && (
        <div className="mt-4 rounded border-l-4 border-red-500 bg-red-100 p-3">
          <h4 className="mb-1 font-bold text-red-700">Allergene</h4>
          <ul className="list-outside list-disc space-y-1 pl-5 text-red-700">
            {allergens.map((allergen) => (
              <li className="break-words" key={allergen}>
                <span className="font-semibold">{onCapitalize(allergen)}</span>
                {alternatives[allergen]?.length > 0 && (
                  <span className="block text-gray-700 sm:ml-2 sm:inline">
                    Alternativen:{' '}
                    {alternatives[allergen].map(onCapitalize).join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingIngredients?.length > 0 && (
        <div className="mt-2 break-words text-sm text-red-600">
          Nicht verwendet: {missingIngredients.join(', ')}
        </div>
      )}
    </>
  );
}
