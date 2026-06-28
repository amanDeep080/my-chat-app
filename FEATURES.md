# Chat App - Advanced Features Implementation Guide

## Features Added

### 1. 📞 Voice & Video (Advanced)

#### Backend Implementation:
- **WebRTC Signaling**: Socket.io events for peer-to-peer communication
  - `call:initiate` - Start a call
  - `call:offer` - Send WebRTC offer
  - `call:answer` - Send WebRTC answer
  - `call:ice_candidate` - Send ICE candidates for NAT traversal
  - `call:end` - End the call
  - `call:reject` - Reject incoming call
  - `call:screen_start` / `call:screen_stop` - Screen sharing

#### Frontend Implementation:
- **useVideoCall Hook**: Complete WebRTC lifecycle management
  - Local/remote stream handling
  - Offer/answer creation
  - ICE candidate exchange
  - Call duration tracking
  - Audio/Video toggle
  - Screen sharing support

- **VideoCallComponent**: Full-screen call UI
  - Picture-in-picture local video
  - Remote video display
  - Call duration counter
  - Control buttons (mute, camera, screen share, end call)

- **IncomingCallComponent**: Incoming call notification
  - Caller information display
  - Accept/Reject buttons

#### Features:
- ✅ 1-on-1 video/audio calling via WebRTC
- ✅ Screen sharing (experimental)
- ✅ Call duration tracking
- ✅ Audio/Video controls
- ✅ Call history with recordings

---

### 2. 📁 File Sharing

#### Backend Implementation:
- **fileStorage Service**: Firebase Storage integration
  - File upload with size validation (50MB limit)
  - Image processing and compression (WebP conversion)
  - Signed URL generation (7-day expiry)
  - Automatic cleanup of expired files
  - Support for: images, PDFs, documents, spreadsheets

- **Files Routes**:
  - `POST /api/files` - Upload file
  - `GET /api/files/:fileId` - Get file info
  - `DELETE /api/files/:fileId` - Delete file

#### Frontend Implementation:
- **useFileUpload Hook**: File upload management
  - Progress tracking
  - Multiple file selection
  - Error handling

- **FileUploadComponent**: Drag-and-drop upload UI
  - File preview before upload
  - Upload progress bar
  - File size display

- **ImageLightbox**: Image viewer with gallery
  - Navigate through multiple images
  - Download button
  - Full-screen view

#### Features:
- ✅ Upload images, PDFs, documents
- ✅ Image preview with lightbox viewer
- ✅ File size limit enforcement (50MB)
- ✅ Progress bar during upload
- ✅ Auto-expiry links (7 days)
- ✅ Image compression (WebP)

---

### 3. 🟢 Presence & Status System

#### Backend Implementation:
- **Presence Service**:
  - Update user status (online/away/busy/offline)
  - Heartbeat mechanism (30-second intervals)
  - Last seen timestamp
  - Automatic inactive user cleanup (30 seconds)

- **Presence Routes**:
  - `POST /api/presence/status` - Update status
  - `GET /api/presence/user/:userId` - Get user presence
  - `GET /api/presence/all` - Get all users' presence
  - `POST /api/presence/heartbeat` - Keep-alive signal

#### Frontend Implementation:
- **usePresence Hook**: Status and heartbeat management
  - Automatic heartbeat every 30 seconds
  - Status update API calls
  - Offline on unmount

- **PresenceStatusSelector**: Status dropdown UI
  - Online/Away/Busy/Offline options
  - Visual status indicators
  - Quick toggle

#### Features:
- ✅ User status management (online/away/busy/offline)
- ✅ Last seen timestamp
- ✅ Real-time typing indicators
- ✅ Heartbeat mechanism for connection tracking
- ✅ Automatic offline detection

#### Socket Events:
- `user:presence` - Presence broadcast to all users
- `typing:start` / `typing:stop` - Typing indicators
- `heartbeat` - Keep-alive signal

---

### 4. 💬 Direct Messages (DMs) - 1-on-1 Private Chat

#### Backend Implementation:
- **DM Service**:
  - Create DM rooms between users
  - Fetch user's DM list
  - Search for users to message
  - Delete DM conversations

- **DM Routes**:
  - `POST /api/dms/create` - Create/get DM room
  - `GET /api/dms/list` - Get all user DMs
  - `GET /api/dms/search?q=query` - Search users
  - `DELETE /api/dms/:roomId` - Delete DM

#### Frontend Implementation:
- **useDMs Hook**: DM management
  - Fetch DM list
  - Create DM with user
  - Search for users
  - Delete conversation

- **DirectMessagesPanel**: DM list UI
  - Search/add new DM
  - DM list with avatars
  - Last message preview
  - Delete button

#### Features:
- ✅ 1-on-1 private messaging
- ✅ User search
- ✅ DM history
- ✅ Quick conversation creation
- ✅ Message deletion

---

### 5. 📞 Call History Log

