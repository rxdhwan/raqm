import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaHeart, FaComment, FaShare, FaEllipsisH } from 'react-icons/fa'
import { formatDistanceToNow } from 'date-fns'
import PostForm from '../components/PostForm'
import StoriesBar from '../components/StoriesBar'
import toast from 'react-hot-toast'

const Feed = () => {
  const { user, posts, setPosts, removePost } = useStore()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        
        // Get posts from users the current user follows + their own posts
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
        
        const followingIds = followingData?.map(item => item.following_id) || []
        followingIds.push(user.id) // Include user's own posts
        
        const { data, error } = await supabase
          .from('posts')
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
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (error) throw error
        
        setPosts(data)
      } catch (error) {
        console.error('Error fetching posts:', error)
        toast.error('Failed to load posts')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPosts()
    
    // Set up real-time subscription for new posts
    const postsSubscription = supabase
      .channel('public:posts')
      .on('INSERT', (payload) => {
        // Check if the post is from someone the user follows
        const newPost = payload.new
        if (followingIds.includes(newPost.user_id)) {
          // Fetch the user profile for the new post
          supabase
            .from('profiles')
            .select('id, plate_number, full_name, avatar_url')
            .eq('id', newPost.user_id)
            .single()
            .then(({ data: profile }) => {
              const postWithProfile = {
                ...newPost,
                profiles: profile
              }
              setPosts(prevPosts => [postWithProfile, ...prevPosts])
            })
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(postsSubscription)
    }
  }, [user.id])
  
  const handleLike = async (postId) => {
    try {
      // Check if user already liked the post
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
        
        // Update post likes count
        await supabase
          .from('posts')
          .update({ likes_count: supabase.rpc('decrement', { x: 1 }) })
          .eq('id', postId)
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id })
        
        // Update post likes count
        await supabase
          .from('posts')
          .update({ likes_count: supabase.rpc('increment', { x: 1 }) })
          .eq('id', postId)
      }
      
      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const newLikesCount = existingLike 
            ? post.likes_count - 1 
            : post.likes_count + 1
          
          return {
            ...post,
            likes_count: newLikesCount,
            is_liked: !existingLike
          }
        }
        return post
      }))
    } catch (error) {
      console.error('Error liking post:', error)
      toast.error('Failed to like post')
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
      
      removePost(postId)
      toast.success('Post deleted')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }
  
  return (
    <div className="pb-16">
      <StoriesBar />
      
      <PostForm />
      
      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts yet. Follow more users or create your first post!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="card">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Link 
                    to={`/profile/${post.profiles.plate_number}`}
                    className="flex items-center"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                      {post.profiles.avatar_url ? (
                        <img 
                          src={post.profiles.avatar_url} 
                          alt={post.profiles.plate_number} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                          {post.profiles.plate_number.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{post.profiles.plate_number}</h3>
                      <p className="text-xs text-gray-500">{post.profiles.full_name}</p>
                    </div>
                  </Link>
                  
                  <div className="relative">
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaEllipsisH />
                    </button>
                    {post.user_id === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete Post
                        </button>
                      </div>
                    )}
                  </div>
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
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center ${post.is_liked ? 'text-red-500' : ''}`}
                    >
                      <FaHeart className="mr-1" />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    
                    <Link 
                      to={`/comments/${post.id}`}
                      className="flex items-center"
                    >
                      <FaComment className="mr-1" />
                      <span>{post.comments_count || 0}</span>
                    </Link>
                  </div>
                  
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Feed
