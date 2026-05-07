# 🎓 Aura of Remembrance

> A nostalgic, anonymous messaging platform built for college farewell events. Students write heartfelt memories to their peers — delivered silently, remembered forever.

**Stack**: React + Vite · Express.js · MongoDB · Docker

---

## 🚀 Quick Start

```bash
# 1. Start all services
docker-compose up --build -d

# 2. Populate the approved user list (run after every fresh start)
docker-compose exec backend node import-excel.js

# 3. Open the app
#    Students → http://localhost:5173/login
#    Admin    → http://localhost:5173/admin-login
```

---

## 🏗️ Project Structure

```
seniors/
├── backend/
│   ├── models/         # Mongoose schemas (User, Message)
│   ├── import-excel.js # Imports users from users.csv
│   ├── clear-db.js     # Wipes all users and messages
│   ├── server.js       # Express API
│   └── users.csv       # ✏️ Edit this with your real student list
├── frontend/
│   └── src/
│       ├── components/ # Login, Compose, AdminLogin, AdminDashboard
│       └── App.jsx     # Routing + auth state
└── docker-compose.yml
```

---

## 👤 Student Flow

1. Navigate to `http://<server-ip>:5173/login`
2. Enter your **USN** (must be in the approved list)
3. Write an anonymous message, choose a recipient from the list, pick a stamp
4. Click **Seal** — the message is delivered

---

## 🛡️ Admin Dashboard

| Detail | Value |
|--------|-------|
| URL | `http://localhost:5173/admin-login` |
| Default Password | `admin123` |
| Change password | Set `ADMIN_PASSWORD` env var in `docker-compose.yml` |

**Features:**
- View every message received by any student (including sender's USN)
- Search students by name or USN
- **Random Selector** — picks a random student's inbox (perfect for reading aloud at the event)
- Collapsible mobile-friendly sidebar

---

## 📋 Managing the Student List (`users.csv`)

The file is located at `backend/users.csv`. Open it in Excel — it has two columns:

| USN | Name |
|-----|------|
| 1DS20CS001 | Alice Smith |
| 1DS20CS002 | Bob Jones |

**You can add extra columns** (e.g., Branch, Section, Phone) — they are stored automatically in the database under `otherDetails`.

After editing the CSV, run:

```bash
docker-compose exec backend node import-excel.js
```

---

## 🗄️ Database Management

```bash
# Import / update users from CSV
docker-compose exec backend node import-excel.js

# Wipe ALL users and messages (⚠️ irreversible)
docker-compose exec backend node clear-db.js

# Stop all containers
docker-compose down

# Stop and delete database volume (full reset)
docker-compose down -v
```

---

## 🔒 Security Notes

- Authentication uses **HTTP-only cookies** (JWT). Tokens cannot be stolen via XSS.
- The sender's USN is **never** returned in public API responses — only via the password-protected admin endpoint.
- All non-whitelisted USNs are rejected at login.

---

## 🌐 Accessing From Other Devices (e.g., phones on same Wi-Fi)

Replace `localhost` with your machine's local IP address (e.g., `192.168.1.x`):

```
http://192.168.1.x:5173/login
```

To find your IP, run `ipconfig` (Windows) and look for "IPv4 Address".
