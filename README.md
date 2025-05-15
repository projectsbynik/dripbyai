# ProjectZ Documentation

## Overview
ProjectZ is an AI-powered fashion and makeup recommendation platform that provides personalized style suggestions based on user characteristics. The application uses advanced AI algorithms to analyze user features and provide tailored recommendations for clothing and makeup products.

## Features

### 1. User Authentication
- Email-based signup with verification
- Secure password management with reset functionality
- Session management using Supabase Auth
- Role-based access (Admin/User)

### 2. Profile Management
- Unique 12-digit alphanumeric profile ID
- Two profile creation methods:
  - AI Analysis (Image-based)
  - Manual Data Entry
- Profile customization options
- Multiple profile support per user

### 3. AI Analysis Features
- Skin tone analysis from face close-up
- Undertone detection
- Body shape analysis from full-body images
- Real-time analysis status tracking
- Support for image upload and processing

### 4. Manual Profile Creation
- Comprehensive form with:
  - Basic information (name, age, gender)
  - Country selection (USA, India, UK)
  - Skin tone selection
  - Undertone selection with visual guides
  - Body shape selection with detailed descriptions
  - Gender-specific body shape options

### 5. Search and Recommendations
- Natural language search interface
- Template-based search: "I want to buy [Product] for [Profile]"
- Advanced filtering options:
  - Price range
  - Sort by price/popularity
  - Occasion-based filtering
- Product recommendations with:
  - Product images
  - Pricing information
  - Best fit occasions
  - Affiliate purchase links

### 6. Admin Features
- User management
- Product management
- Audit logging
- Admin console interface

## Technical Stack

### Frontend
- React 18 with TypeScript
- Vite as build tool
- TailwindCSS for styling
- Framer Motion for animations
- React Router for navigation
- React Hot Toast for notifications

### Backend
- Supabase for:
  - Authentication
  - Database
  - Storage
  - Real-time updates

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.39.7",
  "framer-motion": "^10.18.0",
  "react-router-dom": "^6.22.2",
  "tailwindcss": "^3.4.1"
}
```

## Project Structure

```
src/
├── components/
│   ├── layout/         # Layout components
│   ├── sections/       # Page sections
│   ├── ui/            # Reusable UI components
│   └── auth/          # Authentication components
├── pages/
│   ├── admin/         # Admin pages
│   └── user/          # User pages
├── context/           # React context providers
├── lib/              # Utility functions
└── styles/           # Global styles
```

## Key Features Implementation

### 1. Authentication Flow
- Secure email verification
- Password reset functionality
- Session management
- Protected routes

### 2. Profile Creation
- Image upload and processing
- AI analysis integration
- Manual data entry validation
- Profile editing capabilities

### 3. Search System
- Natural language processing
- Filter implementation
- Product recommendation algorithm
- Affiliate link integration

### 4. Admin Console
- User management interface
- Product management system
- Audit logging
- Analytics dashboard

## Security Features
- Secure password hashing
- Email verification
- Session management
- Protected routes
- Admin access control

## Performance Optimizations
- Lazy loading of components
- Image optimization
- Caching strategies
- Efficient state management

## Future Enhancements
- Additional country support
- Enhanced AI analysis
- More product categories
- Advanced filtering options
- Mobile application
- Social features

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Supabase account
- Environment variables setup

### Installation
```bash
npm install
npm run dev
```

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
All rights reserved. © ProjectZ 