# Railway Operations Management System

## Overview
This project is a comprehensive railway operations management system for South Central Railway (SCR), focusing on data synchronization, operational workflows, and terminal detention management. It features multi-tab functionality for goods loading, coaching operations, and planning, aiming to streamline railway operations and provide robust reporting and analysis capabilities. The system supports detailed tracking of railway loading operations, detention times, and interchange data, with a vision to enhance efficiency and data-driven decision-making in railway management.

## User Preferences
Preferred communication style: Simple, everyday language.
User confirmed satisfaction with current implementation: "till now everything is fine thank you" (June 25, 2025)

## System Architecture
The system employs a modern full-stack architecture. The frontend is built with **React.js** and **TypeScript** using **Vite**, styled with **Tailwind CSS** and **shadcn/ui**. State management is handled by **TanStack Query**, routing by **Wouter**, and form handling by **React Hook Form** with **Zod** validation.

The backend is an **Express.js** server with **TypeScript**, implementing RESTful APIs. It utilizes **Passport.js** for session-based authentication with role-based access, and **Multer** for file uploads. Data processing includes batch operations for Excel imports.

**PostgreSQL** serves as the database, managed with **Drizzle ORM** for type-safe operations. Key database schemas include `Railway Loading Operations`, `Detentions`, `Users`, and `Interchange Data`.

The system supports a comprehensive data flow including Excel import, authentication with role-based access, real-time data updates, and report generation with PDF export capabilities. UI/UX emphasizes a glassy design theme, professional railway branding for reports, and interactive dashboards with charts and tables. Key features include:
- Multi-tab operational dashboards with yearly, daily, and monthly trend analysis.
- Dynamic charting with Recharts for visualizing tonnage, operations, commodity, and station trends.
- Comprehensive custom reporting with date range selection, column sorting, and dynamic formula display.
- Professional PDF and CSV export functionalities for all reports, including customizable exports with column selection.
- Data synchronization between charts and tables with auto-refresh and manual refresh options.
- Enhanced number formatting for readability across the application and in exports.
- Glassmorphic design elements for login and dashboard interfaces, incorporating railway branding.

## External Dependencies
- **Database**: PostgreSQL
- **Google Services**: Google Sheets API, Google Drive API (for data synchronization and automated downloads)
- **Service Account**: Google service account credentials for automated data access.
- **Charts**: Recharts (for data visualization)
- **PDF Generation**: PDFKit (for backend PDF creation)
- **Excel Processing**: XLSX library (for Excel file import/export)
- **Development Tools**: Drizzle Kit (for database migrations), TypeScript, ESBuild.