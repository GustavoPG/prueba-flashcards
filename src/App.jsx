import Flashcard from './Flashcard'

function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-lg">
              日
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">Kanji Cards</h1>
              <p className="text-[10px] text-slate-400">Aprende japonés interactivamente</p>
            </div>
          </div>
          
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-10 max-w-4xl mx-auto w-full">
        <div className="w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-semibold mb-6 uppercase tracking-wider">
            ⭐ Tarjetas de Aprendizaje 3D
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Domina el Kanji Japonés
          </h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm md:text-base">
            Practica de manera visual e interactiva. Haz clic en la tarjeta para revelar la lectura en hiragana y la traducción en español.
          </p>

          <Flashcard />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/50 bg-slate-950/20 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} Kanji Cards. Creado con React y Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
