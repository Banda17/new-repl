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
- June 19, 2025. Implemented glassy login page design:
  - Added Vijayawada railway station image as full-screen background
  - Created glassmorphism effect with backdrop-blur and semi-transparent elements
  - Updated all text and form elements to white for visibility
  - Enhanced UI with professional railway operations branding
  - Added static file serving for attached assets in server configuration
- June 19, 2025. Enhanced dashboard readability with hybrid glassmorphic design:
  - Fixed chart text colors to white for better visibility against glassmorphic backgrounds
  - Updated chart axes, grid lines, and legends with white/transparent styling
  - Implemented clean white table backgrounds with dark text for optimal readability
  - Maintained glassmorphic card containers while ensuring data tables remain highly readable
  - Balanced aesthetic appeal with practical usability for data analysis
  - Fixed all tab navigation text to white with proper active/hover states
  - Updated Railway Reports page with white text for all headings and form labels
- June 24, 2025. Enhanced PDF reports with professional design and Indian Railway branding:
  - Completely redesigned comparative loading PDF with modern layout and proper alignment
  - Fixed header text positioning, table column widths, and summary section formatting
  - Integrated authentic Indian Railway logo in all PDF report headers and footers
  - Updated all PDF generation functions (comparative, yearly, station, all entries) with consistent branding
  - Improved typography, color schemes, and visual hierarchy across all reports
  - Added fallback handling for logo display and enhanced professional appearance
- June 25, 2025. Added current period trend analysis with switchable time views:
  - Created new "Trends" tab in dashboard with daily/monthly toggle
  - Added four line charts: Tonnage trend, Operations count, Top commodities trend, Top stations trend
  - Implemented backend APIs for daily (last 30 days) and monthly (last 12 months) trend data
  - Charts feature clear date visualization with proper formatting and interactive tooltips
  - Fixed average per day calculation issue (was dividing by 3 instead of 2 days)
  - Removed freight column from both comparative loading tables and PDF reports
  - Enhanced user experience with responsive design and glassmorphic styling
- June 26, 2025. Enhanced chart displays with comprehensive date ranges and legends:
  - Added specific date range displays for all trend charts showing exact periods
  - Implemented legends for all charts including single-line charts (tonnage trend, operations count)
  - Fixed tonnage data conversion from strings to numbers for proper chart scaling
  - Updated yearly charts to show current year context
  - Enhanced Tables tab to display actual comparison periods from API data
  - Improved chart readability with descriptive legend names and proper formatting
  - Enhanced yearly commodity and station charts with duration context information
  - Added "Full year duration analysis" descriptions to provide temporal context for yearly data
  - Improved chart readability with consistent year indicators and duration information
  - Replaced operations count chart with wagon distribution pie chart showing commodity-wise wagon breakdown
  - Added comparative performance chart displaying current vs previous period data for top commodities and stations
  - Enhanced trends section with more meaningful visualizations aligned with operational requirements
  - Fixed comparative performance chart by enabling data queries for charts tab
  - Added comprehensive duration information to all chart descriptions across dashboard
  - Enhanced chart context with specific time periods and duration details for better operational understanding
  - Modified comparative performance chart to show "top 5 & others" grouping for improved readability and data summarization
  - Fixed critical JSX syntax errors in DashboardPage.tsx causing application crashes
  - Added station-wise comparative loading table alongside existing commodity table in Tables tab
  - Both comparative tables now show current vs previous period data with totals and PDF export functionality
  - Enhanced number formatting: Avg/Day and MT columns now show 3 decimal places, wagon numbers display specific values with commas (not K format)
  - Added variation columns to station table showing change in MT and percentage with color-coded indicators
  - Updated all trend chart duration information to display consistent date ranges (27/05/2025 to 26/06/2025) matching table data periods
  - Added comprehensive duration context to yearly comparison charts showing annual performance analysis for 2025
  - Restructured trend charts: removed generic daily data descriptions and created dedicated daily commodity and station comparison charts
  - Added duration information directly in chart legends showing year-over-year comparison periods (2025 vs 2024)
  - Converted daily comparison charts to bar chart format for clearer period-to-period comparison visualization
  - Corrected comparison periods to show proper year-over-year analysis: current period (24-26 Jun 2025) vs previous period (24-26 Jun 2024)
- June 26, 2025. Implemented comprehensive data synchronization between charts and tables:
  - Removed conditional data loading based on active tabs - all data sources now load simultaneously
  - Added automatic refresh intervals (30 seconds) and reduced stale time (10 seconds) for real-time updates
  - Created data transformation functions to ensure charts and tables use identical synchronized data sources
  - Updated Daily Commodities and Daily Stations charts to dynamically pull data from comparative loading APIs
  - Added manual "Refresh Data" button in dashboard header for immediate data synchronization
  - Pie chart already uses synchronized commodity data from yearly loading API
  - All components now reflect real-time data changes immediately across both charts and tables tabs
