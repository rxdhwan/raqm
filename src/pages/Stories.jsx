import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaCamera, FaTimes, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const Stories = () => {
  const { user, stories, setStories } = useStore()
  const [activeStoryGroup, setActiveStoryGroup] = useState(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingStories, setFetchingStories] = useState(true)
  const fileInputRef = useRef(null)
  const progressRef = useRef(null)
  const timeoutRef = useRef(null)
  const navigate = useNavigate()
  
  // Create the required buckets if they don't exist
  const createBucketIfNotExists = async (bucketName) => {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets.some(bucket => bucket.name === bucketName)
      
      if (!bucketExists) {
        // Create the bucket
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true
        })
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error)
          return false
        }
        console.log(`Bucket ${bucketName} created successfully`)
      }
      return true
    } catch (error) {
      console.error(`Error checking/creating bucket ${bucketName}:`, error)
      return false
    }
  }
  
  useEffect(() => {
    const fetchStories = async () => {
      try {
        if (!user || !user.id) {
          setFetchingStories(false)
          return
        }
        
        setFetchingStories(true)
        console.log("Fetching stories for user:", user.id)
        
        // Get stories from users the current user follows + their own stories
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        
        const followingIds = followingData?.map(item => item.following_id) || []
        followingIds.push(user.id) // Include user's own stories
        
        console.log("Following IDs + user:", followingIds)
        
        // Get stories from the last 24 hours
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        
        const { data, error } = await supabase
          .from('stories')
          .select(`
            *,
            profiles:user_id (
              id,
              plate_number,
              full_name,
              avatar_url
            )
          `)
          .in('user_id', followingIds)
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error("Error fetching stories:", error)
          throw error
        }
        
        console.log("Stories fetched:", data?.length || 0)
        
        // Group stories by user
        const groupedStories = (data || []).reduce((acc, story) => {
          const userId = story.user_id
          if (!acc[userId]) {
            acc[userId] = {
              user: story.profiles,
              stories: []
            }
          }
          acc[userId].stories.push(story)
          return acc
        }, {})
        
        const storyGroups = Object.values(groupedStories)
        console.log("Story groups:", storyGroups.length)
        
        setStories(storyGroups)
        
        // Set active story if not already set and there are stories
        if (storyGroups.length > 0 && !activeStoryGroup) {
          setActiveStoryGroup(storyGroups[0])
          setActiveStoryIndex(0)
          startProgressBar()
        }
      } catch (error) {
        console.error('Error fetching stories:', error)
        toast.error('Failed to load stories')
      } finally {
        setFetchingStories(false)
      }
    }
    
    fetchStories()
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user, setStories])
  
  const startProgressBar = () => {
    if (progressRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      progressRef.current.style.width = '0%'
      progressRef.current.style.transition = 'none'
      
      // Force reflow
      progressRef.current.offsetHeight
      
      progressRef.current.style.width = '100%'
      progressRef.current.style.transition = 'width 5s linear'
      
      // Move to next story after 5 seconds
      timeoutRef.current = setTimeout(() => {
        goToNextStory()
      }, 5000)
    }
  }
  
  const goToNextStory = () => {
    if (!activeStoryGroup) return
    
    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      // Next story in current group
      setActiveStoryIndex(activeStoryIndex + 1)
      startProgressBar()
    } else {
      // Next story group
      const currentIndex = stories.findIndex(
        group => group.user.id === activeStoryGroup.user.id
      )
      
      if (currentIndex < stories.length - 1) {
        setActiveStoryGroup(stories[currentIndex + 1])
        setActiveStoryIndex(0)
        startProgressBar()
      } else {
        // End of all stories
        navigate('/')
      }
    }
  }
  
  const goToPrevStory = () => {
    if (!activeStoryGroup) return
    
    if (activeStoryIndex > 0) {
      // Previous story in current group
      setActiveStoryIndex(activeStoryIndex - 1)
      startProgressBar()
    } else {
      // Previous story group
      const currentIndex = stories.findIndex(
        group => group.user.id === activeStoryGroup.user.id
      )
      
      if (currentIndex > 0) {
        const prevGroup = stories[currentIndex - 1]
        setActiveStoryGroup(prevGroup)
        setActiveStoryIndex(prevGroup.stories.length - 1)
        startProgressBar()
      }
    }
  }
  
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const createStory = async () => {
    if (!image) {
      toast.error('Please select an image')
      return
    }
    
    try {
      setLoading(true)
      
      // Create the bucket if it doesn't exist
      const bucketName = 'story_images' // Match the bucket name in schema.sql
      const bucketCreated = await createBucketIfNotExists(bucketName)
      
      if (!bucketCreated) {
        throw new Error('Failed to create or access storage bucket')
      }
      
      // Upload image
      const fileExt = image.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, image)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)
      
      const imageUrl = data.publicUrl
      
      // Create story
      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption: caption.trim() || null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      
      if (error) throw error
      
      toast.success('Story created successfully!')
      
      // Reset form
      setIsCreating(false)
      setImage(null)
      setImagePreview(null)
      setCaption('')
      
      // Fetch all stories again to ensure we have the latest data
      try {
        // Get stories from users the current user follows + their own stories
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        
        const followingIds = followingData?.map(item => item.following_id) || []
        followingIds.push(user.id) // Include user's own stories
        
        // Get stories from the last 24 hours
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)
        
        const { data: refreshedStories, error: refreshError } = await supabase
          .from('stories')
          .select(`
            *,
            profiles:user_id (
              id,
              plate_number,
              full_name,
              avatar_url
            )
          `)
          .in('user_id', followingIds)
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
        
        if (refreshError) throw refreshError
        
        // Group stories by user
        const groupedStories = (refreshedStories || []).reduce((acc, story) => {
          const userId = story.user_id
          if (!acc[userId]) {
            acc[userId] = {
              user: story.profiles,
              stories: []
            }
          }
          acc[userId].stories.push(story)
          return acc
        }, {})
        
        const storyGroups = Object.values(groupedStories)
        setStories(storyGroups)
        
        // Find the user's story group
        const userStoryGroup = storyGroups.find(group => group.user.id === user.id)
        if (userStoryGroup) {
          setActiveStoryGroup(userStoryGroup)
          setActiveStoryIndex(0)
          startProgressBar()
        }
      } catch (refreshError) {
        console.error('Error refreshing stories:', refreshError)
        // If refresh fails, navigate home
        navigate('/')
      }
    } catch (error) {
      console.error('Error creating story:', error)
      toast.error(error.message || 'Failed to create story')
    } finally {
      setLoading(false)
    }
  }
  
  // Always show create story screen if that's what the user wants
  if (isCreating) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={() => setIsCreating(false)}
            className="text-white"
          >
            <FaTimes size={24} />
          </button>
          <h2 className="text-white text-lg font-bold">Create Story</h2>
          <div className="w-6"></div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {imagePreview ? (
            <div className="relative w-full max-w-md aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-contain"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-2"
              >
                <FaTimes size={16} />
              </button>
              
              <input
                type="text"
                className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white border border-gray-500 rounded-lg px-3 py-2"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          ) : (
            <div className="w-full max-w-md aspect-[9/16] bg-gray-900 rounded-lg flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-800 rounded-full p-4 mb-4"
              >
                <FaCamera size={24} className="text-white" />
              </button>
              <p className="text-white text-center">
                Click to select an image for your story
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <button
            onClick={createStory}
            className="btn btn-primary w-full"
            disabled={loading || !image}
          >
            {loading ? 'Creating Story...' : 'Share Story'}
          </button>
        </div>
      </div>
    )
  }
  
  if (fetchingStories) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="text-white">Loading stories...</p>
      </div>
    )
  }
  
  // If there are no stories or we're not viewing a story, show the create story option
  if (!activeStoryGroup || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <p className="text-white mb-4">No stories available</p>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary"
        >
          Create Your First Story
        </button>
      </div>
    )
  }
  
  // We have stories to display
  const currentStory = activeStoryGroup.stories[activeStoryIndex]
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Story header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-800 overflow-hidden mr-3">
              {activeStoryGroup.user.avatar_url ? (
                <img 
                  src={activeStoryGroup.user.avatar_url} 
                  alt={activeStoryGroup.user.plate_number} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                  {activeStoryGroup.user.plate_number.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-bold">
                {activeStoryGroup.user.plate_number}
              </p>
              <p className="text-gray-300 text-xs">
                {new Date(currentStory.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Add story button */}
            <button 
              onClick={() => setIsCreating(true)}
              className="text-white mr-4"
            >
              <FaPlus size={20} />
            </button>
            
            {/* Close button */}
            <button 
              onClick={() => navigate('/')}
              className="text-white"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>
        
        {/* Progress bars */}
        <div className="flex space-x-1 mt-4">
          {activeStoryGroup.stories.map((story, index) => (
            <div 
              key={story.id} 
              className="h-1 bg-gray-700 flex-1 rounded-full overflow-hidden"
            >
              <div 
                className={`h-full bg-white ${
                  index < activeStoryIndex 
                    ? 'w-full' 
                    : index > activeStoryIndex 
                      ? 'w-0' 
                      : ''
                }`}
                ref={index === activeStoryIndex ? progressRef : null}
              ></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Story content */}
      <div className="flex-1 relative">
        {currentStory && currentStory.image_url ? (
          <img 
            src={currentStory.image_url} 
            alt="Story" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x800?text=Image+Not+Available';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <p className="text-white">Image not available</p>
          </div>
        )}
        
        {currentStory && currentStory.caption && (
          <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
            {currentStory.caption}
          </div>
        )}
        
        {/* Navigation buttons */}
        <button 
          onClick={goToPrevStory}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-2"
        >
          <FaChevronLeft size={20} />
        </button>
        
        <button 
          onClick={goToNextStory}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-2"
        >
          <FaChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

export default Stories
