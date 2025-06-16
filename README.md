# Railway Operations Management System

A comprehensive railway operations management system designed for flexible data synchronization and streamlined logistics workflows.

## Features

### Core Functionality
- **Excel Data Import**: Process railway operations data from Excel files with intelligent validation
- **Decimal Units Support**: Handle precise unit measurements (52.5, 142.5, etc.)
- **Date Conversion**: Automatic Excel serial number to date conversion
- **Multi-page Dashboard**: Comprehensive operational views and analytics

### Data Management
- **PostgreSQL Database**: Robust data persistence with Drizzle ORM
- **Real-time Validation**: Error handling and data integrity checks
- **Batch Processing**: Efficient handling of large datasets
- **Historical Records**: Track operations across different time periods

### User Interface
- **Tabbed Navigation**: Optimized for station managers and planners
- **Loading Form**: Matches Access database form layout
- **Daily Reports**: Comparative analysis across time periods
- **Data Visualization**: Charts and graphs for operational insights

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Data Processing**: Excel file parsing with xlsx library
- **Authentication**: Passport.js with local strategy
- **Build Tool**: Vite

## Database Schema

### Railway Loading Operations
- **P DATE**: Operation date
- **STATION**: Loading station
- **COMMODITY**: Type of goods (G.RICE, T.RICE, FERT., etc.)
- **COMM TYPE**: Commodity category
- **WAGONS**: Number of wagons (integer)
- **UNITS**: Precise unit count (decimal support)
- **TONNAGE**: Total tonnage (decimal)
- **FREIGHT**: Freight charges (decimal)
- **RR DATE**: Railway receipt date

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

4. Push database schema:
   ```bash
   npm run db:push
   ```

5. Start the application:
   ```bash
   npm run dev
   ```

## Usage

### Excel Data Import
1. Place Excel files in the `attached_assets/` directory
2. Use the backend script to import data:
   ```bash
   npx tsx update_from_excel.ts
   ```

### Web Interface
- **Dashboard**: Overview of operations and metrics
- **All Entries**: Complete data listing with filters
- **Daily Reports**: Comparative analysis tools
- **Loading Form**: Manual data entry matching Access database layout

## Data Structure

The system processes Excel files with the following columns:
- P DATE, STATION, COMMODITY, COMM TYPE, COMM CG
- DEMAND, STATE, RLY, WAGONS, TYPE, UNITS
- LOADING TYPE, RR NO FROM, RR NO TO, RR DATE
- TONNAGE, FREIGHT, T_INDENTS, O/S INDENTS

## Current Data

The system contains 29 authentic railway operations records spanning:
- **Date Range**: February 2025 - May 2025
- **Stations**: 9 unique stations
- **Commodities**: 10 different types
- **Total Operations**: 1,478 wagons, 3,722.5 units

## Development

### Project Structure
```
├── client/src/          # React frontend
├── server/              # Express backend
├── db/                  # Database schema and connection
├── attached_assets/     # Excel files for import
└── update_from_excel.ts # Data import script
```

### Key Files
- `db/schema.ts`: Database table definitions
- `server/routes.ts`: API endpoints
- `client/src/App.tsx`: Main application router
- `update_from_excel.ts`: Excel import utility

## Contributing

1. Follow TypeScript best practices
2. Use Drizzle ORM for database operations
3. Maintain responsive design with Tailwind CSS
4. Test Excel import functionality with real data

## License

Railway Operations Management System for efficient logistics workflow management.