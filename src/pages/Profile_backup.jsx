import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaUserEdit, FaEnvelope, FaPhone, FaLock, FaHeart, FaComment, FaEllipsisH } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const Profile = () => {
  const { plateNumber } = useParams()
  const { user } = useStore()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  
  const isOwnProfile = profile?.id === user?.id
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        
        // Get profile by plate number
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('plate_number', plateNumber)
          .single()
        
        if (profileError) throw profileError
        
        setProfile(profileData)
        
        // Check if current user is following this profile
        if (user.id !== profileData.id) {
          const { data: followData } = await supabase
            .from('follows')
            .select()
            .eq('follower_id', user.id)
            .eq('following_id', profileData.id)
            .single()
          
          setIsFollowing(!!followData)
        }
        
        // Get followers count
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', profileData.id)
        
        setFollowersCount(followers)
        
        // Get following count
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', profileData.id)
        
        setFollowingCount(following)
        
        // Get user posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
        
        setPosts(postsData || [])
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [plateNumber, user.id])
  
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
        
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
        toast.success(`Unfollowed ${profile.plate_number}`)
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          })
        
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        toast.success(`Following ${profile.plate_number}`)
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      toast.error('Action failed')
    }
  }
  
  const handleDeletePost = async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      setPosts(posts.filter(post => post.id !== postId))
      toast.success('Post deleted')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-gray-500">The plate number you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    )
  }
  
  return (
    <div className="pb-16">
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden mb-4 sm:mb-0 sm:mr-6">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.plate_number} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold text-2xl">
                  {profile.plate_number.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{profile.plate_number}</h1>
              <p className="text-gray-600 mb-2">{profile.full_name}</p>
              
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}
              
              <div className="flex justify-center sm:justify-start space-x-6 mb-4">
                <div className="text-center">
                  <div className="font-bold">{posts.length}</div>
                  <div className="text-gray-500 text-sm">Posts</div>
                </div>
                
                <div className="text-center">
                  <div className="font-bold">{followersCount}</div>
                  <div className="text-gray-500 text-sm">Followers</div>
                </div>
                
                <div className="text-center">
                  <div className="font-bold">{followingCount}</div>
                  <div className="text-gray-500 text-sm">Following</div>
                </div>
              </div>
              
              <div className="flex justify-center sm:justify-start space-x-3">
                {isOwnProfile ? (
                  <Link to="/profile/edit" className="btn btn-outline">
                    <FaUserEdit className="mr-2" />
                    Edit Profile
                  </Link>
                ) : (
                  <>
                    <button 
                      onClick={handleFollow}
                      className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    
                    <Link to={`/chat/${profile.id}`} className="btn btn-outline">
                      <FaEnvelope className="mr-2" />
                      Message
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {profile.show_phone_number && profile.phone_number && (
            <div className="mt-4 flex items-center text-gray-600">
              <FaPhone className="mr-2" />
              <span>{profile.phone_number}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4 border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'posts' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'photos' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
        </div>
      </div>
      
      {activeTab === 'posts' ? (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No posts yet.</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="card">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.plate_number} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                            {profile.plate_number.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{profile.plate_number}</h3>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {isOwnProfile && (
                      <div className="relative group">
                        <button className="text-gray-500 hover:text-gray-700">
                          <FaEllipsisH />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="mb-4">{post.content}</p>
                  
                  {post.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-gray-500 text-sm">
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <FaHeart className="mr-1" />
                        <span>{post.likes_count || 0}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <FaComment className="mr-1" />
                        <span>{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.filter(post => post.image_url).length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500">No photos yet.</p>
            </div>
          ) : (
            posts
              .filter(post => post.image_url)
              .map(post => (
                <div key={post.id} className="aspect-square">
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
          )}
        </div>
      )}
    </div>
  )
}

export default Profile
