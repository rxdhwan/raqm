import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaPlus } from 'react-icons/fa'

const StoriesBar = () => {
  const { user, stories, setStories } = useStore()
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    const fetchStories = async () => {
      try {
        if (!user || !user.id) return;
        
        setLoading(true)
        
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
        
        if (error) throw error
        
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
        
        setStories(Object.values(groupedStories))
      } catch (error) {
        console.error('Error fetching stories:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStories()
  }, [user, setStories])
  
  const handleAddStory = () => {
    // Navigate to stories page and set isCreating to true
    navigate('/stories', { state: { isCreating: true } });
  }
  
  if (loading) {
    return (
      <div className="flex overflow-x-auto py-4 space-x-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-gray-200"></div>
            <div className="h-2 w-12 mt-2 mx-auto rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="flex overflow-x-auto py-4 space-x-4 no-scrollbar">
      {/* Add story button */}
      <div 
        onClick={handleAddStory}
        className="flex-shrink-0 w-16 cursor-pointer"
      >
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <FaPlus className="text-gray-400" />
        </div>
        <p className="text-xs text-center mt-1 text-gray-500">Add Story</p>
      </div>
      
      {/* Stories */}
      {stories.map((storyGroup) => (
        <Link 
          key={storyGroup.user.id} 
          to="/stories"
          className="flex-shrink-0 w-16"
        >
          <div className="h-16 w-16 rounded-full border-2 border-primary p-0.5">
            <div className="h-full w-full rounded-full overflow-hidden">
              {storyGroup.user.avatar_url ? (
                <img 
                  src={storyGroup.user.avatar_url} 
                  alt={storyGroup.user.plate_number} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${storyGroup.user.plate_number}&background=1E40AF&color=fff`;
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                  {storyGroup.user.plate_number.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-center mt-1 truncate">
            {storyGroup.user.plate_number}
          </p>
        </Link>
      ))}
    </div>
  )
}

export default StoriesBar
