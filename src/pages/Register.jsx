import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { FaEnvelope, FaLock, FaCar, FaUser } from 'react-icons/fa'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    plateNumber: '',
    fullName: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleRegister = async (e) => {
    e.preventDefault()
    
    const { email, password, confirmPassword, plateNumber, fullName } = formData
    
    if (!email || !password || !confirmPassword || !plateNumber || !fullName) {
      toast.error('Please fill in all fields')
      return
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    // Validate plate number format (simple validation)
    const plateRegex = /^[A-Z0-9\-\s]+$/i
    if (!plateRegex.test(plateNumber)) {
      toast.error('Please enter a valid plate number')
      return
    }
    
    try {
      setLoading(true)
      
      // Check if plate number already exists
      const { data: existingPlate } = await supabase
        .from('profiles')
        .select('plate_number')
        .eq('plate_number', plateNumber)
        .single()
      
      if (existingPlate) {
        toast.error('This plate number is already registered')
        return
      }
      
      // Register user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              plate_number: plateNumber,
              is_mulkiya_verified: false,
              show_phone_number: false,
            }
          ])
        
        if (profileError) throw profileError
        
        toast.success('Registration successful! Please verify your Mulkiya ID.')
        navigate('/verify-mulkiya')
      }
    } catch (error) {
      toast.error(error.message || 'Error during registration')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">RAQM</h1>
          <p className="text-gray-600">Join the UAE's car enthusiast community</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
          
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>
            
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
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="plateNumber">
                Car Plate Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCar className="text-gray-400" />
                </div>
                <input
                  id="plateNumber"
                  name="plateNumber"
                  type="text"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="e.g., DUBAI A 12345"
                  value={formData.plateNumber}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be your unique username on RAQM
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-800"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium">
                Login
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

export default Register
