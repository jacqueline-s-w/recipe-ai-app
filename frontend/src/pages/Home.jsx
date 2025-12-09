import IngredientInput from '../components/IngredientInput';

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">AI Recipe Finder 🔍🍽️</h1>
      <div className="max-w-xl mx-auto">
        <IngredientInput />
      </div>
    </div>
  );
}
