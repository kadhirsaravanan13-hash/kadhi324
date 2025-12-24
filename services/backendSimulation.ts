
/**
 * BACKEND ARCHITECTURE & SCHEMA DOCUMENTATION (SIMULATED)
 * 
 * Tech Stack: Node.js + Socket.io + MongoDB + Cloudinary
 */

/* 1. DATABASE SCHEMA (MongoDB/Mongoose) */

/**
 * User Schema
 * {
 *   _id: ObjectId,
 *   phone: String (Unique, Indexed),
 *   name: String,
 *   avatar: String, // Cloudinary URL
 *   about: String,
 *   privacy: {
 *     lastSeen: String, // Enum: everyone, contacts, nobody
 *     profilePhoto: String,
 *     about: String
 *   },
 *   blocked: [ObjectId], // Ref: User
 *   fcmToken: String // For Push Notifications
 * }
 */

/**
 * Chat Schema
 * {
 *   _id: ObjectId,
 *   type: String, // individual | group
 *   participants: [ObjectId], // Ref: User
 *   lastMessage: ObjectId, // Ref: Message
 *   adminIds: [ObjectId] // Only for groups
 * }
 */

/**
 * Message Schema
 * {
 *   _id: ObjectId,
 *   chatId: ObjectId, // Ref: Chat
 *   sender: ObjectId, // Ref: User
 *   content: String,
 *   type: String, // text, image, voice, doc
 *   mediaUrl: String,
 *   status: String, // sent, delivered, read
 *   timestamp: Date
 * }
 */

/* 2. REAL-TIME EVENTS (Socket.IO) */

/**
 * 'send_message' -> Emits to all participants in room (chatId)
 * 'typing' -> Emits typing indicator to room
 * 'update_status' -> Emits delivery/read receipts
 * 'call_offer' / 'call_answer' -> WebRTC signaling for Voice/Video
 */

/* 3. REST API ENDPOINTS */

/**
 * POST /auth/request-otp { phone }
 * POST /auth/verify-otp { phone, code }
 * GET /contacts/sync { phoneNumbers: [] }
 * POST /chats/create { participantId, type }
 * POST /media/upload (Multipart form data)
 * GET /status/feed (Returns active stories from contacts)
 */

export const mockApiCall = async (delay = 500) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};
