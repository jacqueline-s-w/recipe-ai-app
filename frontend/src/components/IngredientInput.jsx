export default function IngredientInput() {
  const res =await fetch("http://localhost:8000/recipes",{
    method: "POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringyfy({ingredients}),
  });
  const data = await res.json();
  
  return (
    <div className="bg-white shadow p-4 rounded-xl">
      <input
        type="text"
        placeholder="Zutat eingeben..."
        className="border p-2 rounded w-full"
      />
      <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">
        Hinzufügen
      </button>

      {/*Liste */}
      <ul className="mt-4">{/*hier erscheinen später die Zutaten */}</ul>

      <button className="mt-6 bg-green-600 text-white px-4 py-2 rounded w-full">
        Rezepte finden
      </button>
    </div>
  );
}
