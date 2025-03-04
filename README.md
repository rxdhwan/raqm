# RAQM - UAE Car Enthusiast Social Network

RAQM is a social media platform for car enthusiasts in the UAE, where users' primary identity is their car number plate. The platform requires Mulkiya ID verification during signup to ensure authenticity.

## Features

- **Authentication**: Sign up and sign in with email/password
- **Mulkiya Verification**: Scan and verify Mulkiya ID during registration
- **User Profiles**: Display car plate number, personal information, and posts
- **Feed**: View posts from followed users
- **Posts**: Share text and images with the community
- **Stories**: Share temporary content that expires after 24 hours
- **Follow System**: Follow other users to see their content
- **Private Chat**: Direct messaging between users
- **Search**: Find users by their car plate number
- **Phone Number Display**: Option to show phone number on profile

## Tech Stack

- **Frontend**: React with Vite
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Project Structure

```
/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility functions and API clients
│   ├── pages/           # Page components
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   ├── store.js         # Global state management
│   └── index.css        # Global styles
├── supabase/
│   └── schema.sql       # Database schema
└── package.json         # Project dependencies and scripts
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a Supabase project and set up the database using the schema in `supabase/schema.sql`
4. Create the required storage buckets in Supabase
5. Update the Supabase URL and anon key in `src/lib/supabase.js`
6. Start the development server: `npm run dev`

## Database Schema

The application uses the following main tables:

- `profiles`: User profiles with car plate information
- `posts`: User posts with text and optional images
- `comments`: Comments on posts
- `likes`: Post likes
- `follows`: User follow relationships
- `stories`: Temporary user stories
- `chats`: Chat conversations
- `chat_participants`: Participants in each chat
- `messages`: Individual chat messages

## Deployment

To build the application for production:

```
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## License

This project is private and confidential.
