import React, { useState } from 'react';

const flashcardsData = [
  {
    kanji: "日",
    hiragana: "ひ / にち",
    romaji: "hi / nichi",
    meaning: "Día / Sol / Japón",
    example: "日曜日 (Nichiyoubi) - Domingo"
  },
  {
    kanji: "本",
    hiragana: "ほん",
    romaji: "hon",
    meaning: "Libro / Origen / Raíz",
    example: "日本語 (Nihongo) - Idioma japonés"
  },
  {
    kanji: "人",
    hiragana: "ひと / じん",
    romaji: "hito / jin",
    meaning: "Persona / Gente",
    example: "日本人 (Nihonjin) - Persona japonesa"
  }
];

export default function Flashcard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcardsData[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (e) => {
    e.stopPropagation(); // Evita que se active la animación de voltear al hacer clic en el botón
    setIsFlipped(false);
    // Esperamos a que la tarjeta empiece a voltearse antes de cambiar el contenido
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcardsData.length);
    }, 200);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcardsData.length) % flashcardsData.length);
    }, 200);
  };

  const playAudio = (e) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.kanji);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.75;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full px-4 py-8 select-none">
      {/* Indicador de Progreso */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between items-center mb-2 text-sm text-slate-400 font-medium">
          <span>Progreso de estudio</span>
          <span>{currentIndex + 1} de {flashcardsData.length}</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / flashcardsData.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Contenedor 3D de la Tarjeta */}
      <div 
        id="flashcard-container"
        className="perspective-1000 w-full max-w-md h-96 cursor-pointer group relative"
        onClick={handleFlip}
      >
        {/* Glow de Fondo para Efecto Premium */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 opacity-20 group-hover:opacity-40 blur-xl transition-all duration-500 group-hover:scale-102" />
        
        {/* Tarjeta Principal */}
        <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ease-out shadow-2xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* CARA FRONTAL */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md flex flex-col items-center justify-between p-8 backface-hidden shadow-indigo-950/20 shadow-2xl">
            {/* Header de la tarjeta */}
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">
                Nivel N5
              </span>
              <button 
                id="play-audio-front-btn"
                onClick={playAudio}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-violet-600 hover:text-white border border-slate-700/60 text-slate-300 transition-all duration-300 transform active:scale-95"
                title="Escuchar pronunciación"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Kanji Central */}
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-8xl font-bold font-sans tracking-tight text-white mb-2 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                {currentCard.kanji}
              </h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">Kanji</p>
            </div>

            {/* Footer de la tarjeta */}
            <div className="flex flex-col items-center gap-1.5 animate-pulse">
              <span className="text-xs text-indigo-300 font-medium">Click para revelar lectura</span>
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>

          {/* CARA TRASERA */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-md flex flex-col items-center justify-between p-8 backface-hidden rotate-y-180 shadow-indigo-500/10 shadow-2xl">
            {/* Header de la tarjeta */}
            <div className="w-full flex justify-between items-center">
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                Respuesta
              </span>
              <button 
                id="play-audio-back-btn"
                onClick={playAudio}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-violet-600 hover:text-white border border-slate-700/60 text-slate-300 transition-all duration-300 transform active:scale-95"
                title="Escuchar pronunciación"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>

            {/* Contenido de la Respuesta */}
            <div className="flex flex-col items-center justify-center text-center w-full my-auto">
              <span className="text-sm text-indigo-400 font-medium tracking-wide mb-1">Lectura (Hiragana)</span>
              <h3 className="text-3xl font-semibold text-white mb-1 tracking-wider font-sans">
                {currentCard.hiragana}
              </h3>
              <p className="text-sm text-slate-400 italic mb-6">
                {currentCard.romaji}
              </p>
              
              <span className="text-sm text-violet-400 font-medium tracking-wide mb-1">Significado</span>
              <h4 className="text-2xl font-bold text-white mb-4">
                {currentCard.meaning}
              </h4>

              {/* Ejemplo de uso */}
              <div className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 max-w-xs mt-1">
                <span className="font-semibold text-slate-300 block mb-1">Ejemplo:</span>
                {currentCard.example}
              </div>
            </div>

            {/* Footer de la tarjeta */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-slate-500">Haz click para volver a ver el Kanji</span>
            </div>
          </div>

        </div>
      </div>

      {/* Controles de Navegación */}
      <div className="flex items-center gap-4 mt-10">
        <button 
          id="prev-card-btn"
          onClick={handlePrev}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all duration-300 shadow-lg hover:shadow-indigo-950/20 active:scale-95"
          title="Anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm font-semibold text-slate-300">
          {currentIndex + 1} / {flashcardsData.length}
        </span>

        <button 
          id="next-card-btn"
          onClick={handleNext}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all duration-300 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-500/20 active:scale-95 flex items-center gap-2 group"
          title="Siguiente Tarjeta"
        >
          <span>Siguiente</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
