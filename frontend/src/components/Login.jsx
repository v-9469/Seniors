import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function DustMotes() {
  const motes = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${60 + Math.random() * 40}%`,
    size: 2 + Math.random() * 3,
    duration: 14 + Math.random() * 12,
    delay: Math.random() * 10,
    opacity: 0.15 + Math.random() * 0.2,
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

export default function Login({ setAuth }) {
  const [usn, setUsn] = useState('');
  const [photoData, setPhotoData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to jpeg to save space
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoData(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usn.trim()) return;
    setErrorMsg('');
    setIsLoading(true);

    try {
      const apiUrl = '';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usn: usn.trim(), photoBase64: photoData })
      });

      if (response.ok) {
        localStorage.setItem('usn', usn.trim());
        setAuth(true);
        navigate('/compose');
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'Authentication failed');
      }
    } catch {
      setErrorMsg('Cannot reach the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center relative overflow-hidden px-4">

      {/* Golden Hour atmospheric gradients */}
      <div className="absolute inset-0 golden-hour-bg pointer-events-none" />

      {/* Warm radial light from top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(245,192,106,0.18) 0%, rgba(244,166,140,0.1) 40%, transparent 70%)',
        }}
      />

      {/* Deep rose bottom glow */}
      <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 100%, rgba(199,91,111,0.1) 0%, transparent 60%)',
        }}
      />

      {/* Ambient dust motes */}
      <DustMotes />

      <motion.main
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="paper-texture polaroid-shadow rounded-2xl px-8 py-10 relative z-10">

          {/* Icon & Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none mb-1"
                style={{ color: '#2C2A28' }}>
                Golden Hour
              </h1>
              <div className="w-16 h-0.5 mx-auto mt-3 mb-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #D4A843, transparent)' }} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-body-sm text-on-surface-variant mt-2 italic"
            >
              Leave a memory. Stay forever.
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <label className="editorial-label text-on-surface-variant block mb-3" htmlFor="usn">
                Your USN
              </label>
              <div className="relative">
                <input
                  id="usn"
                  name="usn"
                  type="text"
                  required
                  placeholder="e.g. 1DS20CS001"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                  className="input-field pr-12"
                  autoComplete="off"
                  autoCapitalize="characters"
                  disabled={isLoading}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant text-xl pointer-events-none">badge</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pt-2"
            >
              <label className="editorial-label text-on-surface-variant block mb-3" htmlFor="photo">
                Optional: Add your photo
              </label>
              <div className="relative flex items-center gap-3">
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <label 
                  htmlFor="photo" 
                  className="cursor-pointer bg-surface border border-outline-variant px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors text-on-surface flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">{photoData ? 'image' : 'add_a_photo'}</span>
                  {photoData ? 'Change Photo' : 'Choose Photo'}
                </label>
                {photoData && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0"
                  >
                    <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-error text-sm bg-error/5 px-3 py-2 rounded-lg border border-error/20"
                >
                  <span className="material-symbols-outlined text-base">error</span>
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { y: -2, boxShadow: '0 8px 28px rgba(179,90,40,0.3)' } : {}}
              whileTap={!isLoading ? { scale: 0.97 } : {}}
              className="btn-primary w-full mt-2 tracking-widest uppercase"
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="material-symbols-outlined text-xl"
                >
                  progress_activity
                </motion.span>
              ) : (
                <>
                  Begin
                  <span className="material-symbols-outlined text-xl">east</span>
                </>
              )}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="text-center font-body-sm text-on-surface-variant/60 mt-6 text-xs"
          >
            A digital keepsake for the Class of 2026
          </motion.p>
        </div>
      </motion.main>
    </div>
  );
}
