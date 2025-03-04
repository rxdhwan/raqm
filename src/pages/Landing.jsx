import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { FaCar, FaUsers, FaComments, FaSearch, FaShieldAlt } from 'react-icons/fa'

const Landing = () => {
  const { user } = useStore()
  const navigate = useNavigate()
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 mix-blend-multiply"></div>
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury cars in Dubai" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <nav className="flex justify-between items-center mb-16">
            <div className="text-white text-2xl font-bold">RAQM</div>
            <div className="space-x-4">
              <Link to="/login" className="btn bg-white text-primary hover:bg-gray-100">
                Login
              </Link>
              <Link to="/register" className="btn bg-transparent text-white border border-white hover:bg-white/10">
                Register
              </Link>
            </div>
          </nav>
          
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Connect with Car Enthusiasts Across UAE
            </h1>
            <p className="text-xl text-white/90 mb-8">
              RAQM is the premier social platform for car lovers in the UAE. 
              Share your passion, connect with fellow enthusiasts, and showcase your ride.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="btn bg-white text-primary hover:bg-gray-100 text-center py-3 px-6 text-lg">
                Join Now
              </Link>
              <Link to="/login" className="btn bg-transparent text-white border border-white hover:bg-white/10 text-center py-3 px-6 text-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join RAQM?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
                <FaCar size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Car Plates</h3>
              <p className="text-gray-600">
                Your car plate number is your unique identity. Verified through Mulkiya ID for authenticity.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
                <FaUsers size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect with Enthusiasts</h3>
              <p className="text-gray-600">
                Follow other car lovers, share experiences, and build your network of automotive friends.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
                <FaComments size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Messaging</h3>
              <p className="text-gray-600">
                Chat directly with other members, arrange meetups, or discuss modifications and tips.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How RAQM Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
                    alt="Registration process" 
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">1. Register & Verify</h3>
                <p className="text-gray-600 mb-4">
                  Sign up with your email and create a profile with your car plate number. 
                  Verify your identity by scanning your Mulkiya ID.
                </p>
                <div className="flex items-center text-primary">
                  <FaShieldAlt className="mr-2" />
                  <span className="font-medium">Secure & Private Verification</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row-reverse items-center mb-12">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pl-8">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1494905998402-395d579af36f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
                    alt="Social feed" 
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">2. Connect & Share</h3>
                <p className="text-gray-600 mb-4">
                  Follow other car enthusiasts, share photos and stories about your ride, 
                  and engage with content from the community.
                </p>
                <div className="flex items-center text-primary">
                  <FaUsers className="mr-2" />
                  <span className="font-medium">Build Your Network</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1581688978098-8bc9cd434321?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
                    alt="Messaging" 
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-semibold mb-4">3. Discover & Message</h3>
                <p className="text-gray-600 mb-4">
                  Search for specific car plates, discover new enthusiasts, and 
                  communicate directly through our instant messaging system.
                </p>
                <div className="flex items-center text-primary">
                  <FaSearch className="mr-2" />
                  <span className="font-medium">Find Like-minded Enthusiasts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Join the Community?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Connect with car enthusiasts across the UAE, share your passion, and be part of the fastest growing automotive social network.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="btn bg-white text-primary hover:bg-gray-100 text-center py-3 px-6 text-lg">
              Create Account
            </Link>
            <Link to="/login" className="btn bg-transparent border border-white hover:bg-white/10 text-center py-3 px-6 text-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">RAQM</h2>
              <p className="text-gray-400">Connect with car enthusiasts across UAE</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white">Login</Link>
              <Link to="/register" className="text-gray-400 hover:text-white">Register</Link>
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} RAQM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
