import { Link, useNavigate } from 'react-router-dom'
import { FaSearch, FaBell } from 'react-icons/fa'
import { useStore } from '../store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, setUser } = useStore()
  const navigate = useNavigate()
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      navigate('/login')
    } catch (error) {
      toast.error('Error logging out')
      console.error(error)
    }
  }
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 max-w-4xl flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">RAQM</Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/search" className="text-gray-600 hover:text-primary">
            <FaSearch size={20} />
          </Link>
          
          <button className="text-gray-600 hover:text-primary relative">
            <FaBell size={20} />
            <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </button>
          
          <Link to={`/profile/${user?.plate_number}`} className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.plate_number} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                  {user?.plate_number?.charAt(0) || 'R'}
                </div>
              )}
            </div>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-primary"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
