import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WordCloudPhase({ name }) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const apiUrl = `http://${window.location.hostname}:12000`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        setInputValue('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit word');
      }
    } catch (err) {
      alert('Error submitting word');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      
      {/* Background blobs for aesthetics */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Header title */}
      <div className="text-center z-10 pointer-events-none mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-headline-lg text-4xl md:text-5xl text-on-surface mb-3 font-bold tracking-tight drop-shadow-sm"
        >
          What did Engineering feel like?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-body-lg text-on-surface-variant max-w-lg mx-auto"
        >
          Type a word or short phrase to add it to the live cloud on the main screen.
        </motion.p>
      </div>

      {/* Input section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-md relative z-20"
      >
        <div className="paper-texture p-6 rounded-3xl shadow-xl border border-surface-variant/50 backdrop-blur-md bg-surface/80">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="e.g. Sleepless nights, Maggi, Friends..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={50}
              required
              autoComplete="off"
              className="w-full px-5 py-4 rounded-xl bg-surface border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-lg text-on-surface shadow-inner"
            />
            
            <button
              type="submit"
              disabled={isSubmitting || !inputValue.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-xl font-label-lg font-bold shadow-md hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined">send</span>
              {isSubmitting ? 'Adding...' : 'Send to Cloud'}
            </button>
            
            <AnimatePresence>
              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-green-600 font-medium text-sm mt-2"
                >
                  Added to the cloud! ✨
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>

    </div>
  );
}
