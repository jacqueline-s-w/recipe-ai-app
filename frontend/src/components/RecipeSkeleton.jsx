export default function RecipeSkeleton() {
  return (
    <article className="border rounded-lg p-4 shadow-md animate-pulse">
      <div className="w-full h-48 bg-gray-300 rounded-md mb-3"></div>

      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>

      <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-5/6 mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-4/6"></div>
    </article>
  );
}
