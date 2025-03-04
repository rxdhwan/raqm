import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useStore } from './store'
import toast from 'react-hot-toast'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import ChatRoom from './pages/ChatRoom'
import Stories from './pages/Stories'
import Search from './pages/Search'
import NotFound from './pages/NotFound'
import MulkiyaVerification from './pages/MulkiyaVerification'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { setUser, user } = useStore()
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Loading timeout reached, forcing state update");
        setLoading(false);
        setSessionChecked(true);
      }
    }, 5000); // 5 seconds timeout

    const getInitialSession = async () => {
      try {
        console.log("Getting initial session");
        setLoading(true);

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          toast.error("Failed to retrieve session. Please try again.");
          setLoading(false);
          setSessionChecked(true);
          return;
        }

        console.log("Session retrieved:", session ? "Yes" : "No");

        if (session?.user) {
          console.log("User found in session, fetching profile");
          
          // Fetch the user's profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            
            // Check if the error is because the profile doesn't exist
            if (profileError.code === 'PGRST116') {
              console.log("Profile not found, user may need to complete registration");
              // Set the user with just the auth data
              setUser(session.user);
            } else {
              toast.error("Failed to retrieve profile. Please try again.");
              await supabase.auth.signOut();
              setUser(null);
              navigate('/login');
            }
          } else {
            // Set the user with both auth and profile data
            console.log("Profile retrieved, setting user");
            setUser({
              ...session.user,
              ...profile,
            });
          }
        } else {
          console.log("No session, clearing user");
          setUser(null);
        }
      } catch (error) {
        console.error("Unexpected error during session retrieval:", error);
        toast.error("An unexpected error occurred. Please try again.");
        setUser(null);
      } finally {
        console.log("Session check complete");
        setLoading(false);
        setSessionChecked(true);
        clearTimeout(loadingTimeout);
      }
    };

    getInitialSession();

    // Realtime Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        try {
          if (event === 'SIGNED_IN' && session) {
            console.log("User signed in, fetching profile");
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error("Error fetching profile on auth change:", profileError);
              
              // Check if the error is because the profile doesn't exist
              if (profileError.code === 'PGRST116') {
                console.log("Profile not found, user may need to complete registration");
                // Set the user with just the auth data
                setUser(session.user);
              } else {
                console.error("Other profile error:", profileError);
              }
              return;
            }

            console.log("Setting user after sign in");
            setUser({
              ...session.user,
              ...profile,
            });
          } else if (event === 'SIGNED_OUT') {
            console.log("User signed out, clearing user");
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log("Token refreshed");
            // The session has been refreshed, no need to do anything
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
        }
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, [setUser, navigate]);

  // Determine which routes to render
  const renderRoutes = () => {
    // If we're still loading and haven't checked the session, show loading
    if (loading && !sessionChecked) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Otherwise, render the routes
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-mulkiya" element={<MulkiyaVerification />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Feed />} />
          <Route path="profile/:plateNumber" element={<Profile />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<ChatRoom />} />
          <Route path="stories" element={<Stories />} />
          <Route path="search" element={<Search />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  };

  return renderRoutes();
}

export default App;
