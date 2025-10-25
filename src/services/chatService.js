// Real-time Chat Service with Supabase
import { supabase } from '../config/supabase';

// Get all chat rooms
export const getChatRooms = async () => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get chat rooms error:', error);
    return [];
  }
};

// Get messages for a specific room
export const getRoomMessages = async (roomId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users (name, email)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).reverse(); // Reverse to show oldest first
  } catch (error) {
    console.error('Get room messages error:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (roomId, userId, message, isAnonymous = false) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          room_id: roomId,
          user_id: userId,
          message: message.trim(),
          is_anonymous: isAnonymous,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe to new messages in a room (real-time)
export const subscribeToRoomMessages = (roomId, callback) => {
  const subscription = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // Fetch user data for the new message
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', payload.new.user_id)
          .single();

        const messageWithUser = {
          ...payload.new,
          users: userData,
        };

        callback(messageWithUser);
      }
    )
    .subscribe();

  return subscription;
};

// Unsubscribe from room
export const unsubscribeFromRoom = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

// Create a new chat room (admin only)
export const createChatRoom = async (name, description, icon) => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([
        {
          name,
          description,
          icon,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat room:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Create chat room error:', error);
    return { success: false, error: error.message };
  }
};

// Delete a message (user can delete their own messages)
export const deleteMessage = async (messageId, userId) => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete message error:', error);
    return { success: false, error: error.message };
  }
};
