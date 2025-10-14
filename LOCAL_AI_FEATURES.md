# Chrome Local AI Integration

This document describes the Chrome on-device AI features integrated into the Smart Resume Assistant extension.

## Overview

The extension now includes Chrome's on-device AI APIs (Gemini Nano) for privacy-focused AI operations that run entirely on your device without sending data to the cloud.

## Requirements

- Chrome 138+ (or Chrome Canary with experimental flags enabled)
- Gemini Nano model downloaded (Chrome will prompt automatically)
- Active subscription (usage limits apply per tier)

## Enabling Chrome AI (Development)

For Chrome Canary/Dev channel:

1. Open `chrome://flags`
2. Enable:
   - `#optimization-guide-on-device-model`
   - `#prompt-api-for-gemini-nano`
3. Restart Chrome
4. Visit `chrome://components` and download/update "Optimization Guide On Device Model"

## Integrated APIs

### 1. Prompt API
General-purpose prompting for custom AI interactions.

**Functions:**
- `promptUser(prompt: string): Promise<string>`

**Usage:** Direct AI queries with custom prompts

### 2. Proofreader API
Grammar and style correction for professional documents.

**Functions:**
- `proofreadText(text: string): Promise<string>`

**Usage:** Resume proofreading with grammar/style fixes

### 3. Summarizer API
Text summarization in multiple formats.

**Functions:**
- `summarizeText(text: string, type: 'short' | 'medium' | 'detailed'): Promise<string>`

**Usage:** Job posting summarization with configurable detail level

### 4. Translator API
Multi-language translation support.

**Functions:**
- `translateText(text: string, targetLang: 'en' | 'es' | 'ja'): Promise<string>`

**Supported Languages:**
- English (en)
- Spanish (es)
- Japanese (ja)

**Usage:** Translate resumes, cover letters, or job postings

### 5. Writer API
Original content generation.

**Functions:**
- `writeText(prompt: string, context?: string): Promise<string>`

**Usage:** Generate resume bullet points or cover letter content

### 6. Rewriter API
Content improvement and style transformation.

**Functions:**
- `rewriteText(text: string, style?: 'professional' | 'casual' | 'concise' | 'detailed'): Promise<string>`

**Styles:**
- **Professional**: Formal business tone
- **Casual**: Conversational friendly tone
- **Concise**: Shorter, direct version
- **Detailed**: Expanded with more context

**Usage:** Resume polishing and content refinement

### 7. Multimodal Support

#### Image Analysis
Analyze screenshots, diagrams, or document images.

**Functions:**
- `analyzeImage(file: File, notes?: string): Promise<string>`

**Use Cases:**
- Job posting screenshots
- Resume format analysis
- Portfolio image descriptions

#### Audio Analysis
Transcribe and analyze audio recordings.

**Functions:**
- `analyzeAudio(file: File): Promise<string>`

**Use Cases:**
- Interview preparation notes
- Voice memo transcription
- Meeting recordings

## Subscription Tiers & Limits

### Free Tier
- 5 calls per feature per month
- All features available
- Monthly reset

### Basic Tier
- 20 calls per feature per month
- All features available
- Monthly reset

### Premium Tier
- Unlimited calls
- All features available
- Lifetime access

## UI Integration

### Popup Interface

#### Local AI Actions Section
Located in the Analysis tab after cloud AI actions:

**Resume AI Actions:**
- Proofread button
- Polish button (professional rewrite)
- Make Concise button

**Job AI Actions:**
- Summarize (short/medium/detailed)
- Translate (EN/ES/JA)

### Dashboard Interface

#### Local AI Usage Stats
Displays current month usage for all 8 features:
- Visual progress bars
- Usage counts vs limits
- Color-coded status

#### Multimodal AI Section
Collapsible panel with:
- Image upload and analysis
- Audio upload and transcription
- Context notes for better analysis

## Usage Tracking

All local AI operations are tracked in Supabase:

**Tables:**
- `local_ai_usage` - Detailed usage logs
- `local_ai_monthly_usage` - Aggregated monthly stats

**Automatic Features:**
- Monthly usage reset
- Tier-based limits enforcement
- Real-time usage updates

## Error Handling

Common errors and solutions:

### "Chrome AI not available"
**Solution:** Update to Chrome 138+ or enable flags in Chrome Canary

### "Model unavailable"
**Solution:** Download Gemini Nano from `chrome://components`

### "Usage limit exceeded"
**Solution:** Upgrade subscription or wait for monthly reset

### "Multimodal not supported"
**Solution:** Ensure latest Chrome version with full Gemini Nano support

## Privacy & Security

**Key Benefits:**
- All processing happens on-device
- No data sent to external servers
- Full privacy for sensitive documents
- Works offline (after initial model download)

**Data Storage:**
- Only usage counts stored in Supabase
- No AI inputs or outputs are logged
- User controls all data

## API Architecture

### Service Layer
`src/services/localAIService.ts`
- Single session management
- Usage tracking integration
- Error handling
- Subscription validation

### Components
- `ResumeAIActions.tsx` - Resume enhancement
- `JobAIActions.tsx` - Job posting analysis
- `MultimodalAI.tsx` - Image/audio processing

### Database Functions
- `can_use_local_ai_feature()` - Check limits
- `record_local_ai_usage()` - Track usage
- `get_local_ai_usage_stats()` - Fetch stats

## Future Enhancements

Potential additions:
- More language support
- Custom AI models
- Batch processing
- Advanced styling options
- Resume templates with AI
- Interview practice with voice

## Troubleshooting

### Build Issues
Run `npm run build` to verify integration

### TypeScript Errors
Ensure global window types are declared correctly

### Subscription Issues
Check Supabase connection and RLS policies

## Contributing

When adding new local AI features:

1. Add feature type to `LocalAIFeatureType` union
2. Update database migration with new feature
3. Create component for UI integration
4. Add usage tracking
5. Update subscription limits
6. Document in this file

## Support

For issues:
1. Check Chrome version and flags
2. Verify Gemini Nano download
3. Review console errors
4. Check subscription status
5. Examine network/Supabase logs
