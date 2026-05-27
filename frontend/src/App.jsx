import Home from './pages/Home';

function App() {
  return (
    <>
      {/* Skip-Link für Screenreader & Tastatur */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-600 text-white px-4 py-2 rounded">
        Zum Inhalt springen
      </a>

      {/* Hauptinhalt */}
      <div id="main">
        <Home />
      </div>
    </>
  );
}

export default App;
