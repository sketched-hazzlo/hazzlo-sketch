# Overview

Hazzlo is a full-stack web application that connects clients with verified professionals in the Dominican Republic. The platform serves as a marketplace where users can find and hire professionals across various service categories including beauty, technology, home services, automotive, education, health, events, and cleaning. The application features user authentication, professional profiles, service listings, real-time messaging, booking systems, admin management, comprehensive notification system, and a complete live chat support system with moderator authentication and management.

## Recent Development: Friendly URLs and Professional Profile Enhancement

The platform now features a comprehensive friendly URL system for professional profiles:

### Friendly URL System
- **Format**: Professional URLs now use format `/professional/[initials]-[5numbers]` (e.g., `/professional/ag-84729`)
- **Automatic Generation**: Slugs are automatically generated when creating new professional profiles
- **Backward Compatibility**: All routes accept both traditional UUIDs and new friendly slugs
- **Complete Integration**: All professional card components and navigation links use friendly URLs
- **Database Schema**: Added `slug` column to professionals table with unique constraint

### Technical Implementation
- **Backend Routes**: All professional-related API endpoints (`/api/professionals/:id`, `/api/professionals/:id/reviews`, etc.) now resolve both UUID IDs and friendly slugs
- **Frontend Components**: Updated all professional card components to generate friendly URLs automatically
- **Utility Functions**: Created comprehensive URL generation utilities for consistent link creation
- **Chat Integration**: Chat URLs also support friendly slugs (e.g., `/chat?professional=ag-84729`)

### Live Chat Support System with Automatic System Messages

A comprehensive live chat support system has been implemented with:
- Separate moderator authentication system (different from Users table)
- Admin dashboard integration for moderator credential management
- Real-time chat functionality between users and moderators
- Floating chat widget for users when they have active support chats
- Moderator dashboard for managing and responding to support requests
- Complete API infrastructure for chat operations
- **Automatic system messages**: Users receive "Estas a la espera de un agente" when creating chats and "Tu situación ha sido escalada" when chats are escalated
- **System message styling**: Centered messages with distinctive colors - blue for informational, orange for warnings

This system allows users to initiate live support chats from the /ayuda page, moderators to manage these chats through /modsupply, and administrators to manage moderator credentials through /admin/credenciales. The system now provides immediate feedback to users through automated system messages that appear with distinct visual styling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Real-time Communication**: WebSocket server for live chat functionality
- **File Uploads**: Multer middleware for handling image uploads with size and type validation

## Database Layer
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Comprehensive relational schema with users, professionals, services, categories, conversations, messages, reviews, and admin management tables
- **Migrations**: Drizzle Kit for database schema migrations and version control

## Authentication & Authorization
- **Strategy**: Session-based authentication with bcrypt password hashing
- **User Types**: Client and Professional user roles with admin privileges system
- **Security**: Password hashing with salt, CSRF protection, and secure session management
- **Admin System**: Role-based access control with admin dashboard for user management, suspension, and moderation

## Real-time Features
- **Chat System**: WebSocket-based real-time messaging between clients and professionals
- **Notifications**: Real-time notification system for service requests, messages, and system updates
- **Live Updates**: Real-time conversation updates and message status tracking

## File Management
- **Image Storage**: Local file system storage for profile images and business photos
- **Upload Handling**: Multer-based file upload with image validation and size limits
- **Image Processing**: Support for multiple business images with ordering and visibility controls

## Business Logic
- **Service Categories**: Dynamic category system with icons and descriptions
- **Professional Verification**: Multi-step verification process for professional credibility
- **Review System**: Star-based rating and review system for service quality assurance
- **Booking System**: Service request workflow with status tracking
- **Search & Discovery**: Advanced search functionality with category and location filtering

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with connection pooling and automatic scaling

## Frontend Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives for complex components
- **Lucide React**: Modern icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting library with Spanish locale support
- **Framer Motion**: Animation library for smooth UI transitions and interactions

## Backend Services
- **bcryptjs**: Password hashing and verification for secure authentication
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **multer**: File upload middleware for handling multipart form data
- **ws**: WebSocket library for real-time communication features

## Development Tools
- **Drizzle Kit**: Database migration and schema management toolkit
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution engine for development server
- **Vite**: Build tool with hot module replacement and optimized bundling

## Authentication & Validation
- **Passport.js**: Authentication middleware with local strategy implementation
- **Zod**: TypeScript-first schema validation for forms and API endpoints
- **React Hook Form**: Performant form library with built-in validation support

## Styling & UI
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **PostCSS**: CSS processing tool with autoprefixer for browser compatibility
- **CSS Variables**: Dynamic theming system with light/dark mode support