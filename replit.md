# Raw Material Supplier Platform for Street Vendors

## Overview

This is a full-stack web application that connects street vendors with raw material suppliers. The platform allows vendors to order daily supplies with bulk discounts, suppliers to view aggregated demand and offer materials, and administrators to manage the entire ecosystem. The application features real-time ordering, inventory management, and delivery coordination.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: React Context for authentication and cart management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based authentication
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Middleware**: Custom authentication and authorization middleware

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Connection**: Neon serverless connection pooling
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- JWT-based authentication with role-based access control
- Three user roles: vendor, supplier, admin
- Password hashing with bcrypt
- Protected routes based on user permissions
- Token storage in localStorage with automatic refresh

### Product Management
- Comprehensive product catalog with categories
- Bulk discount pricing system with configurable thresholds
- Image support for product visualization
- Unit-based pricing (kg, L, pieces, etc.)
- Active/inactive product status management

### Order Management
- Shopping cart functionality with real-time calculations
- Bulk discount application during ordering
- Order status tracking (pending, confirmed, processing, dispatched, delivered, cancelled)
- Order history with reorder capabilities
- Delivery address management

### Supply Chain Management
- Daily demand aggregation across all vendor orders
- Supply offer system for suppliers to respond to demand
- Special request handling for unavailable items
- Supplier response system for custom requests
- Inventory tracking and fulfillment management

### Role-Based Dashboards
- **Vendor Portal**: Product browsing, cart management, order history, special requests
- **Supplier Portal**: Demand viewing, supply offers, special request responses, analytics
- **Admin Panel**: User management, product management, order oversight, system analytics

## Data Flow

### Order Processing Flow
1. Vendor browses products and adds items to cart
2. System calculates bulk discounts and total pricing
3. Vendor submits order with delivery details
4. Order is aggregated into daily demand calculations
5. Suppliers view aggregated demand and submit supply offers
6. Admin coordinates fulfillment and dispatch
7. Orders are delivered and status updated

### Authentication Flow
1. User registers with role selection (vendor/supplier)
2. System validates credentials and creates JWT token
3. Token is stored client-side and included in API requests
4. Server middleware validates token and extracts user context
5. Role-based access control restricts feature access

### Special Request Flow
1. Vendor submits special request for unavailable items
2. Request is visible to all suppliers
3. Suppliers submit responses with availability and pricing
4. Vendor selects preferred supplier response
5. Special order is processed through regular fulfillment

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: Real-time database connections via ws library

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool with HMR support
- **ESBuild**: JavaScript bundler for production builds
- **Replit Integration**: Development environment integration

### Authentication & Security
- **bcrypt**: Password hashing and verification
- **jsonwebtoken**: JWT token generation and validation
- **Zod**: Runtime type validation for API inputs

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Express server with automatic restart via tsx
- Database schema syncing with Drizzle Kit
- Replit-specific development tooling integration

### Production Build
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Static file serving from Express for production deployment
- Environment variable configuration for database and JWT secrets

### Database Management
- Schema definitions in shared TypeScript files
- Drizzle migrations in `./migrations` directory
- Database URL configuration via environment variables
- Push-based schema updates with `db:push` command

The application follows a monorepo structure with shared TypeScript schemas between frontend and backend, ensuring type safety across the entire stack. The modular architecture supports easy feature extension and role-based customization.