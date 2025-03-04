import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const ChatRoom = () => {
  const { id: chatId } = useParams()
  const { user } = useStore()
  const [chat, setChat] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)
  const navigate = useNavigate()
  
  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!chatId) return;
    
    console.log("Setting up realtime subscription for chat:", chatId);
    
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      console.log("Removing existing subscription");
      supabase.removeChannel(subscriptionRef.current);
    }
    
    // Create a new subscription
    const channel = supabase.channel(`chat-${chatId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: user?.id || 'anonymous' },
      },
    });
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        console.log("New message received:", payload);
        
        // Fetch the user profile for the new message
        supabase
          .from('profiles')
          .select('id, plate_number, avatar_url')
          .eq('id', payload.new.user_id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error("Error fetching profile for message:", error);
              return;
            }
            
            const messageWithProfile = {
              ...payload.new,
              profiles: profile
            };
            
            console.log("Adding message to state:", messageWithProfile);
            setMessages(prev => [...prev, messageWithProfile]);
            
            // Mark message as read if it's from the other user
            if (payload.new.user_id !== user?.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', payload.new.id)
                .then(({ error }) => {
                  if (error) {
                    console.error("Error marking message as read:", error);
                  }
                });
            }
          });
      })
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to chat messages");
        }
      });
    
    subscriptionRef.current = channel;
    
    return () => {
      console.log("Cleaning up chat subscription");
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [chatId, user?.id]);
  
  // Fetch chat data and messages
  useEffect(() => {
    const fetchChatAndMessages = async () => {
      try {
        setLoading(true);
        
        if (!chatId || !user) {
          console.error("Missing chatId or user");
          toast.error("Unable to load chat");
          navigate('/chat');
          return;
        }
        
        console.log("Fetching chat data for:", chatId);
        
        // Get chat details
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            *,
            participants:chat_participants(
              user_id,
              profiles:user_id(
                id,
                plate_number,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', chatId)
          .single();
        
        if (chatError) {
          console.error("Error fetching chat:", chatError);
          throw chatError;
        }
        
        if (!chatData) {
          console.error("Chat not found");
          toast.error("Chat not found");
          navigate('/chat');
          return;
        }
        
        console.log("Chat data retrieved:", chatData);
        setChat(chatData);
        
        // Find the other participant
        const otherParticipant = chatData.participants.find(
          p => p.user_id !== user.id
        )?.profiles;
        
        if (!otherParticipant) {
          console.error("Other participant not found");
          toast.error("Unable to load chat participant");
          navigate('/chat');
          return;
        }
        
        console.log("Other participant:", otherParticipant);
        setOtherUser(otherParticipant);
        
        // Get messages
        console.log("Fetching messages for chat:", chatId);
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            profiles:user_id(
              id,
              plate_number,
              avatar_url
            )
          `)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          throw messagesError;
        }
        
        console.log("Messages retrieved:", messagesData?.length || 0);
        setMessages(messagesData || []);
        
        // Mark messages as read
        const unreadMessages = messagesData?.filter(
          msg => !msg.is_read && msg.user_id !== user.id
        ) || [];
        
        if (unreadMessages.length > 0) {
          console.log("Marking messages as read:", unreadMessages.length);
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('chat_id', chatId)
            .neq('user_id', user.id)
            .eq('is_read', false);
          
          // Update chat unread count
          await supabase
            .from('chats')
            .update({ unread_count: 0 })
            .eq('id', chatId);
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
        toast.error('Failed to load chat');
        navigate('/chat');
      } finally {
        setLoading(false);
      }
    };
    
    if (chatId && user) {
      fetchChatAndMessages();
    }
  }, [chatId, user, navigate]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !chatId) return;
    
    try {
      setSendingMessage(true);
      console.log("Sending message:", newMessage);
      
      // Generate a temporary ID for optimistic UI update
      const tempId = uuidv4();
      const now = new Date().toISOString();
      
      // Create message data
      const messageData = {
        id: tempId, // Temporary ID for optimistic UI
        chat_id: chatId,
        user_id: user.id,
        content: newMessage.trim(),
        is_read: false,
        created_at: now
      };
      
      // Add message to UI immediately (optimistic update)
      const optimisticMessage = {
        ...messageData,
        profiles: {
          id: user.id,
          plate_number: user.plate_number,
          avatar_url: user.avatar_url
        },
        isOptimistic: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Send message to server
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content: messageData.content,
          is_read: false,
          created_at: now
        })
        .select();
      
      if (error) {
        console.error("Error sending message:", error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw error;
      }
      
      console.log("Message sent successfully:", data);
      
      // Update chat's updated_at and increment unread count
      await supabase
        .from('chats')
        .update({
          updated_at: now,
          unread_count: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', chatId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageData.content); // Restore message text on error
    } finally {
      setSendingMessage(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!chat || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500 mb-4">Chat not found or inaccessible</p>
        <button 
          onClick={() => navigate('/chat')}
          className="btn btn-primary"
        >
          Back to Chats
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-white shadow-sm p-3 flex items-center">
        <button 
          onClick={() => navigate('/chat')}
          className="mr-3 text-gray-600"
        >
          <FaArrowLeft size={18} />
        </button>
        
        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
          {otherUser?.avatar_url ? (
            <img 
              src={otherUser.avatar_url} 
              alt={otherUser.plate_number} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
              {otherUser?.plate_number.charAt(0)}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="font-bold">{otherUser?.plate_number}</h2>
          <p className="text-xs text-gray-500">{otherUser?.full_name}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user_id === user.id;
            const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
            
            return (
              <div 
                key={message.id} 
                className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && showAvatar && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden mr-2 flex-shrink-0">
                    {message.profiles?.avatar_url ? (
                      <img 
                        src={message.profiles.avatar_url} 
                        alt={message.profiles.plate_number} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold text-xs">
                        {message.profiles?.plate_number.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] ${!isOwnMessage && !showAvatar ? 'ml-10' : ''}`}>
                  <div 
                    className={`p-3 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                  <div 
                    className={`text-xs text-gray-500 mt-1 ${
                      isOwnMessage ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    {isOwnMessage && (
                      <span className="ml-2">
                        {message.isOptimistic ? 'Sending...' : (message.is_read ? 'Read' : 'Sent')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form 
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-gray-200 flex items-center"
      >
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sendingMessage}
        />
        <button
          type="submit"
          className="ml-2 bg-primary text-white rounded-full p-2 focus:outline-none hover:bg-primary/90"
          disabled={!newMessage.trim() || sendingMessage}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
