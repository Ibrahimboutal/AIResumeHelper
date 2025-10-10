# Smart Resume Assistant - Chrome Extension

A Chrome Extension that helps you tailor resumes, generate cover letters, and track job applications using AI. Built with React, TypeScript, Supabase, and Google Gemini AI.

## Features

### Core Features
- **Extract Job Postings**: Automatically extract job posting text from the current browser tab
- **Upload Resume**: Support for PDF, DOCX, and TXT resume files
- **AI-Powered Analysis**:
  - Summarize job requirements and responsibilities
  - Tailor your resume to match job requirements
  - Generate professional cover letters
  - Score resume match with job descriptions
  - Extract key skills and keywords
- **Resume Management**: Store and manage multiple resume versions
- **Job Application Tracking**: Track applications with status updates
- **Dashboard & Analytics**: Visual insights into your job search progress

### Subscription System

The extension offers a tiered subscription model:

#### Free Tier
- **5 job applications** tracked
- Resume tailoring
- Cover letter generation
- Job tracking
- Perfect for trying out the extension

#### Basic Tier ($9.99)
- **20 job applications** tracked
- All free features plus:
  - Advanced AI features
  - Priority support
- Ideal for active job seekers

#### Premium Tier ($49.99 - Lifetime)
- **Unlimited job applications**
- All basic features plus:
  - Lifetime access
  - No recurring fees
  - Best value for serious job seekers

Users can start with the free tier to test the extension. When they reach their limit, they'll be prompted to upgrade for continued access.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **AI**: Google Gemini API
- **PDF Processing**: pdf.js
- **Document Processing**: mammoth (for DOCX)
- **Icons**: Lucide React
- **Chrome Extensions API**: Manifest v3

## Project Structure

```
.
├── manifest.json                 # Chrome Extension manifest (Manifest v3)
├── public/
│   ├── icons/                    # Extension icons
│   └── manifest.json             # Public manifest
├── src/
│   ├── components/               # React components
│   │   ├── ApplicationTracker.tsx
│   │   ├── AuthModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SubscriptionModal.tsx
│   │   ├── UsageBanner.tsx
│   │   └── ...
│   ├── services/                 # Business logic
│   │   ├── applicationService.ts
│   │   ├── resumeService.ts
│   │   ├── subscriptionService.ts
│   │   └── geminiService.ts
│   ├── utils/                    # Utility functions
│   │   ├── pdfExtractor.ts
│   │   ├── keywordExtractor.ts
│   │   ├── resumeAnalyzer.ts
│   │   └── scoringEngine.ts
│   ├── hooks/                    # Custom React hooks
│   │   └── useAuth.ts
│   ├── background.ts             # Service worker
│   ├── content.ts                # Content script
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── supabase/
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge functions
└── dist/                         # Built extension
```

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Google Gemini API key

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set Up Supabase Database

Run the migrations in your Supabase project:

1. Navigate to your Supabase project SQL editor
2. Execute the migrations in order:
   - `supabase/migrations/20251006215304_create_resumes_and_applications_tables.sql`
   - `supabase/migrations/20251010000000_add_subscription_system.sql`

The migrations will create:
- User authentication tables
- Resumes storage table
- Job applications tracking table
- Subscription tiers table
- User subscriptions table with usage tracking
- Row Level Security policies
- Automatic triggers for usage tracking

### 4. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 5. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project
5. The extension icon will appear in your Chrome toolbar

## Usage

### First Time Setup

1. Click the extension icon in Chrome toolbar
2. Sign up with email and password
3. You'll automatically get a free tier subscription (5 job applications)

### Basic Workflow

1. **Navigate to a job posting** on any job board
2. **Click the extension icon** to open the popup
3. **Extract job details** using the "Extract from Page" button
4. **Upload your resume** (PDF, DOCX, or TXT)
5. **Use AI features**:
   - Get AI-powered job summary
   - Tailor resume to the job
   - Generate cover letter
   - View resume match score
6. **Track the application** by saving it to your dashboard
7. **View analytics** in the dashboard

### Managing Subscriptions

- View current usage in the dashboard
- When approaching your limit, you'll see a banner prompting you to upgrade
- Click "Upgrade Now" to view subscription tiers
- Select a tier to upgrade instantly

### Resume Management

- Save multiple resume versions
- Compare different versions
- Track which resume was used for which application

## Development

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Lint Code

```bash
npm run lint
```

### Development Workflow

1. Make changes to source files
2. Run `npm run build` to rebuild
3. Go to `chrome://extensions/`
4. Click reload icon to reload the extension
5. Test your changes

## Database Schema

### Tables

- **resumes**: Stores user resume versions
- **job_applications**: Tracks job applications with status
- **subscription_tiers**: Defines available subscription plans
- **user_subscriptions**: Tracks user subscription status and usage

### Security

All tables use Row Level Security (RLS) to ensure:
- Users can only access their own data
- Authenticated access only
- Automatic usage tracking via database triggers

## API Integration

### Gemini API

The extension uses Google Gemini API for:
- Job description analysis
- Resume tailoring
- Cover letter generation
- Keyword extraction

Configure your API key in the environment variables.

## Permissions

The extension requests:

- `activeTab`: Access current tab for extracting job postings
- `scripting`: Execute scripts to extract page content
- `storage`: Store user preferences locally

## Future Enhancements

- Email notifications for application follow-ups
- Browser extension for Firefox and Edge
- Integration with LinkedIn, Indeed, and other job boards
- Resume templates
- Interview preparation tools
- Salary insights and negotiation tips
- Chrome AI API integration for offline capabilities

## Troubleshooting

### Extension not loading
- Ensure you've run `npm run build`
- Check that Developer mode is enabled in Chrome
- Verify the manifest.json is in the dist folder

### Database errors
- Verify your Supabase credentials in `.env`
- Ensure migrations have been run
- Check Supabase dashboard for error logs

### AI features not working
- Verify your Gemini API key is correct
- Check API quota limits
- Review browser console for error messages

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- New features include proper error handling
- Database changes include migration files
- UI components are responsive and accessible

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Supabase logs for database issues

## Privacy & Data

- All user data is stored securely in Supabase
- Passwords are hashed using industry-standard encryption
- No data is shared with third parties
- Users can delete their account and data at any time
