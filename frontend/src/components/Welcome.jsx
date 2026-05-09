import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTES = [
  { text: "Don't cry because it's over. Smile because it happened.", author: "Dr. Seuss" },
  { text: "How lucky I am to have something that makes saying goodbye so hard.", author: "A.A. Milne" },
  { text: "The magic thing about home is that it feels good to leave, and it feels even better to come back.", author: "Wendy Wunder" },
  { text: "Goodbyes are not forever, are not the end; it simply means I'll miss you until we meet again.", author: "Anonymous" },
  { text: "It's not the goodbye that hurts, but the flashbacks that follow.", author: "Anonymous" },
  { text: "You can't start the next chapter of your life if you keep re-reading the last one.", author: "Anonymous" },
  { text: "Great is the art of beginning, but greater is the art of ending.", author: "Henry Wadsworth Longfellow" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "What we call the beginning is often the end. And to make an end is to make a beginning.", author: "T.S. Eliot" },
  { text: "Every exit is an entry somewhere else.", author: "Tom Stoppard" },
];

function DustMotes() {
  const motes = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${60 + Math.random() * 40}%`,
    size: 2 + Math.random() * 3,
    duration: 14 + Math.random() * 12,
    delay: Math.random() * 10,
    opacity: 0.12 + Math.random() * 0.18,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {motes.map(m => (
        <div
          key={m.id}
          className="dust-mote"
          style={{
            left: m.left,
            top: m.top,
            width: `${m.size}px`,
            height: `${m.size}px`,
            '--duration': `${m.duration}s`,
            '--delay': `${m.delay}s`,
            opacity: m.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function Welcome({ name }) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  // Rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIndex(i => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[quoteIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Golden Hour atmospheric gradients */}
      <div className="absolute inset-0 golden-hour-bg pointer-events-none" />

      {/* Warm top-center glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(245,192,106,0.2) 0%, rgba(244,166,140,0.1) 35%, transparent 70%)',
        }}
      />

      {/* Deep rose bottom accent */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 100%, rgba(199,91,111,0.1) 0%, transparent 55%)',
        }}
      />

      {/* Ambient dust */}
      <DustMotes />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md text-center relative z-10"
      >

        {/* Animated icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '64px' }}>
            celebration
          </span>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-headline-xl text-headline-xl text-on-surface mb-2"
        >
          Welcome,
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-headline-lg text-headline-lg text-secondary italic mb-6"
        >
          {name?.split(' ')[0] || 'Friend'} 🎓
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="w-20 h-0.5 mx-auto mb-6 rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #D4A843, transparent)' }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="font-body-md text-on-surface-variant mb-10 leading-relaxed"
        >
          You can write messages to your friends anytime!<br />
          <span className="font-medium text-primary">Click the button below to get started.</span>
        </motion.p>

        {/* Quote card */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0.5 }}
          transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="paper-texture polaroid-shadow rounded-2xl p-8 relative mb-8"
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-surface-variant/70 rounded-sm shadow-sm rotate-1" />

          <AnimatePresence mode="wait">
            {visible && (
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="material-symbols-outlined text-secondary/30 text-5xl leading-none block mb-2">format_quote</span>
                <p className="font-quote text-quote text-on-surface leading-relaxed mb-4">
                  {quote.text}
                </p>
                <p className="editorial-label text-on-surface-variant">
                  — {quote.author}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quote dots indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setQuoteIndex(i); setVisible(true); }}
              className={`rounded-full transition-all duration-300 ${
                i === quoteIndex
                  ? 'w-5 h-1.5 bg-secondary'
                  : 'w-1.5 h-1.5 bg-outline-variant hover:bg-outline'
              }`}
            />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="font-body-sm text-xs text-on-surface-variant/50 mt-8"
        >
          This page will automatically open when the event begins.
        </motion.p>
      </motion.div>
    </div>
  );
}
