import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function JammingPhase() {
  const [lyrics, setLyrics] = useState('');

  useEffect(() => {
    fetch('/api/lyrics')
      .then(r => r.json())
      .then(data => setLyrics(data.text))
      .catch(() => setLyrics('Failed to load lyrics.'));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0a0a0a] flex flex-col items-center p-6 md:p-12 overflow-y-auto relative"
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="z-10 w-full max-w-5xl text-center flex flex-col gap-8 pb-32"
      >
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <span className="material-symbols-outlined text-6xl text-purple-400 animate-bounce">
            music_note
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 tracking-tight">
            Jamming Session
          </h1>
        </div>
        
        <div className="whitespace-pre-wrap text-2xl md:text-4xl lg:text-5xl font-semibold text-white/95 leading-[1.6] tracking-wide" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          {lyrics || 'Loading lyrics...'}
        </div>
      </motion.div>
    </motion.div>
  );
}
