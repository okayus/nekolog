/**
 * Root Application Component
 *
 * Entry point for the NekoLog React SPA.
 */

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">NekoLog</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <p>猫トイレ記録アプリ</p>
      </main>
    </div>
  );
}

export default App;
