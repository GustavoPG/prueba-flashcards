import { useState, useEffect, useMemo, useRef } from 'react';
import { flashcardsData } from './data/kanji';

// Helper function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'numeros', name: 'Números' },
  { id: 'dinero', name: 'Dinero' },
  { id: 'tiempo', name: 'Tiempo' },
  { id: 'naturaleza', name: 'Naturaleza' },
  { id: 'cuerpo', name: 'Cuerpo' },
  { id: 'educacion', name: 'Educación' }
];

const levels = [
  { id: 'all', name: 'Todos' },
  { id: 'N5', name: 'JLPT N5' },
  { id: 'N4', name: 'JLPT N4' },
  { id: 'N3', name: 'JLPT N3' }
];

export default function Flashcard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('study'); // 'study' | 'quiz'

  // Study Mode State
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kanji_favorites')) || [];
    } catch {
      return [];
    }
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  // Canvas Drawing States & Refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Quiz Mode State
  const [quizModeType, setQuizModeType] = useState('meaning'); // 'meaning' | 'reading'
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    return parseInt(localStorage.getItem('kanji_best_streak') || '0', 10);
  });

  // Text-to-Speech Pronunciation Helper
  const playAudio = (e, text) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.75;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Drawing Canvas Helpers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#c084fc'; // neon purple-300
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.stopPropagation();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.stopPropagation();
    setIsDrawing(false);
  };

  const clearCanvas = (e) => {
    if (e) e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Clear drawing canvas when active card changes
  useEffect(() => {
    clearCanvas();
  }, [currentIndex]);

  // Favorite toggle helper
  const toggleFavorite = (e, kanji) => {
    if (e) e.stopPropagation();
    let updated;
    if (favorites.includes(kanji)) {
      updated = favorites.filter(k => k !== kanji);
    } else {
      updated = [...favorites, kanji];
    }
    setFavorites(updated);
    localStorage.setItem('kanji_favorites', JSON.stringify(updated));
  };

  // Calculate deck dynamically when filters or order changes
  const deck = useMemo(() => {
    let newDeck = [...flashcardsData];

    if (selectedLevel !== 'all') {
      newDeck = newDeck.filter(card => card.level === selectedLevel);
    }

    if (selectedCategory !== 'all') {
      newDeck = newDeck.filter(card => card.category === selectedCategory);
    }

    if (showOnlyFavorites) {
      newDeck = newDeck.filter(card => favorites.includes(card.kanji));
    }

    if (isShuffled) {
      newDeck = shuffleArray(newDeck);
    }

    return newDeck;
  }, [selectedLevel, selectedCategory, showOnlyFavorites, isShuffled, favorites]);

  // Reset index to 0 when filtered deck parameters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedLevel, selectedCategory, showOnlyFavorites, isShuffled]);

  // Autoplay Effect
  useEffect(() => {
    if (!autoPlay || deck.length === 0 || activeTab !== 'study') return;

    const interval = setInterval(() => {
      setIsFlipped(prev => {
        if (!prev) {
          return true; // Flip to back
        } else {
          // Move to next card, showing the front
          setCurrentIndex(prevIndex => (prevIndex + 1) % deck.length);
          return false;
        }
      });
    }, 3500); // Flipped state changes every 3.5 seconds

    return () => clearInterval(interval);
  }, [autoPlay, deck.length, activeTab]);

  const generateQuizQuestion = () => {
    if (flashcardsData.length < 4) return;

    // Use the active filtered deck if it has items, otherwise fall back to all kanjis
    const pool = deck.length > 0 ? deck : flashcardsData;

    // Pick correct answer from the pool
    const correctCard = pool[Math.floor(Math.random() * pool.length)];

    // Get 3 other unique cards as distractors from the full list
    const distractors = [];
    while (distractors.length < 3) {
      const randomCard = flashcardsData[Math.floor(Math.random() * flashcardsData.length)];
      if (randomCard.kanji !== correctCard.kanji && !distractors.some(d => d.kanji === randomCard.kanji)) {
        distractors.push(randomCard);
      }
    }

    setQuizQuestion(correctCard);
    setQuizOptions(shuffleArray([correctCard, ...distractors]));
    setSelectedAnswer(null);
    setHasAnswered(false);
  };

  // Quiz initialization and progress
  useEffect(() => {
    if (activeTab === 'quiz') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      generateQuizQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, quizModeType]);

  const handleQuizAnswer = (option) => {
    if (hasAnswered) return;
    setSelectedAnswer(option);
    setHasAnswered(true);

    const isCorrect = option.kanji === quizQuestion.kanji;
    playAudio(null, quizQuestion.kanji);

    if (isCorrect) {
      setStreak(prev => {
        const next = prev + 1;
        if (next > bestStreak) {
          setBestStreak(next);
          localStorage.setItem('kanji_best_streak', next.toString());
        }
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const currentCard = deck[currentIndex];


  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % deck.length);
    }, 200);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + deck.length) % deck.length);
    }, 200);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 select-none">
      
      {/* Pestañas de Navegación */}
      <div className="flex bg-slate-900/60 p-1 border border-slate-800/80 rounded-2xl mb-8 shadow-inner max-w-xs w-full">
        <button
          onClick={() => { setActiveTab('study'); setAutoPlay(false); }}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'study'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tarjetas
        </button>
        <button
          onClick={() => { setActiveTab('quiz'); setAutoPlay(false); }}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === 'quiz'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Modo Quiz
        </button>
      </div>

      {activeTab === 'study' ? (
        /* VISTA: TARJETAS DE ESTUDIO */
        <div className="w-full flex flex-col items-center">
          
          {/* Filtro de Nivel JLPT */}
          <div className="w-full max-w-md mb-4 flex flex-col items-start">
            <span className="text-[10px] text-slate-500 font-semibold mb-2 uppercase tracking-wider">Filtrar por Nivel JLPT</span>
            <div className="flex bg-slate-900/40 p-1 border border-slate-800/60 rounded-xl w-full">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                    selectedLevel === level.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categorías deslizantes */}
          <div className="w-full max-w-md mb-6 overflow-x-auto flex gap-2 pb-3 no-scrollbar scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Barra de Controles (Shuffle, Favorites, Autoplay) */}
          <div className="w-full max-w-md flex justify-between items-center bg-slate-950/40 border border-slate-900 rounded-2xl p-3 mb-6 gap-2">
            <div className="flex gap-2">
              {/* Botón de Shuffle */}
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  isShuffled
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
                title={isShuffled ? "Desactivar orden aleatorio" : "Activar orden aleatorio"}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              {/* Botón de filtrar Favoritos */}
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  showOnlyFavorites
                    ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
                title={showOnlyFavorites ? "Ver todos los Kanji" : "Ver solo mis favoritos"}
              >
                <svg className="w-4.5 h-4.5" fill={showOnlyFavorites ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              {/* Botón de activar Lienzo de Escritura */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowCanvas(!showCanvas); }}
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  showCanvas
                    ? 'bg-violet-600/20 border-violet-500/35 text-violet-300 shadow'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
                title={showCanvas ? "Ocultar lienzo de escritura" : "Mostrar lienzo de escritura"}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            {/* Botón de Autoplay */}
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-xl border font-semibold text-xs transition-all duration-300 ${
                autoPlay
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{autoPlay ? "Detener" : "Auto-Play"}</span>
              {autoPlay ? (
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {deck.length === 0 ? (
            /* Estado vacío: Sin tarjetas */
            <div className="w-full max-w-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-10 flex flex-col items-center justify-center text-center backdrop-blur-md">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-4 text-rose-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No hay Kanjis disponibles</h3>
              <p className="text-sm text-slate-400">
                {showOnlyFavorites 
                  ? "No has marcado ningún Kanji de esta categoría como favorito todavía. ¡Usa el ícono de corazón para guardarlos!"
                  : "No se encontraron Kanjis en esta selección."}
              </p>
              {showOnlyFavorites && (
                <button
                  onClick={() => setShowOnlyFavorites(false)}
                  className="mt-6 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/60 hover:bg-slate-700 hover:text-white transition-all duration-300"
                >
                  Ver todos los Kanjis
                </button>
              )}
            </div>
          ) : (
            /* Tarjeta Principal */
            <div className="w-full flex flex-col items-center">
              {/* Indicador de Progreso */}
              <div className="w-full max-w-md mb-6">
                <div className="flex justify-between items-center mb-2 text-sm text-slate-400 font-medium">
                  <span>Progreso de estudio</span>
                  <span>{currentIndex + 1} de {deck.length}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
                  />
                </div>
                {/* Línea de progreso de reproducción automática */}
                {autoPlay && (
                  <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden mt-3">
                    <div 
                      key={`${currentIndex}-${isFlipped}`}
                      className="h-full bg-indigo-500 animate-progress-bar"
                    />
                  </div>
                )}
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
                    <div className="w-full flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">
                          N5
                        </span>
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded-full border border-slate-700/50">
                          {categories.find(c => c.id === currentCard.category)?.name || currentCard.category}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {/* Favorito corazón */}
                        <button
                          onClick={(e) => toggleFavorite(e, currentCard.kanji)}
                          className={`p-2 rounded-xl border transition-all duration-300 transform active:scale-90 ${
                            favorites.includes(currentCard.kanji)
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                              : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-rose-400'
                          }`}
                          title="Marcar favorito"
                        >
                          <svg className="w-5 h-5" fill={favorites.includes(currentCard.kanji) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        {/* Audio */}
                        <button 
                          onClick={(e) => playAudio(e, currentCard.kanji)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-violet-600 hover:text-white border border-slate-700/60 text-slate-300 transition-all duration-300 transform active:scale-95"
                          title="Escuchar pronunciación"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                      </div>
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
                    <div className="w-full flex justify-between items-center">
                      <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                        Respuesta
                      </span>
                      <button 
                        onClick={(e) => playAudio(e, currentCard.kanji)}
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
                      <div className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 max-w-xs mt-1 text-left">
                        <span className="font-semibold text-slate-300 block mb-1">Ejemplo:</span>
                        {currentCard.example}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs text-slate-500">Haz click para volver a ver el Kanji</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Controles de Navegación */}
              <div className="flex items-center gap-4 mt-8">
                <button 
                  onClick={handlePrev}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all duration-300 shadow-lg hover:shadow-indigo-950/20 active:scale-95"
                  title="Anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="px-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-sm font-semibold text-slate-300">
                  {currentIndex + 1} / {deck.length}
                </span>

                <button 
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
              
              {/* LIENZO DE ESCRITURA */}
              {showCanvas && (
                <div 
                  className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 mt-6 flex flex-col items-center relative overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-350">Lienzo de Práctica</span>
                      <span className="text-[10px] text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/50">
                        Dibuja aquí
                      </span>
                    </div>
                    <button
                      onClick={clearCanvas}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-450 hover:text-white transition-all duration-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5"
                      title="Limpiar lienzo"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Limpiar</span>
                    </button>
                  </div>

                  {/* Rejilla de Fondo */}
                  <div className="relative border border-slate-850/80 bg-slate-950/80 rounded-xl overflow-hidden cursor-crosshair shadow-inner w-[280px] h-[280px]">
                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-800/50 -translate-x-1/2 pointer-events-none" />
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-800/50 -translate-y-1/2 pointer-events-none" />
                    
                    <canvas
                      ref={canvasRef}
                      width={280}
                      height={280}
                      className="absolute inset-0 z-10 w-full h-full bg-transparent"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  
                  <span className="text-[10px] text-slate-500 mt-3">
                    Práctica el trazo de **{currentCard.kanji}**
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* VISTA: MODO QUIZ (JUEGO DE PREGUNTAS) */
        <div className="w-full flex flex-col items-center max-w-md">
          
          {/* Doble Modo de Quiz Selector */}
          <div className="w-full flex justify-center items-center gap-2 mb-6 bg-slate-950/40 p-1 border border-slate-900 rounded-2xl max-w-xs">
            <button
              onClick={() => setQuizModeType('meaning')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                quizModeType === 'meaning'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Significados
            </button>
            <button
              onClick={() => setQuizModeType('reading')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                quizModeType === 'reading'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lecturas (Kana)
            </button>
          </div>

          {/* Marcador de Rachas (Streak) */}
          <div className="w-full flex justify-between items-center bg-slate-950/40 border border-slate-900 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div className="text-left">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Racha actual</span>
                <span className="text-lg font-bold text-orange-400">{streak} {streak === 1 ? 'acierto' : 'aciertos'}</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div className="text-left">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Récord</span>
                <span className="text-lg font-bold text-yellow-500">{bestStreak} {bestStreak === 1 ? 'acierto' : 'aciertos'}</span>
              </div>
            </div>
          </div>

          {quizQuestion && (
            <div className="w-full flex flex-col items-center">
              
              {/* Tarjeta de Pregunta */}
              <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-between min-h-[200px] mb-6 relative overflow-hidden">
                {/* Glow decorativo */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 opacity-5 blur-xl" />
                
                <div className="w-full flex justify-between items-center z-10">
                  <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">
                    {quizModeType === 'meaning' ? '¿Qué significa este Kanji?' : '¿Cómo se lee este Kanji?'}
                  </span>
                  <button 
                    onClick={(e) => playAudio(e, quizQuestion.kanji)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-violet-600 hover:text-white border border-slate-700/60 text-slate-300 transition-all duration-300 transform active:scale-95"
                    title="Escuchar pronunciación"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>

                <div className="my-6 z-10">
                  <h2 className="text-8xl font-black font-sans text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    {quizQuestion.kanji}
                  </h2>
                </div>

                {hasAnswered && (
                  <div className="text-center animate-fade-in z-10">
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                      {quizModeType === 'meaning' ? 'Lecturas' : 'Significado'}
                    </span>
                    <span className="text-sm font-semibold text-slate-300">
                      {quizModeType === 'meaning' 
                        ? `${quizQuestion.hiragana} (${quizQuestion.romaji})`
                        : quizQuestion.meaning}
                    </span>
                  </div>
                )}
              </div>

              {/* Opciones de respuesta */}
              <div className="w-full grid grid-cols-1 gap-3 mb-6">
                {quizOptions.map((option, index) => {
                  const isCorrect = option.kanji === quizQuestion.kanji;
                  const isSelected = selectedAnswer?.kanji === option.kanji;
                  
                  let buttonStyle = "bg-slate-900/60 border-slate-800/60 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800/40";
                  
                  if (hasAnswered) {
                    if (isCorrect) {
                      buttonStyle = "bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold";
                    } else if (isSelected) {
                      buttonStyle = "bg-rose-500/10 border-rose-500/60 text-rose-400 line-through";
                    } else {
                      buttonStyle = "bg-slate-950/20 border-slate-900/40 text-slate-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={hasAnswered}
                      className={`w-full py-3.5 px-5 rounded-2xl border text-left text-sm font-medium transition-all duration-300 flex items-center justify-between transform active:scale-99 ${buttonStyle}`}
                    >
                      <span>{quizModeType === 'meaning' ? option.meaning : option.hiragana}</span>
                      {hasAnswered && isCorrect && (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Botón de Siguiente Pregunta */}
              {hasAnswered && (
                <button
                  onClick={generateQuizQuestion}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all duration-300 shadow-lg shadow-indigo-950/40 hover:shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <span>Siguiente Pregunta</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

