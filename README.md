# ⚡ ChatApp — Full-Stack Real-Time Chat

A production-grade chat application built with **React + Node.js + Firebase**.

## ✨ Features

### Core
- 🔐 Firebase Auth (Email/Password + Google OAuth)
- 💬 Real-time messaging via Firestore + Socket.io
- 🏠 Public & private channels with invite codes
- 📩 Direct Messages (1-on-1)
- 🟢 Live presence (online/away/busy/offline)
- ⌨️ Real-time typing indicators
- ✅ Read receipts

### Messages
- 📎 File/image/audio/video sharing (Firebase Storage)
- ↩ Reply-to threading
- ✏️ Edit & soft-delete
- 😄 Emoji reactions (toggle)
- 📌 Pin messages
- ↪ Forward messages
- 🔖 Bookmark messages
- 🔍 Full-text message search
- @mention highlighting

### Advanced
- 📞 WebRTC video/audio calling
- 🖥️ Screen sharing
- 🔔 Push notifications (FCM)
- 📧 Email notifications for mentions
- 🛡️ Profanity filter
- 🚦 Rate limiting & helmet security
- 👮 Room moderation (kick/ban/mute)
- 🌙 Dark theme

---

## 🗂️ Project Structure

```
chat-app/
├── client/               # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom hooks
│       ├── store/        # Zustand stores
│       ├── context/      # Socket context
│       ├── firebase/     # Firebase config
│       └── utils/        # API helper
├── server/               # Node.js backend
│   ├── routes/           # REST API routes
│   ├── middleware/       # Auth middleware
│   ├── services/         # Firebase admin, notifications
│   └── socket/           # Socket.io handlers
└── firestore.rules       # Firestore security rules
```

---

## 🚀 Setup

### 1. Firebase Project Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password + Google)
4. Create a **Firestore Database** (start in test mode)
5. Enable **Storage**
6. Enable **Cloud Messaging** (for push notifications)
7. Go to Project Settings → Service Accounts → Generate new private key (for server)
8. Go to Project Settings → Your Apps → Add Web App (for client)

### 2. Clone & Install

```bash
git clone <repo>
cd chat-app
npm run install:all
```

### 3. Configure Environment Variables

**Server** — copy `server/.env.example` to `server/.env` and fill in:
- Firebase Admin SDK credentials (from service account JSON)
- Gmail credentials for email notifications

**Client** — copy `client/.env.example` to `client/.env` and fill in:
- Firebase Web App config (from Firebase Console)
- VAPID key (from Firebase Console → Cloud Messaging → Web Push certificates)

### 4. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 5. Run Development

```bash
npm run dev
```

This starts:
- React client on `http://localhost:3000`
- Node.js server on `http://localhost:5000`

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/rooms/my-rooms` | Get user's rooms |
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/:id/join` | Join room |
| GET | `/api/messages/room/:id` | Get messages (paginated) |
| GET | `/api/messages/room/:id/search` | Search messages |
| POST | `/api/upload` | Upload file |
| GET | `/api/users/search` | Search users |
| POST | `/api/users/dm/:uid` | Get/create DM |

## 🔌 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client→Server | Send message |
| `message:new` | Server→Client | Receive message |
| `message:edit` | Client→Server | Edit message |
| `message:delete` | Client→Server | Delete message |
| `message:react` | Client→Server | React to message |
| `typing:start/stop` | Client→Server | Typing indicator |
| `typing:update` | Server→Client | Typing state |
| `user:presence` | Server→Client | Online status change |
| `call:offer/answer` | Client→Server | WebRTC signaling |

---

## 🚀 Deployment

- **Client**: Firebase Hosting (`firebase deploy --only hosting`)
- **Server**: Google Cloud Run or Railway
- **Database**: Firebase Firestore (managed)
- **Storage**: Firebase Storage (managed)
