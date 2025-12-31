# Gemini API Integration Setup Guide

## Overview
The Image Search feature now uses Google Gemini AI to analyze uploaded images and extract detailed descriptions, which are then matched against lost and found items in the database.

## How It Works

1. **User uploads an image** → Image is converted to base64
2. **Sent to Supabase Edge Function** → Secure server-side processing
3. **Gemini AI analyzes the image** → Extracts detailed description (category, color, brand, features, etc.)
4. **Smart matching algorithm** → Compares description with database items
5. **Results displayed** → Shows matching items ranked by relevance

## Setup Instructions

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key (starts with `AIza...`)

### Step 2: Add API Key to Supabase

You need to add the Gemini API key as a secret in your Supabase project. Please provide your API key, and I'll add it for you.

**Your API key will be stored securely in Supabase and will never be exposed to the frontend.**

### Step 3: Test the Feature

1. Navigate to "Image Search" in the navigation menu
2. Upload an image of an item (phone, wallet, keys, etc.)
3. Click "Analyze & Search with AI"
4. Wait for Gemini to analyze the image (usually 2-5 seconds)
5. View the extracted description and matching results

## Features

### AI-Powered Image Analysis
- **Automatic item detection**: Identifies item type/category
- **Color recognition**: Detects primary and secondary colors
- **Brand identification**: Recognizes logos and brand names
- **Feature extraction**: Notes distinctive characteristics
- **Condition assessment**: Evaluates item condition
- **Text recognition**: Reads visible text or identifiers

### Smart Matching Algorithm
The matching algorithm uses weighted scoring:
- **Exact phrase matches**: 100 points (highest priority)
- **Item name matches**: 50 points
- **Category matches**: 40 points
- **Description matches**: 35 points
- **Additional info matches**: 30 points
- **Individual word matches**: 5-10 points each

Results are sorted by relevance score, showing the best matches first.

### User Experience
- **Real-time progress**: Upload progress bar with percentage
- **AI analysis display**: Shows extracted description in a highlighted card
- **Visual feedback**: Sparkles icon and animations for AI features
- **Error handling**: Clear error messages if analysis fails
- **Responsive design**: Works on all devices

## Technical Details

### Edge Function: `analyze-image-gemini`
**Location**: `/supabase/functions/analyze-image-gemini/index.ts`

**Responsibilities**:
- Receives base64-encoded image from frontend
- Calls Gemini API with structured prompt
- Extracts and returns item description
- Handles errors and API failures

**Security**:
- API key stored in Supabase secrets (not in code)
- CORS headers configured for frontend access
- Input validation and error handling
- No sensitive data logged

### Frontend Integration
**File**: `/src/pages/ImageSearchPage.tsx`

**Key Changes**:
- Uses `analyzeImageAndSearch()` instead of `searchItemsByImage()`
- Displays extracted description in dedicated card
- Shows "Analyzing with AI..." loading state
- Handles Gemini API errors gracefully

### API Function: `analyzeImageAndSearch()`
**File**: `/src/db/api.ts`

**Process**:
1. Convert image file to base64
2. Call `analyze-image-gemini` edge function
3. Receive description from Gemini
4. Fetch all lost and found items
5. Run matching algorithm
6. Return description + top 20 matches

### Matching Function: `matchItemsByDescription()`
**File**: `/src/db/api.ts`

**Algorithm**:
- Tokenizes search description into words
- Calculates relevance score for each item
- Considers: item name, category, description, additional info
- Filters items with score > 0
- Sorts by score (descending)
- Returns top 20 results

## Example Usage

### Example 1: Lost iPhone
**Uploaded Image**: Photo of a black iPhone 13 Pro

**Gemini Analysis**:
```
Item type: Smartphone (iPhone)
Color: Midnight Black
Brand: Apple iPhone 13 Pro
Features: Triple camera system, stainless steel frame
Condition: Good, minor scratches on screen
Identifiers: Apple logo visible on back
```

**Matching Results**: Shows all black iPhones, iPhone 13 models, and similar smartphones

### Example 2: Found Wallet
**Uploaded Image**: Photo of a brown leather wallet

**Gemini Analysis**:
```
Item type: Wallet
Color: Brown leather
Features: Bifold design, multiple card slots
Condition: Well-worn, vintage appearance
Identifiers: No visible brand markings
```

**Matching Results**: Shows brown wallets, leather wallets, and similar accessories

## API Costs

### Gemini API Pricing (as of 2024)
- **Model**: gemini-1.5-flash
- **Free tier**: 15 requests per minute, 1 million tokens per day
- **Paid tier**: $0.00025 per image (very affordable)

### Estimated Costs
- **100 searches/day**: ~$0.025/day = $0.75/month
- **1000 searches/day**: ~$0.25/day = $7.50/month
- **10000 searches/day**: ~$2.50/day = $75/month

The free tier is sufficient for most campus use cases.

## Troubleshooting

### Error: "Gemini API key not configured"
**Solution**: API key needs to be added to Supabase secrets. Provide your key to set it up.

### Error: "Failed to analyze image"
**Possible causes**:
- Invalid API key
- API quota exceeded
- Image format not supported
- Network connectivity issues

**Solution**: Check API key, verify quota, try different image format

### No matching results found
**Possible causes**:
- No similar items in database
- Description doesn't match any items
- Items are marked as concluded/inactive

**Solution**: Try different image, check if items exist in database

### Slow analysis (>10 seconds)
**Possible causes**:
- Large image file size
- Network latency
- Gemini API rate limiting

**Solution**: Use smaller images (<2MB), check internet connection

## Future Enhancements

### Phase 1: Enhanced Matching
- Add fuzzy string matching for typos
- Implement semantic similarity (word embeddings)
- Add location-based filtering
- Consider date ranges in matching

### Phase 2: Multi-Image Support
- Allow uploading multiple images
- Compare all images against database
- Show best match from any image

### Phase 3: Visual Similarity
- Store item images in vector database
- Use image embeddings for visual matching
- Combine text + visual similarity scores

### Phase 4: User Feedback Loop
- Allow users to rate match quality
- Use feedback to improve algorithm
- Track successful matches
- Adjust scoring weights based on data

## Security & Privacy

### Data Handling
- Images are converted to base64 and sent to edge function
- Images are NOT stored permanently
- Only descriptions are used for matching
- No personal data sent to Gemini API

### API Key Security
- Stored in Supabase secrets (encrypted)
- Never exposed to frontend code
- Only accessible by edge functions
- Can be rotated anytime

### User Privacy
- No user identification sent to Gemini
- Search history not tracked
- Results based only on public item data
- GDPR compliant

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify API key is correctly configured
3. Test with different images
4. Check Supabase edge function logs

For additional help, refer to:
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)

---

## Ready to Set Up?

Please provide your Gemini API key, and I'll configure it in Supabase for you!

**Format**: `AIza...` (starts with AIza, followed by alphanumeric characters)

Once configured, the Image Search feature will be fully operational with AI-powered analysis! 🚀
