# CryptoMine Pro

## Overview

CryptoMine Pro is a comprehensive cryptocurrency mining platform that enables users to purchase mining contracts, track earnings, and manage withdrawals. The application features a modern web interface built with React and TypeScript, backed by a Node.js/Express server with PostgreSQL database integration. The platform supports multiple cryptocurrencies, real-time price tracking, and provides both user and admin dashboards for complete mining operation management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript development
- **Authentication**: Replit OAuth integration with session-based auth using express-session
- **API Design**: RESTful endpoints with consistent error handling and request/response patterns
- **Middleware**: Custom logging, JSON parsing, and error handling middleware

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver for scalable cloud database
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Relational model with users, mining plans, contracts, earnings, transactions, and withdrawals
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Migrations**: Drizzle Kit for database schema migrations and version control

### Authentication & Authorization
- **Provider**: Replit OAuth with OpenID Connect (OIDC) for secure authentication
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Authorization**: Role-based access control with admin privileges for management functions
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration

### External Dependencies
- **Database**: Neon PostgreSQL for serverless database hosting
- **Authentication**: Replit OAuth service for user authentication
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono) for typography
- **Icons**: Lucide React for consistent iconography
- **Development**: Replit-specific plugins for development environment integration