- June 26, 2025. Enhanced yearly comparison charts for better readability and meaningful analysis:
  - Restructured "Yearly Comparison Charts" into "Yearly Performance Analysis" with clearer sections
  - Created separate "2025 Till Date" charts showing cumulative performance from January to current month
  - Added dedicated "2024 Full Year Reference Data" section for year-over-year comparison
  - Improved chart readability with better font sizes (12px), tooltips showing full names, and legend descriptions
  - Implemented dynamic period descriptions showing current month context (e.g., "January to June 2025")
  - Enhanced station/commodity name truncation with ellipsis for better visual fit while preserving full names in tooltips
  - Added reference 2024 data charts with appropriate grey styling to distinguish from current year performance
  - Organized layout with 2025 till-date charts prominently displayed above 2024 reference charts
- July 3, 2025. Fixed number formatting throughout the application to display full values instead of abbreviated "K" format:
  - Updated formatNumber functions in Custom Reports and Dashboard pages to use toLocaleString() for complete number display
  - Modified all chart formatters to show full numbers with proper comma formatting instead of abbreviated "K" values
  - Enhanced table displays across the system to preserve and show complete numeric values
  - Ensured all export functions (CSV, JSON, PDF) maintain original full numeric precision
  - Applied consistent number formatting with thousands separators for better readability while preserving complete data accuracy
- July 3, 2025. Verified Excel data upload functionality through update_from_excel.ts script:
  - Confirmed script successfully processes Excel files from attached_assets/new.xlsx
  - Validated data import handles 245 rows with proper Excel date conversion and batch processing
  - Enhanced script with better error handling and progress feedback for reliable data uploads
- July 3, 2025. Enhanced Custom Reports with comprehensive table sorting and day division formula display:
  - Implemented clickable column headers with sort indicators (up/down arrows) for all data columns
  - Added dynamic day calculation and formula display in table headers showing "A ÷ X = B" format
  - Column headers now labeled with clear identifiers (A, B, C, D) matching formula references
  - Sorting works for both commodity and station tables with proper data type handling (string vs numeric)
  - Formula shows exact number of days calculated from selected date range for transparency
  - Enhanced user experience with visual sort indicators and comprehensive data organization capabilities
- July 3, 2025. Fixed critical day calculation bug and updated MT display format:
  - Corrected day calculation formula to use inclusive date ranges (+1 day) across all custom report API endpoints
  - Fixed Math.ceil() logic that was causing inaccurate average per day calculations
  - Updated MT (tonnage) values to display in millions instead of thousands throughout Custom Reports
  - Added totals rows at bottom of both commodity and station tables for comprehensive data summarization
  - Maintained clean "MT" column headers while improving data readability with million-based formatting
- July 2, 2025. Implemented comprehensive custom reporting functionality:
  - Created dedicated Custom Reports page with date range picker for flexible report generation
  - Added custom date filtering for both commodity and station analysis reports
  - Implemented dual export functionality: PDF reports with professional formatting and CSV data exports
  - Created backend API endpoints (/api/custom-report-commodities, /api/custom-report-stations) for filtered data queries
  - Built custom PDF and CSV export endpoints with proper year-over-year comparison logic
  - Added Custom Reports option to Operations dropdown navigation menu
  - Enhanced user experience with report configuration interface including date selection, report type, and export format options
  - Enabled users to generate reports for any custom date range with automatic previous period comparison (same dates one year prior)
  - Maintained consistent table formatting and comparison analysis structure across custom and standard reports
  - Fixed critical runtime errors by aligning frontend interface definitions with backend response structure
  - Corrected MT (tonnage) display formatting to show values in thousands by dividing raw values by 1000
  - Added color-coded table headers to differentiate current (blue), previous (green), and variation (orange) columns for better readability
  - Implemented duration headers displaying actual time periods in table headers with two-row structure showing date ranges for current vs previous periods
  - Converted PDF reports to landscape orientation with wider column layouts for better readability and proper table display
  - Integrated ExportWizard component in Custom Reports page providing advanced export options with column selection, format choice, and data filtering capabilities
  - Enhanced ExportWizard with PDF generation capability allowing users to create custom PDFs with selected columns and dynamic layouts
  - Added new backend API endpoint (/api/exports/custom-export-pdf) for generating customizable PDFs with column selection and professional Railway branding
  - Implemented dynamic column width calculation and proper page breaks for optimal PDF table presentation
  - Added support for JSON, CSV, and PDF export formats in ExportWizard with client-side data processing for JSON/CSV and server-side PDF generation

## User Preferences

Preferred communication style: Simple, everyday language.
User confirmed satisfaction with current implementation: "till now everything is fine thank you" (June 25, 2025)