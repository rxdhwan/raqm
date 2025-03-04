import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import { FaCamera, FaCheck, FaRedo, FaUpload, FaInfoCircle } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'

const MulkiyaVerification = () => {
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')
  const [useWebcam, setUseWebcam] = useState(true)
  const [hasWebcam, setHasWebcam] = useState(true)
  const [showInstructions, setShowInstructions] = useState(true)
  const navigate = useNavigate()
  const { user, setUser } = useStore()
  
  useEffect(() => {
    // Check if webcam is available
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasWebcam(true))
      .catch(() => {
        setHasWebcam(false)
        setUseWebcam(false)
      })
  }, [])
  
  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      setCapturedImage(imageSrc)
      setShowInstructions(false)
    }
  }
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedImage(reader.result)
        setShowInstructions(false)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const retakeImage = () => {
    setCapturedImage(null)
    setShowInstructions(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const extractPlateNumber = (imageData) => {
    // In a real app, this would use OCR to extract the plate number from the Mulkiya
    // For demo purposes, we'll just use the user's registered plate number
    return user?.plate_number || ''
  }
  
  const verifyMulkiya = async () => {
    if (!user) {
      toast.error('User data not loaded. Please try again.');
      return;
    }
    
    if (!capturedImage) {
      toast.error('Please capture or upload an image of your Mulkiya ID')
      return
    }
    
    try {
      setLoading(true)
      
      // Extract plate number from image (simulated)
      const extractedPlateNumber = extractPlateNumber(capturedImage)
      
      // In a real app, you would:
      // 1. Upload the image to storage
      // 2. Process it with OCR to verify the plate number
      // 3. Match it with the user's registered plate number
      // 4. Potentially have an admin review process
      
      // Upload image to Supabase Storage
      const fileName = `mulkiya_${user.id}_${uuidv4()}.jpg`
      
      // Convert base64 to blob
      const base64Data = capturedImage.split(',')[1]
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())
      
      // **IMPORTANT: Make sure the bucket name matches your Supabase storage bucket name**
      const bucketName = 'mulkiya-verifications'; // Corrected bucket name
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: 'image/jpeg'
        })
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)
      
      const imageUrl = data.publicUrl
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_mulkiya_verified: true,
          mulkiya_verified_at: new Date().toISOString(),
          mulkiya_image_url: imageUrl
        })
        .eq('id', user.id)
      
      if (updateError) throw updateError
      
      // Update local user state
      setUser({
        ...user,
        is_mulkiya_verified: true,
        mulkiya_verified_at: new Date().toISOString(),
        mulkiya_image_url: imageUrl
      })
      
      toast.success('Mulkiya verification successful!')
      navigate('/')
    } catch (error) {
      console.error('Error verifying Mulkiya:', error)
      toast.error(error.message || 'Error verifying Mulkiya')
    } finally {
      setLoading(false)
    }
  }
  
  // **CONDITIONAL RENDERING**
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">RAQM</h1>
            <p className="text-gray-600">Verifying your Mulkiya ID</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="mt-4 text-center text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">RAQM</h1>
          <p className="text-gray-600">Verify your Mulkiya ID</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Mulkiya Verification</h2>
          
          {showInstructions && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <FaInfoCircle className="text-primary mt-1 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Instructions:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Place your Mulkiya ID card on a flat surface with good lighting</li>
                    <li>Make sure the plate number is clearly visible</li>
                    <li>Ensure all four corners of the Mulkiya are visible in the frame</li>
                    <li>Avoid glare or shadows on the document</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            {capturedImage ? (
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured Mulkiya" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={retakeImage}
                  className="absolute bottom-4 left-4 bg-white p-2 rounded-full shadow-md"
                  type="button"
                >
                  <FaRedo className="text-primary" size={20} />
                </button>
              </div>
            ) : hasWebcam && useWebcam ? (
              <div className="relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "environment"
                  }}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none"></div>
                <button
                  onClick={captureImage}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-full shadow-md"
                  type="button"
                >
                  <FaCamera className="text-primary" size={24} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <FaUpload className="mx-auto text-gray-400 mb-4" size={32} />
                <p className="text-gray-600 mb-4">Upload a photo of your Mulkiya ID</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline"
                  type="button"
                >
                  Select File
                </button>
              </div>
            )}
          </div>
          
          {hasWebcam && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={() => setUseWebcam(!useWebcam)}
                className="text-primary text-sm font-medium"
                type="button"
              >
                {useWebcam ? 'Switch to file upload' : 'Switch to camera'}
              </button>
            </div>
          )}
          
          {capturedImage && (
            <div className="space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="plateNumber">
                  Confirm Your Plate Number
                </label>
                <input
                  id="plateNumber"
                  type="text"
                  className="input"
                  placeholder="e.g., DUBAI A 12345"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please confirm the plate number shown on your Mulkiya
                </p>
              </div>
              
              <button
                onClick={verifyMulkiya}
                className="btn btn-primary w-full flex items-center justify-center"
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Verify Mulkiya
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Your Mulkiya information is securely stored and only used for verification purposes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MulkiyaVerification
