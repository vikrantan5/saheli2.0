// Real-time Chat Service with Firebase Firestore
import firestore from '@react-native-firebase/firestore';

/**
 * Get all chat rooms
 * @returns {Promise<Array>} Array of chat room objects
 */
export const getChatRooms = async () => {
  try {
    const snapshot = await firestore()
      .collection('chat_rooms')
      .orderBy('created_at', 'asc')
      .get();

    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return rooms;
  } catch (error) {
    console.error('❌ Get chat rooms error:', error);
    return [];
  }
};

/**
 * Get messages for a specific room
 * @param {string} roomId - Chat room ID
 * @param {number} limit - Maximum number of messages to fetch
 * @returns {Promise<Array>} Array of message objects with user info
 */
export const getRoomMessages = async (roomId, limit = 50) => {
  try {
    const snapshot = await firestore()
      .collection('chat_messages')
      .where('room_id', '==', roomId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Firestore returns timestamp, convert if needed
      created_at: doc.data().created_at?.toDate()
    }));

    // Reverse to show oldest first
    return messages.reverse();
  } catch (error) {
    console.error('❌ Get room messages error:', error);
    return [];
  }
};

/**
 * Send a message to a chat room
 * @param {string} roomId - Chat room ID
 * @param {string} userId - User ID
 * @param {string} message - Message text
 * @param {boolean} isAnonymous - Whether message is anonymous
 * @returns {Promise<Object>} Result with success status
 */
export const sendMessage = async (roomId, userId, message, isAnonymous = false) => {
  try {
    const messageData = {
      room_id: roomId,
      user_id: userId,
      message: message.trim(),
      is_anonymous: isAnonymous,
      created_at: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore()
      .collection('chat_messages')
      .add(messageData);

    console.log('✅ Message sent:', docRef.id);
    
    return { 
      success: true, 
      data: { id: docRef.id, ...messageData }
    };
  } catch (error) {
    console.error('❌ Send message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to new messages in a room (real-time listener)
 * @param {string} roomId - Chat room ID
 * @param {Function} callback - Callback function to handle new messages
 * @returns {Function} Unsubscribe function
 */
export const subscribeToRoomMessages = (roomId, callback) => {
  try {
    const unsubscribe = firestore()
      .collection('chat_messages')
      .where('room_id', '==', roomId)
      .orderBy('created_at', 'desc')
      .limit(1) // Only listen for new messages
      .onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const message = {
                id: change.doc.id,
                ...change.doc.data(),
                created_at: change.doc.data().created_at?.toDate()
              };
              
              // Pass the new message to callback
              callback(message);
            }
          });
        },
        (error) => {
          console.error('❌ Message subscription error:', error);
        }
      );

    return unsubscribe;
  } catch (error) {
    console.error('❌ Subscribe to room error:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Unsubscribe from room messages
 * @param {Function} unsubscribe - Unsubscribe function returned from subscribeToRoomMessages
 */
export const unsubscribeFromRoom = (unsubscribe) => {
  if (unsubscribe && typeof unsubscribe === 'function') {
    unsubscribe();
  }
};

/**
 * Create a new chat room (admin only - typically done manually in Firebase Console)
 * @param {string} name - Room name
 * @param {string} description - Room description
 * @param {string} icon - Icon identifier
 * @returns {Promise<Object>} Result with success status
 */
export const createChatRoom = async (name, description, icon) => {
  try {
    const roomData = {
      name,
      description,
      icon,
      created_at: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore()
      .collection('chat_rooms')
      .add(roomData);

    console.log('✅ Chat room created:', docRef.id);
    
    return { 
      success: true, 
      data: { id: docRef.id, ...roomData }
    };
  } catch (error) {
    console.error('❌ Create chat room error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a message (user can only delete their own messages)
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<Object>} Result with success status
 */
export const deleteMessage = async (messageId, userId) => {
  try {
    // First verify the message belongs to the user
    const messageDoc = await firestore()
      .collection('chat_messages')
      .doc(messageId)
      .get();

    if (!messageDoc.exists) {
      return { success: false, error: 'Message not found' };
    }

    if (messageDoc.data().user_id !== userId) {
      return { success: false, error: 'Unauthorized: Cannot delete other users messages' };
    }

    await firestore()
      .collection('chat_messages')
      .doc(messageId)
      .delete();

    console.log('✅ Message deleted:', messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Delete message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get chat room by ID
 * @param {string} roomId - Room ID
 * @returns {Promise<Object|null>} Room data or null
 */
export const getChatRoom = async (roomId) => {
  try {
    const doc = await firestore()
      .collection('chat_rooms')
      .doc(roomId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('❌ Get chat room error:', error);
    return null;
  }
};
