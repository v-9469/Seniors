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

      {/* Ambient background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/6 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center"
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
        <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">
          Welcome,
        </h1>
        <h2 className="font-headline-lg text-headline-lg text-secondary italic mb-6">
          {name?.split(' ')[0] || 'Friend'} 🎓
        </h2>

        <p className="font-body-md text-on-surface-variant mb-10 leading-relaxed">
          The farewell message board is not open yet.<br />
          <span className="font-medium text-primary">Sit tight — it starts very soon!</span>
        </p>

        {/* Quote card */}
        <div className="paper-texture polaroid-shadow rounded-2xl p-8 relative mb-8">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-surface-variant/70 rounded-sm shadow-sm rotate-1" />

          <AnimatePresence mode="wait">
            {visible && (
              <motion.div
                key={quoteIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45 }}
              >
                <span className="material-symbols-outlined text-secondary/30 text-5xl leading-none block mb-2">format_quote</span>
                <p className="font-quote text-quote text-on-surface leading-relaxed mb-4">
                  {quote.text}
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                  — {quote.author}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

        <p className="font-body-sm text-xs text-on-surface-variant/50 mt-8">
          This page will automatically open when the event begins.
        </p>
      </motion.div>
    </div>
  );
}
