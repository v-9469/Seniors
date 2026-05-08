const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Settings = require('./models/Settings');
const Word = require('./models/Word');

const app = express();
const PORT = process.env.PORT || 12000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ── Security & Performance Middleware ──────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));           // Reject huge bodies
app.use(cookieParser());

// (Rate limits removed to avoid needing npm install on user machine)

// ── MongoDB Connection (pool sized for 100 users) ──────────────────────────
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/seniors',
  {
    maxPoolSize: 50,          // Up to 50 simultaneous DB operations
    minPoolSize: 5,           // Keep 5 connections warm at idle
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
)
  .then(async () => {
    console.log('MongoDB connected');
    // Ensure default settings exist
    await Settings.findOneAndUpdate(
      { key: 'phase' },
      { $setOnInsert: { key: 'phase', value: 'welcome' } },
      { upsert: true, new: true }
    );
  })
  .catch(err => console.error('MongoDB error:', err));

// ── In-Memory Settings Cache ───────────────────────────────────────────────
// 100 users polling /api/settings every 10s = 10 req/s.
// Cache result for 5 seconds to collapse those into rare DB reads.
let settingsCache = { phase: 'welcome', expiresAt: 0 };

async function getSettingsCached() {
  if (Date.now() < settingsCache.expiresAt) return settingsCache;
  const setting = await Settings.findOne({ key: 'phase' });
  settingsCache = {
    phase: setting ? setting.value : 'welcome',
    expiresAt: Date.now() + 5000
  };
  return settingsCache;
}

function invalidateSettingsCache() {
  settingsCache.expiresAt = 0;
}

// ── Auth Middleware ────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Admin Login ────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ id: 'admin', usn: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.json({ message: 'Admin login successful' });
});

