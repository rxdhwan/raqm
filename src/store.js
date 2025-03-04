import { create } from 'zustand'

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  // Feed state
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  removePost: (postId) => set((state) => ({ 
    posts: state.posts.filter(post => post.id !== postId) 
  })),
  
  // Stories state
  stories: [],
  setStories: (stories) => set({ stories }),
  clearStories: () => set({ stories: [] }),
  
  // Chat state
  chats: [],
  setChats: (chats) => set({ chats }),
  activeChat: null,
  setActiveChat: (activeChat) => set({ activeChat }),
  
  // Search state
  searchResults: [],
  setSearchResults: (searchResults) => set({ searchResults }),
  
  // UI state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
