import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { FaEnvelope, FaLock, FaCar } from 'react-icons/fa'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useStore()
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])
  
  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // User is logged in, profile will be fetched in App.jsx
        toast.success('Login successful!')
        
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          toast.error('Please verify your email before logging in')
          await supabase.auth.signOut()
          setUser(null)
          return
        }
        
        navigate('/')
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error.message || 'Error logging in')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">RAQM</h1>
          <p className="text-gray-600">Connect with car enthusiasts across UAE</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/landing" className="text-gray-500 hover:text-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