#### Backend Implementation:
- **Call History Service**:
  - Record completed/missed/declined calls
  - Retrieve call history for user
  - Retrieve call history with specific user
  - Delete call records

- **Call History Routes**:
  - `GET /api/calls` - Get user's call history
  - `GET /api/calls/:otherUserId` - Get calls with specific user
  - `DELETE /api/calls/:callId` - Delete call record

#### Frontend Implementation:
- **useCallHistory Hook**: Call history management
  - Fetch call history
  - Delete records
  - Filter by user

- **CallHistoryPanel**: Call history UI
  - Call type icons (video/audio/screen)
  - Call status (completed/missed/declined)
  - Call duration
  - Time relative to now
  - Quick call back button
  - Delete option

#### Features:
- ✅ Complete call history log
- ✅ Call type tracking (video/audio/screen)
- ✅ Call status tracking
- ✅ Duration logging
- ✅ Quick call back
- ✅ History cleanup

---

## Installation & Setup

### 1. Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Environment Variables (.env)
```
# Server .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_STORAGE_BUCKET=your-bucket
CLIENT_URL=http://localhost:3000
PORT=5000
```

### 3. Firestore Collections

The app uses the following Firestore collections:
- `users` - User profiles
- `rooms` - Chat rooms and DMs
- `messages` - Chat messages
- `presence` - User presence/status
- `files` - File metadata
- `callHistory` - Call records

---

## API Endpoints

### Presence
- `POST /api/presence/status` - Update user status
- `GET /api/presence/user/:userId` - Get user presence
- `GET /api/presence/all` - Get all users' presence
- `POST /api/presence/heartbeat` - Record heartbeat

### Files
- `POST /api/files` - Upload file
- `GET /api/files/:fileId` - Get file info
- `DELETE /api/files/:fileId` - Delete file

### DMs
- `POST /api/dms/create` - Create DM room
- `GET /api/dms/list` - Get user's DMs
- `GET /api/dms/search` - Search users
- `DELETE /api/dms/:roomId` - Delete DM

### Call History
- `GET /api/calls` - Get call history
- `GET /api/calls/:otherUserId` - Get calls with user
- `DELETE /api/calls/:callId` - Delete call record

---

## Socket Events

### Call Events
- `call:initiate` - Initiate a call
- `call:offer` - Send WebRTC offer
- `call:answer` - Send WebRTC answer
- `call:ice_candidate` - Send ICE candidate
- `call:screen_start` - Start screen sharing
- `call:screen_stop` - Stop screen sharing
- `call:end` - End call
- `call:reject` - Reject call

### Presence Events
- `user:presence` - Broadcast presence update
- `presence:update` - Update own status
- `heartbeat` - Send heartbeat

### Typing Events
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `typing:update` - Typing users update

---

## Usage Examples

### Starting a Video Call
```javascript
const { startCall, initiateOffer } = useVideoCall(socket);

// Start call
await startCall(targetUserId, true, roomId);

// After receiving call initiate response:
await initiateOffer(targetUserId, callId, roomId);
```

### Uploading a File
```javascript
const { uploadFile } = useFileUpload();

const file = new File([...], "image.jpg");
const fileData = await uploadFile(file, roomId, token);
```

### Managing Status
```javascript
const { setUserStatus } = usePresence(socket, token, userId);

// Change status
await setUserStatus("away");
```

### Creating DM
```javascript
const { createDMRoom } = useDMs(token);

const roomId = await createDMRoom(otherUserId);
```

---

## Security Considerations

1. **Authentication**: All endpoints require Firebase ID token
2. **File Validation**: Server validates file types and sizes
3. **Rate Limiting**: Express rate limiter on all API routes
4. **CORS**: Configured for specific origin
5. **Helmet**: Security headers via Helmet.js
6. **URL Expiry**: File download links expire after 7 days

---

## Performance Optimizations

1. **Image Compression**: Automatic WebP conversion for large images
2. **Lazy Loading**: Components load on demand
3. **Heartbeat**: Efficient presence tracking (30-second intervals)
4. **Cleanup Tasks**: Automatic cleanup of expired data
5. **Stream Management**: Proper cleanup of media streams

---

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- Mobile browsers with WebRTC support

Requires:
- HTTPS (for camera/mic access)
- WebRTC support
- localStorage enabled

---

## Future Enhancements

- [ ] Group video calls (3+ users)
- [ ] Call recording
- [ ] Message encryption
- [ ] Voice messages
- [ ] Emoji reactions improvements
- [ ] Message search
- [ ] Read receipts enhancement
- [ ] Notification sounds
- [ ] Offline message queue

---

## Troubleshooting

### Call Issues
- Check microphone/camera permissions
- Verify HTTPS (for production)
- Check firewall rules
- Try different STUN servers

### File Upload Issues
- Verify file size < 50MB
- Check file type support
- Verify storage bucket permissions
- Check available disk space

### Presence Issues
- Check heartbeat intervals
- Verify clock synchronization
- Check network connectivity
- Monitor server logs

---

For more information, check individual component files and hooks.
