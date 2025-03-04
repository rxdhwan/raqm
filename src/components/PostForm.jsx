import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaCamera, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const PostForm = () => {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const { user, addPost } = useStore()
  
  // Create the required buckets if they don't exist
  const createBucketIfNotExists = async (bucketName) => {
    try {
      console.log(`Checking if bucket '${bucketName}' exists...`)
      
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error(`Error listing buckets:`, listError)
        return false
      }
      
      console.log(`Found ${buckets.length} buckets:`, buckets.map(b => b.name))
      const bucketExists = buckets.some(bucket => bucket.name === bucketName)
      
      if (!bucketExists) {
        console.log(`Bucket '${bucketName}' does not exist, creating it...`)
        // Create the bucket
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true
        })
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error)
          return false
        }
        console.log(`Bucket ${bucketName} created successfully`)
      } else {
        console.log(`Bucket '${bucketName}' already exists`)
      }
      return true
    } catch (error) {
      console.error(`Error checking/creating bucket ${bucketName}:`, error)
      return false
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
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && !image) {
      toast.error('Please add some content or an image')
      return
    }
    
    try {
      setLoading(true)
      
      let imageUrl = null
      
      // Upload image if exists
      if (image) {
        // Create bucket if it doesn't exist
        const bucketName = 'post_images'
        const bucketCreated = await createBucketIfNotExists(bucketName)
        
        if (!bucketCreated) {
          throw new Error('Failed to create or access storage bucket')
        }
        
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
        
        imageUrl = data.publicUrl
      }
      
      // Create post
      const newPost = {
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert(newPost)
        .select(`
          *,
          profiles:user_id (
            id,
            plate_number,
            full_name,
            avatar_url
          )
        `)
        .single()
      
      if (error) throw error
      
      // Add to local state
      addPost(data)
      
      // Reset form
      setContent('')
      setImage(null)
      setImagePreview(null)
      
      toast.success('Post created successfully!')
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="card p-4 mt-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
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
          
          <div className="flex-1">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder={`What's on your mind, ${user?.plate_number}?`}
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            ></textarea>
            
            {imagePreview && (
              <div className="relative mt-2 rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-auto max-h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-primary"
                  disabled={loading}
                >
                  <FaCamera size={20} />
                </button>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (!content.trim() && !image)}
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PostForm
