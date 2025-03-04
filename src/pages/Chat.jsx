import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const Chat = () => {
  const { user } = useStore()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const subscriptionRef = useRef(null)
  const navigate = useNavigate()
  
  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up realtime subscription for chats");
    
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      console.log("Removing existing subscription");
      supabase.removeChannel(subscriptionRef.current);
    }
    
    // Create a new subscription
    const channel = supabase.channel('public-messages', {
      config: {
        broadcast: { self: true },
      },
    });
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log("New message received in chats:", payload);
        
        const newMessage = payload.new;
        
        // Update the chat list if the message belongs to one of the user's chats
        setChats(prevChats => {
          // Find the chat this message belongs to
          const chatIndex = prevChats.findIndex(chat => chat.id === newMessage.chat_id);
          
          if (chatIndex === -1) {
            console.log("Message doesn't belong to any loaded chat");
            return prevChats;
          }
          
          console.log("Updating chat with new message");
          
          // Create a copy of the chats array
          const updatedChats = [...prevChats];
          
          // Update the chat with the new message
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: newMessage,
            updated_at: newMessage.created_at,
            unread_count: newMessage.user_id !== user.id 
              ? (updatedChats[chatIndex].unread_count || 0) + 1 
              : updatedChats[chatIndex].unread_count
          };
          
          // Sort chats by updated_at
          return updatedChats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        });
      })
      .subscribe((status) => {
        console.log("Chat messages subscription status:", status);
      });
    
    subscriptionRef.current = channel;
    
    return () => {
      console.log("Cleaning up chat messages subscription");
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user]);
  
  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        console.log("Fetching chats for user:", user.id);
        
        // Get all chats where the current user is a participant
        const { data, error } = await supabase
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
            ),
            messages(
              id,
              content,
              created_at,
              user_id,
              is_read
            )
          `)
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching chats:", error);
          throw error;
        }
        
        console.log("Fetched chats:", data?.length || 0);
        
        // Process the data to get the other participant and last message
        const processedChats = data.map(chat => {
          // Find the other participant
          const otherParticipant = chat.participants.find(
            p => p.user_id !== user.id
          )?.profiles;
          
          // Get the last message
          const lastMessage = chat.messages.length > 0 
            ? chat.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
            : null;
          
          return {
            ...chat,
            otherParticipant,
            lastMessage
          };
        }).filter(chat => chat.otherParticipant); // Filter out chats with no other participant
        
        console.log("Processed chats:", processedChats.length);
        
        setChats(processedChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChats();
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Please log in to view your messages.</p>
      </div>
    );
  }
  
  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      {chats.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No messages yet.</p>
          <p className="text-gray-500">
            Start a conversation by visiting a user's profile and clicking the message button.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(chat => (
            <Link 
              key={chat.id} 
              to={`/chat/${chat.id}`}
              className="block card hover:bg-gray-50 transition-colors"
            >
              <div className="p-4 flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                  {chat.otherParticipant?.avatar_url ? (
                    <img 
                      src={chat.otherParticipant.avatar_url} 
                      alt={chat.otherParticipant.plate_number} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                      {chat.otherParticipant?.plate_number.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold truncate">
                      {chat.otherParticipant?.plate_number}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {chat.lastMessage ? (
                    <p className={`truncate ${
                      !chat.lastMessage.is_read && chat.lastMessage.user_id !== user.id 
                        ? 'font-semibold text-gray-900' 
                        : 'text-gray-600'
                    }`}>
                      {chat.lastMessage.user_id === user.id ? 'You: ' : ''}
                      {chat.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No messages yet</p>
                  )}
                </div>
                
                {chat.unread_count > 0 && chat.lastMessage?.user_id !== user.id && (
                  <div className="ml-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {chat.unread_count}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chat;
