# Railway Operations Management System

## Overview

This is a comprehensive railway operations management system designed for the South Central Railway (SCR) to handle data synchronization, operational workflows, and terminal detention management. The application provides multi-tab functionality for different operational aspects including goods loading, coaching operations, and planning activities.

## System Architecture

The system follows a modern full-stack architecture with clear separation of concerns:

- **Frontend**: React.js with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with session-based local strategy
- **File Processing**: Excel file import/export capabilities using XLSX library
- **UI Framework**: Tailwind CSS with shadcn/ui component library

## Key Components

### Frontend Architecture
- **Component Structure**: Modular React components organized by feature
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom theming support

### Backend Architecture
- **API Layer**: RESTful API endpoints organized in `/server/routes.ts`
- **Authentication Middleware**: Session-based authentication with role-based access
- **File Upload**: Multer middleware for handling Excel file uploads
- **Data Processing**: Batch processing for large Excel imports with pagination

### Database Schema
- **Railway Loading Operations**: Primary table storing P DATE, station, commodity, wagon details, units, tonnage, and freight information
- **Detentions**: Tracks wagon detention times and reasons
- **Users**: Authentication and role management
- **Interchange Data**: Station-specific train entry data

## Data Flow

1. **Excel Import Flow**: Users upload Excel files → Server validates and processes data in batches → Data is inserted into PostgreSQL with duplicate checking
2. **Authentication Flow**: Login/register → Session creation → Role-based access control
3. **Real-time Updates**: Auto-refresh capabilities for operational data
4. **Report Generation**: Data aggregation → Chart generation → PDF export options

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Google Services**: Google Sheets API and Google Drive API integration for data synchronization
- **Service Account**: Uses Google service account credentials for automated data access

### Third-party Services
- **Google Sheets**: For external data synchronization and collaborative editing
- **Google Drive**: For file storage and automated downloads
- **Charts**: Recharts library for data visualization

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Production bundle optimization

## Deployment Strategy

### Build Process
- **Frontend Build**: Vite builds React application to `dist/public`
- **Backend Build**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates

### Production Configuration
- **Port Configuration**: Server runs on port 5000 (configurable)
- **Environment Variables**: DATABASE_URL, Google credentials, and service account paths
- **Auto-scaling**: Configured for Replit's autoscale deployment target

### Data Management
- **Batch Processing**: Excel imports processed in chunks of 2000 records
- **Progress Tracking**: Import progress stored in JSON files
- **Error Handling**: Comprehensive validation and error reporting

## Changelog
- June 16, 2025. Initial setup
- June 16, 2025. Successfully migrated from Replit Agent to Replit environment
- June 16, 2025. Added editable table functionality to Data Submission page with inline editing capabilities
- June 17, 2025. Implemented Charts tab in Operating Dashboard with yearly comparison bar charts for commodities and stations using Recharts library
- June 17, 2025. Added backend API endpoints for yearly loading data aggregation (/api/yearly-loading-commodities and /api/yearly-loading-stations)
- June 19, 2025. Implemented comprehensive PDF export functionality across the system:
  - Added PDF export buttons to Operating Dashboard (Tables and Charts tabs)
  - Enhanced All Entries page with PDF export capability
  - Created backend PDF generation functions using PDFKit library
  - Fixed authentication issues by implementing direct database queries for PDF exports
  - Added three new API endpoints: /api/exports/comparative-loading-pdf, /api/exports/yearly-comparison-pdf, /api/exports/all-entries-pdf
- June 19, 2025. Added station-wise comparative loading report for May 26-31 period:
  - Created new API endpoint /api/station-comparative-loading for specific date range comparison
  - Built dedicated StationComparativePage component with detailed tabular display
  - Added PDF export functionality matching the format of user's reference document
  - Integrated navigation link in Operations dropdown menu
  - Implemented proper data validation and numeric safety handling

## User Preferences

Preferred communication style: Simple, everyday language.