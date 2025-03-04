import { Link } from 'react-router-dom'
import { FaCar, FaHome } from 'react-icons/fa'

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-primary mb-4">
          <FaCar size={64} className="mx-auto" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/" className="btn btn-primary inline-flex items-center">
          <FaHome className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