// ── Student Login ──────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { usn, photoBase64 } = req.body;
  if (!usn) return res.status(400).json({ error: 'USN is required' });

  try {
    const user = await User.findOne({ usn: usn.toUpperCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'USN not found in the approved list. Please contact administration.' });
    }

    // Mark as arrived if this is their first login
    const alreadyArrived = !!user.arrivedAt;
    let newArrivedAt = user.arrivedAt;

    let userUpdated = false;
    if (photoBase64) {
      user.photo = photoBase64;
      userUpdated = true;
    }

    if (!alreadyArrived) {
      newArrivedAt = new Date();
      user.arrivedAt = newArrivedAt;
      userUpdated = true;
    }

    if (userUpdated) {
      await user.save();
    }

    if (!alreadyArrived) {
      broadcastSSE({
        type: 'arrival',
        userId: user._id,
        name: user.name || user.usn,
        usn: user.usn,
        photo: user.photo,
        arrivedAt: newArrivedAt
      });
    }

    // Record last login & device info (non-blocking — don't await)
    User.findByIdAndUpdate(user._id, {
      deviceDetails: {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        lastLogin: new Date()
      }
    }).catch(() => { });

    const token = jwt.sign({ id: user._id, usn: user.usn }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ message: 'Login successful', usn: user.usn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Logout ─────────────────────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// ── Public: Settings (cached) ──────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const cached = await getSettingsCached();
    res.json({ phase: cached.phase });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: Toggle Phase ────────────────────────────────────────────────────
app.post('/api/admin/settings/phase', requireAdmin, async (req, res) => {
  try {
    const { phase } = req.body;
    await Settings.findOneAndUpdate(
      { key: 'phase' },
      { value: phase },
      { upsert: true }
    );
    invalidateSettingsCache(); // Flush cache immediately
    res.json({ phase });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Words (Phase 1) ────────────────────────────────────────────────────────
app.post('/api/words', authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Word cannot be empty' });
  if (text.length > 50) return res.status(400).json({ error: 'Word too long' });

  try {
    const cached = await getSettingsCached();
    if (cached.phase !== 'wordcloud') {
      return res.status(403).json({ error: 'Word cloud phase is not active.' });
    }

    const newWord = new Word({
      text: text.trim(),
      senderUsn: req.user.usn
    });
    await newWord.save();

    broadcastSSE({
      type: 'word',
      text: newWord.text,
      id: newWord._id
    });

    res.status(201).json({ message: 'Word submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/words', async (req, res) => {
  try {
    const words = await Word.find({}).sort({ createdAt: -1 }).limit(300);
    res.json(words);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Send Message ───────────────────────────────────────────────────────────
app.post('/api/messages', authenticate, async (req, res) => {
  const { recipientId, content, stamp, isAnonymous } = req.body;
  if (!recipientId || !content) {
    return res.status(400).json({ error: 'Recipient and content are required' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
  }

  try {
    const cached = await getSettingsCached();
    if (cached.phase !== 'messaging') {
      return res.status(403).json({ error: 'Messaging is not open yet.' });
    }

    const newMessage = new Message({
      recipient: recipientId,
      content,
      stamp: stamp || 'favorite',
      senderUsn: req.user.usn,
      isAnonymous: !!isAnonymous
    });
    await newMessage.save();

    // Fetch recipient for the broadcast
    const recipientUser = await User.findById(recipientId).select('name usn').lean();
    if (recipientUser) {
      broadcastSSE({
        type: 'message_sent',
        recipientName: recipientUser.name || recipientUser.usn
      });
    }

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get Messages (public, no senderUsn) ───────────────────────────────────
app.get('/api/messages/:recipientId', async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.params.recipientId })
      .sort({ createdAt: -1 })
      .limit(200);   // Safety cap
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get All Users (for recipient list) ────────────────────────────────────
app.get('/api/seniors', async (req, res) => {
  try {
    const users = await User.find({}).select('name usn _id').lean();
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE / QR CHECK-IN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// SSE client store — broadcast arrivals to all connected admin dashboards
const sseClients = new Set();

function broadcastSSE(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch { sseClients.delete(client); }
  }
}

// Public SSE stream — no auth so EventSource works without cookie complexity
app.get('/api/attendance/stream', (req, res) => {
  // Explicit CORS for SSE since EventSource is picky
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send a heartbeat every 20s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
  }, 20000);

  sseClients.add(res);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Public QR scan endpoint — called when student scans their QR code
// Returns a self-contained HTML page (works directly in any mobile browser)
app.get('/api/scan/:token', async (req, res) => {
  try {
    const user = await User.findOne({ scanToken: req.params.token });
    if (!user) {
      return res.status(404).send(scanHtml('Invalid QR Code', 'This QR code is not valid.', false));
    }

    const alreadyArrived = !!user.arrivedAt;
    if (!alreadyArrived) {
      user.arrivedAt = new Date();
      await user.save();
      broadcastSSE({
        type: 'arrival',
        userId: user._id,
        name: user.name || user.usn,
        usn: user.usn,
        arrivedAt: user.arrivedAt
      });
    }

    const msg = alreadyArrived
      ? `Welcome back, ${user.name || user.usn}! You already checked in.`
      : `You're in! Welcome to the farewell, ${user.name || user.usn}! 🎉`;

    res.send(scanHtml(user.name || user.usn, msg, true, alreadyArrived));
  } catch {
    res.status(500).send(scanHtml('Error', 'Something went wrong. Please try again.', false));
  }
});

function scanHtml(name, message, success, duplicate = false) {
  const color = success ? (duplicate ? '#415f76' : '#16a34a') : '#ba1a1a';
  const icon = success ? (duplicate ? '👋' : '🎉') : '❌';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Golden Hour — Check In</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#fff8f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.card{background:#fff;border-radius:20px;padding:40px 32px;text-align:center;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.1)}.icon{font-size:64px;margin-bottom:20px}.name{font-size:26px;font-weight:700;color:#1e1b19;margin-bottom:8px}.msg{font-size:16px;color:#42474c;line-height:1.6}.badge{display:inline-block;margin-top:20px;background:${color};color:#fff;padding:8px 20px;border-radius:999px;font-size:14px;font-weight:600}</style>
  </head><body><div class="card">
  <div class="icon">${icon}</div>
  <div class="name">${name}</div>
  <div class="msg">${message}</div>
  <div class="badge">${success ? (duplicate ? 'Already Checked In' : 'Checked In ✓') : 'Error'}</div>
  </div></body></html>`;
}

// Admin: get all students with attendance status
app.get('/api/admin/attendance', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('name usn _id arrivedAt scanToken photo').lean();
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: reset a student's check-in (for testing)
app.delete('/api/admin/attendance/:userId', requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { arrivedAt: null });
    res.json({ message: 'Check-in reset' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: Bulk — all messages for all students ────────────────────────────
// IMPORTANT: This route must be defined BEFORE /:recipientId to avoid Express
// matching "all" as a recipientId param.
app.get('/api/admin/messages/all', requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find({})
      .select('+senderUsn')
      .sort({ recipient: 1, createdAt: -1 })
      .lean();
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: Get Messages with senderUsn for one student ────────────────────
app.get('/api/admin/messages/:recipientId', requireAdmin, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.params.recipientId })
      .select('+senderUsn')
      .sort({ createdAt: -1 })
      .lean();
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get Current User Profile ───────────────────────────────────────────────
app.get('/api/me', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ name: 'Admin', usn: 'admin', role: 'admin' });
    }
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
