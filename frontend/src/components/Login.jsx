import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <motion.main
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Tape decoration */}

        <div className="paper-texture polaroid-shadow rounded-2xl px-8 py-10 relative z-10">

          {/* Icon & Title */}
          <div className="text-center mb-8">
            {/*<motion.div
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-3"
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '44px' }}>auto_stories</span>
            </motion.div>*/}
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-none mb-1">
              Golden Hour
            </h1>
            <p className="font-body-sm text-on-surface-variant mt-2 italic">
              Leave a memory. Stay forever.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest" htmlFor="usn">
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
            </div>

            <div className="pt-2">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-widest" htmlFor="photo">
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
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-primary flex-shrink-0">
                    <img src={photoData} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

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
              whileHover={!isLoading ? { y: -2, boxShadow: '0 8px 24px rgba(65,95,118,0.25)' } : {}}
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

          <p className="text-center font-body-sm text-on-surface-variant/60 mt-6 text-xs">
            A digital keepsake for the Class of 2025
          </p>
        </div>
      </motion.main>
    </div>
  );
}
