export default function TestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Test de Tailwind</h1>
      <div className="bg-primary p-4 rounded mb-4">
        Boîte avec couleur primaire personnalisée
      </div>
      <div className="bg-blue-500 text-white p-4 rounded">
        Boîte avec classe Tailwind directe
      </div>
    </div>
  );
} 