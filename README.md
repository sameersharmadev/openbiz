# Udyam Registration Form

A responsive web application that replicates the Government of India's Udyam Registration portal for MSME (Micro, Small & Medium Enterprises) registration. This application demonstrates web scraping, form generation, and full-stack development capabilities.

## Project Overview

Complete recreation of the official Udyam Registration form with:
- **Web Scraping**: Extracts form structure and validation rules from the official portal
- **Dynamic Form Generation**: Renders forms based on scraped schema data
- **Real-time Validation**: Client-side and server-side validation with Aadhaar/PAN verification
- **Database Integration**: PostgreSQL with Prisma ORM for data persistence
- **Responsive Design**: Mobile-first approach matching government portal aesthetics
- **TypeScript**: Full type safety throughout the application

## Live Demo

**Deployed Application**: [Your Vercel URL here]

## Project Structure

```
openbiz/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── submit-step/     # Form submission handler
│   │   └── registrations/   # Registration data retrieval
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main landing page
├── components/              # React components
│   └── UdyamForm.tsx        # Main form component
├── data/                    # Form schema and configuration
│   └── form-schema-simple.json
├── lib/                     # Utilities and libraries
│   └── scraper.js           # Web scraping implementation
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Database models
├── types/                   # TypeScript type definitions
│   └── form.ts              # Form-related types
└── utils/                   # Utility functions
    └── validation.ts        # Form validation logic
```

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - State management and side effects

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Primary database

### Development Tools
- **Puppeteer** - Web scraping and automation
- **ESLint** - Code linting
- **Vercel** - Deployment platform

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### 1. Clone and Install
```bash
git clone [your-repo-url]
cd openbiz
npm install
```

### 2. Environment Configuration
Create a `.env` file:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/udyam_db"
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Key Features

### Web Scraping Engine
- Intelligent extraction of form fields, validation rules, and UI structure
- Dynamic schema generation from scraped data
- Multi-source scraping combining Puppeteer and static HTML parsing

### Smart Form System
- Multi-step forms with progressive validation
- Real-time validation with instant feedback
- PIN code lookup with automatic city/state population
- Progress tracking with visual step indicators

### Validation & Security
- Aadhaar validation (12-digit format)
- PAN verification (Indian PAN format)
- Input sanitization and XSS protection
- Full TypeScript type safety

### Data Management
- PostgreSQL database integration
- Step-wise data saving
- Unique registration ID generation and tracking

## API Documentation

### POST `/api/submit-step`
Submit form data for a specific step.

**Request:**
```json
{
  "step": 1,
  "data": {
    "aadhaarNumber": "123456789012",
    "entrepreneurName": "John Doe",
    "aadhaarConsent": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Aadhaar validation successful",
  "registrationId": "unique-registration-id"
}
```

### GET `/api/registrations/[id]`
Retrieve registration data by ID.

**Response:**
```json
{
  "registration": {
    "id": "unique-id",
    "aadhaarNumber": "123456789012",
    "entrepreneurName": "John Doe",
    "stepCompleted": 2,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`

### Manual Deployment
```bash
npm run build
npm start
```

## Troubleshooting

### Database Connection Error
```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://user:password@host:port/database"
npx prisma generate
```

### Build Errors
```bash
rm -rf .next node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npx tsc --noEmit
npm install @types/node @types/react @types/react-dom --save-dev
```

## Development

### Run Tests
```bash
npm test
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Maintain consistent code formatting
- Update documentation for changes