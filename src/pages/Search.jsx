import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { FaSearch, FaUser, FaCar } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Search = () => {
  const { user } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    try {
      setLoading(true)
      setHasSearched(true)
      
      // Search for users by plate number or name
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`plate_number.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq('id', user.id) // Exclude current user
        .limit(20)
      
      if (error) throw error
      
      // Check if current user follows each result
      const followPromises = data.map(async (profile) => {
        const { data: followData } = await supabase
          .from('follows')
          .select()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .single()
        
        return {
          ...profile,
          is_following: !!followData
        }
      })
      
      const resultsWithFollowStatus = await Promise.all(followPromises)
      setSearchResults(resultsWithFollowStatus)
    } catch (error) {
      console.error('Error searching:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFollow = async (profileId, isFollowing) => {
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profileId
          })
      }
      
      // Update local state
      setSearchResults(searchResults.map(profile => {
        if (profile.id === profileId) {
          return {
            ...profile,
            is_following: !isFollowing
          }
        }
        return profile
      }))
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      toast.error('Action failed')
    }
  }
  
  return (
    <div className="pb-16">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10 pr-16"
            placeholder="Search by plate number or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-primary py-1 px-3"
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : hasSearched && searchResults.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No results found for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {searchResults.map(profile => (
            <div key={profile.id} className="card p-4">
              <div className="flex items-center justify-between">
                <Link 
                  to={`/profile/${profile.plate_number}`}
                  className="flex items-center flex-1"
                >
                  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4">
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
                    <div className="flex items-center">
                      <h3 className="font-bold">{profile.plate_number}</h3>
                      {profile.is_mulkiya_verified && (
                        <span className="ml-1 text-primary">✓</span>
                      )}
                    </div>
                    <p className="text-gray-600">{profile.full_name}</p>
                  </div>
                </Link>
                
                <button
                  onClick={() => handleFollow(profile.id, profile.is_following)}
                  className={`btn ${profile.is_following ? 'btn-outline' : 'btn-primary'} py-1 px-3`}
                >
                  {profile.is_following ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!hasSearched && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Search Tips</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <FaCar className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Search by Plate Number</h3>
                <p className="text-gray-600">Enter a full or partial plate number to find users</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <FaUser className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Search by Name</h3>
                <p className="text-gray-600">Enter a name to find users by their full name</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
