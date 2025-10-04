# Smart Resume Assistant - Chrome Extension

A Chrome Extension that helps you tailor resumes and generate cover letters based on job postings using AI.

## Features

- **Extract Job Postings**: Automatically extract job posting text from the current browser tab
- **Upload Resume**: Support for PDF, DOCX, and TXT resume files
- **Summarize Job**: Get AI-powered summaries of job requirements and responsibilities
- **Tailor Resume**: Automatically adapt your resume to match job requirements
- **Generate Cover Letter**: Create professional cover letters based on job postings and your resume

## Project Structure

```
.
├── manifest.json           # Chrome Extension manifest (Manifest v3)
├── public/
│   └── icons/              # Extension icons (16x16, 48x48, 128x128)
├── src/
│   ├── background.ts       # Service worker for extension logic
│   ├── content.ts          # Content script for page scraping
│   ├── components/
│   │   └── Popup.tsx       # Main popup UI component
│   ├── utils/
│   │   └── aiMocks.ts      # Mock AI functions (to be replaced with real Chrome AI APIs)
│   ├── App.tsx             # Root React component
│   └── main.tsx            # React entry point
└── dist/                   # Built extension (after running npm run build)
```

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

This will create a `dist/` folder with the compiled extension.

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project

### Development Workflow

1. Make changes to the source files
2. Run `npm run build` to rebuild
3. Click the reload icon in `chrome://extensions/` to reload the extension
4. Test your changes

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Chrome Extensions API** - Browser integration

## Current Status

This is a **skeleton/prototype** with mock AI functionality. The AI features currently return placeholder text to demonstrate the workflow.

### Next Steps (Future Implementation)

- Replace mock AI functions in `src/utils/aiMocks.ts` with real Chrome AI API calls:
  - Prompt API
  - Summarizer API
  - Writer API
  - Rewriter API
  - Proofreader API
  - Translator API
- Add file parsing for PDF and DOCX resume uploads
- Implement persistent storage using Chrome Storage API
- Add export functionality for generated content
- Enhance job posting extraction with better text parsing

## Permissions

The extension requests the following permissions:

- `activeTab` - Access to the current tab for extracting job postings
- `scripting` - Execute scripts to extract page content
- `storage` - Store user data and preferences

## Contributing

This is a work-in-progress project. Future contributions will focus on integrating real Chrome AI APIs and enhancing extraction/parsing capabilities.

## License

MIT
