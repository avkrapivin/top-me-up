# TopMeUp

TopMeUp is a community-driven web application for creating and sharing top-10 lists of movies, music, and games. Users can build personalized lists, share them publicly, interact through comments and likes, and discover content from other users.

## Features

- **Public & Private Lists**: Create top-10 lists with custom titles, descriptions, and categories (movies, music, games)
- **Social Authentication**: Sign up/login via Email/Password, Google (Firebase Authentication)
- **Social Interactions**: Like lists and comments, view engagement metrics (views, likes, comments count)
- **Comments System**: Nested comment threads, edit/delete own comments, "edited" badge, confirmation modal for deletions
- **Explore Page**: Browse public lists with category filters, "My Lists" filter, clickable author names, masonry layout
- **Dashboard**: Personal lists management with fade-in animations and responsive masonry layout
- **Public List View**: Share links, "Copy Link" button, full comment section, skeleton loaders
- **UI/UX Enhancements**: 
  - Skeleton loaders instead of spinners
  - Fade-in animations for cards
  - Improved hover effects
  - Empty states with custom icons
  - Top-centered toast notifications
  - Centralized error handling with NetworkError component
  - Lazy-loaded images

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite 7
- **Routing**: React Router 7
- **State Management**: Zustand (auth), React Query 5 (server state)
- **Styling**: Tailwind CSS 4 with dark mode support
- **Authentication**: Firebase Authentication (Email/Password, Google)
- **HTTP Client**: Axios with interceptors for token refresh
- **UI Components**: Custom components (Skeleton, EmptyState, NetworkError, Toast, ConfirmModal)

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase JWT verification middleware
- **External APIs**: 
  - TMDB (movies)
  - Spotify (music)
  - RAWG (games)
- **Features**: Pagination, rate limiting, error handling, logging


## Project Structure

### Frontend Structure (`frontend/`)

```
frontend/
├── public/
│   ├── topmeup-icon.svg          # Favicon
│   └── vite.svg                  # Default Vite icon (can be removed)
├── src/
│   ├── assets/                   # Static assets
│   ├── components/
│   │   ├── Auth/                 # Login/Register forms, ProtectedRoute
│   │   ├── Export/               # Export functionality
│   │   ├── Layout/               # Layout wrapper
│   │   ├── Lists/                # ListCard, ListBuilder, ShareButton, ExportModal
│   │   ├── Navigation/            # Navigation bar
│   │   ├── Search/               # SearchBox, ContentCard
│   │   ├── Social/               # CommentsSection, CommentItem, LikeButton, PublicShareButton
│   │   └── UI/                   # Skeleton, EmptyState, NetworkError, Toast, ConfirmModal
│   ├── config/
│   │   └── firebase.js           # Firebase configuration
│   ├── contexts/
│   │   └── ToastContext.jsx      # Toast notification context
│   ├── hooks/
│   │   ├── useAuth.js            # Auth hook wrapper
│   │   ├── useAuthApi.js         # Auth API hooks (React Query)
│   │   ├── useListApi.js         # List API hooks (React Query)
│   │   └── useSearchApi.js       # Search API hooks
│   ├── pages/
│   │   ├── Dashboard.jsx         # User's lists
│   │   ├── Explore.jsx          # Public lists browser
│   │   ├── Home.jsx             # Landing page
│   │   ├── ListBuilder.jsx     # List creation/editing
│   │   ├── Profile.jsx         # User profile settings
│   │   └── PublicList.jsx       # Public list view (by share token)
│   ├── routes/
│   │   └── AppRoutes.jsx       # Route definitions
│   ├── services/
│   │   └── api.js              # Axios instance with interceptors
│   ├── store/
│   │   └── authStore.js        # Zustand auth store
│   ├── utils/
│   │   └── errorUtils.js       # Centralized error handling utilities
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles (Tailwind + custom)
├── index.html                  # HTML template
├── package.json
└── vite.config.js
```

### Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── rawg.js              # RAWG API config
│   │   ├── spotify.js           # Spotify API config
│   │   └── tmdb.js              # TMDB API config
│   ├── controllers/
│   │   ├── authController.js    # Authentication endpoints
│   │   ├── commentController.js # Comment CRUD operations
│   │   ├── listController.js    # List CRUD, public lists, likes
│   │   ├── searchController.js  # Search functionality
│   │   └── statisticsController.js # Statistics endpoints
│   ├── middleware/
│   │   ├── asyncHandler.js      # Async error wrapper
│   │   ├── auth.js              # Firebase JWT verification
│   │   ├── errorHandler.js      # Global error handler
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── resourceLoader.js    # Resource loading middleware
│   │   └── roleCheck.js         # Role-based access control
│   ├── models/
│   │   ├── Comment.js           # Comment schema
│   │   ├── List.js              # List schema
│   │   ├── Statistics.js        # Statistics schema
│   │   ├── User.js              # User schema
│   │   └── index.js             # Model exports
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── comments.js         # Comment routes
│   │   ├── lists.js            # List routes
│   │   ├── proxy.js            # Proxy routes (external APIs)
│   │   ├── search.js           # Search routes
│   │   ├── statistics.js       # Statistics routes
│   │   └── index.js            # Route aggregator
│   ├── services/
│   │   ├── external/
│   │   │   ├── baseService.js  # Base external API service
│   │   │   ├── rawgService.js  # RAWG API service
│   │   │   ├── spotifyService.js # Spotify API service
│   │   │   └── tmdbService.js  # TMDB API service
│   │   └── searchService.js    # Search service
│   ├── utils/
│   │   ├── apiValidator.js     # API validation utilities
│   │   ├── cache.js            # Caching utilities
│   │   ├── errors.js           # Error classes
│   │   ├── logger.js           # Logging utilities
│   │   ├── paginationHelper.js # Pagination utilities
│   │   ├── responseHelper.js   # Response formatting
│   │   ├── retry.js            # Retry logic
│   │   ├── userHelper.js       # User utilities
│   │   └── validationHelper.js # Validation utilities
│   └── server.js               # Express server setup
├── tests/                      # Test files
├── logs/                       # Application logs
└── package.json
```


## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Firebase project with Authentication enabled
- API keys for TMDB, Spotify, RAWG (for search functionality)

### Frontend Setup

1. **Install dependencies**:
```
   cd frontend
   npm install
```

2. **Configure environment variables**:
   Create `frontend/.env`:
```
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
```
   
3. **Configure Firebase**:
   - Copy Firebase web config to `frontend/src/config/firebase.js`
   - Enable Email/Password, Google, and Facebook providers in Firebase Console

4. **Run development server**:
   `npm run dev`
      Visit `http://localhost:5173`

### Backend Setup

1. **Install dependencies**:
```   
   cd backend
   npm install
```

2. **Configure environment variables**:
   Create `backend/.env`:
```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/topmeup
   FIREBASE_PROJECT_ID=your-project-id
   TMDB_API_KEY=your-tmdb-key
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
   RAWG_API_KEY=your-rawg-key
```

3. **Start MongoDB** (if running locally)

4. **Run development server**:
   `npm run dev`
   

## Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

## Firebase Authentication Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project

2. **Enable Authentication Providers**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password**
   - Enable **Google** (add authorized domains)

3. **Copy Web Config**:
   - Go to Project Settings → General → Your apps
   - Copy Firebase config object to `frontend/src/config/firebase.js`

## Key Features Implementation

### Centralized Error Handling
- `errorUtils.js` provides `isNetworkError()` and `getErrorMessage()` functions
- `NetworkError` component uses these utilities for consistent error messages
- All error states use the same component for unified UX

### React Query Caching
- User lists: 30s stale time
- Public lists: 60s stale time, no auto-refetch on window focus
- Individual lists: 5 minutes stale time
- Comments: Infinite query with cursor-based pagination

### Image Optimization
- Lazy loading with `loading="lazy"` and `decoding="async"` attributes
- Placeholder images for missing posters
- Responsive image sizing based on category

### UI Components
- **Skeleton Loaders**: Replace spinners for better perceived performance
- **Empty States**: Custom icons and messages with action buttons
- **Toast Notifications**: Top-centered, stackable, auto-dismiss
- **Confirm Modal**: Reusable modal for destructive actions

## License

MIT

---

For detailed API documentation, see backend README or API endpoint documentation.