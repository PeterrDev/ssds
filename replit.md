# Permission Manager - Mobile PWA

## Overview

This is a mobile-first Progressive Web App (PWA) designed to handle and demonstrate web permissions with a clean, modern UI. The application provides an educational interface for users to understand and grant various browser permissions including camera, microphone, location, and storage access. Built with React, TypeScript, and modern web technologies, it features a Material Design-inspired interface with full dark/light mode support and responsive design optimized for mobile devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React 18 with TypeScript, organized in a component-based architecture. The app uses a single-page application (SPA) pattern with multiple screen states managed through React hooks. Key architectural decisions include:

- **Component Structure**: Modular components organized by functionality (screens, UI components, hooks)
- **State Management**: React hooks for local state management with custom hooks for complex logic
- **Styling**: Tailwind CSS with a custom design system based on Material Design principles
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessibility and consistency
- **PWA Features**: Service worker implementation with caching strategies and offline support

### Backend Architecture
The server-side follows a minimal Express.js architecture with TypeScript:

- **Framework**: Express.js with middleware-based request handling
- **Development Setup**: Vite integration for hot module replacement and development server
- **Storage Interface**: Abstracted storage layer with in-memory implementation (MemStorage)
- **API Structure**: RESTful API design with centralized route registration

### Data Storage Solutions
The application uses a flexible storage abstraction pattern:

- **Primary Storage**: In-memory storage for development and testing
- **Database Integration**: Drizzle ORM configured for PostgreSQL with Neon Database serverless driver
- **Schema Management**: Type-safe database schemas with Zod validation
- **Migration Strategy**: Drizzle Kit for database schema migrations

### Authentication and Authorization
Currently implements a basic user management system:

- **User Model**: Simple username/password structure with UUID primary keys
- **Storage Operations**: CRUD operations for user management
- **Session Management**: Prepared for session-based authentication with connect-pg-simple

### Theming and Design System
Material Design 3 inspired theming system:

- **Theme Provider**: React context-based theme management with localStorage persistence
- **Color System**: CSS custom properties with light/dark mode variants
- **Typography**: Roboto font family with consistent sizing scales
- **Component Library**: Custom components built on Radix UI primitives

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with concurrent features
- **Express.js**: Backend web framework for Node.js
- **TypeScript**: Type safety across the entire application
- **Vite**: Build tool and development server

### Database and ORM
- **Drizzle ORM**: Type-safe database operations and schema management
- **@neondatabase/serverless**: PostgreSQL serverless database driver
- **Drizzle Kit**: Database migration and introspection tools

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating variant-based component APIs

### State Management and Data Fetching
- **@tanstack/react-query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **@hookform/resolvers**: Form validation resolvers

### Development and Build Tools
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

### PWA and Mobile Features
- **Service Worker**: Custom service worker for caching and offline support
- **Web Manifest**: PWA manifest for app-like experience
- **Permission APIs**: Browser permission handling for camera, microphone, location

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **cmdk**: Command palette component
- **nanoid**: URL-safe unique string generator