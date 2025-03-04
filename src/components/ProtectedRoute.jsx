import { Navigate } from 'react-router-dom'
import { useStore } from '../store'

const ProtectedRoute = ({ children }) => {
  const { user } = useStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check if user has verified their Mulkiya
  if (!user.is_mulkiya_verified) {
    return <Navigate to="/verify-mulkiya" replace />
  }
  
  return children
}

export default ProtectedRoute
