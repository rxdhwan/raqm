import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaSearch, FaPlus, FaComment, FaUser } from 'react-icons/fa'
import { useStore } from '../store'

const BottomNav = () => {
  const location = useLocation()
  const { user } = useStore()
  
  const isActive = (path) => {
    return location.pathname === path
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 flex justify-around items-center">
      <Link 
        to="/" 
        className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-gray-500'}`}
      >
        <FaHome size={24} />
        <span className="text-xs mt-1">Home</span>
      </Link>
      
      <Link 
        to="/search" 
        className={`flex flex-col items-center ${isActive('/search') ? 'text-primary' : 'text-gray-500'}`}
      >
        <FaSearch size={24} />
        <span className="text-xs mt-1">Search</span>
      </Link>
      
      <Link 
        to="/stories" 
        className="flex flex-col items-center justify-center bg-primary text-white rounded-full h-12 w-12 -mt-4"
      >
        <FaPlus size={24} />
      </Link>
      
      <Link 
        to="/chat" 
        className={`flex flex-col items-center ${isActive('/chat') ? 'text-primary' : 'text-gray-500'}`}
      >
        <FaComment size={24} />
        <span className="text-xs mt-1">Chat</span>
      </Link>
      
      <Link 
        to={`/profile/${user?.plate_number}`} 
        className={`flex flex-col items-center ${location.pathname.includes('/profile') ? 'text-primary' : 'text-gray-500'}`}
      >
        <FaUser size={24} />
        <span className="text-xs mt-1">Profile</span>
      </Link>
    </nav>
  )
}

export default BottomNav
