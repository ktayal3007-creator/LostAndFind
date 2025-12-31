# Gemini 2.5 Flash Lite Integration Guide

## 🚀 Overview

FINDIT.AI now uses **Google Gemini 2.5 Flash Lite** for AI-powered image analysis. This feature helps users automatically generate detailed descriptions of lost and found items by analyzing uploaded images.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Setup Instructions](#setup-instructions)
3. [How It Works](#how-it-works)
4. [Usage](#usage)
5. [API Configuration](#api-configuration)
6. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### AI-Powered Image Analysis
- **Automatic Item Description**: Upload an image and get a detailed description
- **Category Detection**: Identifies item type (phone, wallet, keys, bag, etc.)
- **Color Recognition**: Detects and describes colors
- **Brand Identification**: Recognizes brands and logos
- **Feature Detection**: Identifies distinctive features and unique identifiers
- **Condition Assessment**: Describes the item's condition

### Model: Gemini 2.5 Flash Lite
- **Fast**: Optimized for quick responses
- **Efficient**: Lower cost per request
- **Accurate**: High-quality image understanding
- **Reliable**: Production-ready model from Google

---

## 🔧 Setup Instructions

### Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the generated API key

3. **Important Notes**
   - Keep your API key secure and private
   - Don't commit it to version control
   - Don't share it publicly

### Step 2: Configure Environment Variables

#### Option A: Local Development (.env file)

Update the `.env` file in the project root:

```bash
# Replace YOUR_GEMINI_API_KEY_HERE with your actual API key
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Option B: Supabase Edge Function Secret

The API key is stored as a Supabase secret for the edge function. To update it:

**Using Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to: Settings → Edge Functions → Secrets
3. Find `GEMINI_API_KEY`
4. Click "Edit" and paste your actual API key
5. Save changes

**Using Supabase CLI (if available):**
```bash
supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Verify Configuration

1. **Check Edge Function Status**
   - Edge function name: `analyze-image-gemini`
   - Status: Should be "ACTIVE"
   - Version: 4 (latest)

2. **Test the Integration**
   - Go to "Report Lost" or "Report Found" page
   - Upload an image
   - Click "Analyze Image with AI"
   - Verify that a description is generated

---

## 🔍 How It Works

### Architecture

```
┌─────────────────┐
│  User Uploads   │
│     Image       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  (React)        │
│  - Converts to  │
│    Base64       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  Edge Function  │
│  analyze-image- │
│  gemini         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini 2.5     │
│  Flash Lite API │
│  - Analyzes     │
│  - Generates    │
│    Description  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │
│  Returns to     │
│  Frontend       │
└─────────────────┘
```

### Data Flow

1. **Image Upload**
   - User selects an image file
   - Frontend converts image to Base64 format
   - Base64 data is sent to edge function

2. **Edge Function Processing**
   - Receives Base64 image data
   - Retrieves GEMINI_API_KEY from environment
   - Constructs API request with prompt
   - Sends request to Gemini API

3. **Gemini API Analysis**
   - Model: `gemini-2.5-flash-lite`
   - Analyzes image content
   - Generates structured description
   - Returns JSON response

4. **Response Handling**
   - Edge function extracts description
   - Returns formatted response to frontend
   - Frontend displays description to user
   - User can edit or accept description

---

## 💡 Usage

### In Report Lost Page

1. Navigate to "Report Lost" page
2. Fill in basic information
3. Upload an image of the lost item
4. Click **"Analyze Image with AI"** button
5. Wait for AI analysis (usually 2-3 seconds)
6. Review the generated description
7. Edit if needed
8. Submit the report

### In Report Found Page

1. Navigate to "Report Found" page
2. Fill in basic information
3. Upload an image of the found item
4. Click **"Analyze Image with AI"** button
5. Wait for AI analysis (usually 2-3 seconds)
6. Review the generated description
7. Edit if needed
8. Submit the report

### Example Output

**Input**: Image of a blue iPhone 13

**AI Generated Description**:
```
This is an Apple iPhone 13 in Sierra Blue color. The device appears to be in 
good condition with a 6.1-inch display. The distinctive dual-camera system is 
visible on the back, positioned diagonally. The phone has a flat-edge design 
with aluminum sides and a glass back. No visible damage or scratches are 
apparent. The Apple logo is clearly visible on the back of the device.
```

---

## ⚙️ API Configuration

### Edge Function Details

**File**: `supabase/functions/analyze-image-gemini/index.ts`

**Endpoint**: `analyze-image-gemini`

**Method**: POST

**Request Body**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response**:
```json
{
  "description": "Detailed item description...",
  "success": true
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Gemini API Configuration

**Model**: `gemini-2.5-flash-lite`

**API Endpoint**:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent
```

**Generation Config**:
```javascript
{
  temperature: 0.4,      // Lower = more focused, deterministic
  topK: 32,              // Limits vocabulary for each step
  topP: 1,               // Nucleus sampling threshold
  maxOutputTokens: 500   // Maximum response length
}
```

**Prompt Template**:
```
Analyze this image of a lost or found item and provide a detailed description. Include:
1. Item type/category (e.g., phone, wallet, keys, bag, etc.)
2. Color(s)
3. Brand or distinctive features
4. Size or dimensions (if apparent)
5. Condition
6. Any text, logos, or unique identifiers visible

Format your response as a clear, concise description that could be used to 
match this item with a database of lost and found items. Focus on distinctive 
features that would help identify the item.
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Gemini API key not configured"

**Problem**: API key is not set or is invalid

**Solution**:
- Verify API key is set in Supabase secrets
- Check that the key starts with `AIza`
- Ensure no extra spaces or characters
- Try regenerating the API key

#### 2. "Failed to analyze image"

**Problem**: Gemini API returned an error

**Possible Causes**:
- Invalid API key
- API quota exceeded
- Image format not supported
- Image too large

**Solutions**:
- Check API key validity
- Verify API quota in Google Cloud Console
- Ensure image is JPEG, PNG, or WebP
- Reduce image size (max 4MB recommended)

#### 3. "No description generated from image"

**Problem**: Gemini API returned empty response

**Solutions**:
- Try a clearer image
- Ensure image contains a visible item
- Check image quality and lighting
- Try a different image format

#### 4. Edge Function Timeout

**Problem**: Request takes too long

**Solutions**:
- Reduce image size before upload
- Check internet connection
- Verify Gemini API status
- Try again after a few seconds

### Debugging

#### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to: Edge Functions → analyze-image-gemini
3. Click "Logs" tab
4. Look for error messages

#### Test API Key Manually

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'
```

#### Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

---

## 📊 API Limits & Pricing

### Gemini 2.5 Flash Lite

**Free Tier**:
- 15 requests per minute (RPM)
- 1 million tokens per minute (TPM)
- 1,500 requests per day (RPD)

**Paid Tier** (if needed):
- Higher rate limits
- Priority access
- Better reliability

**Cost** (Paid tier):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- Images: Counted as tokens based on size

**Typical Usage**:
- Average request: ~500 tokens (input + output)
- Cost per request: ~$0.0002 (very low)
- 1000 requests: ~$0.20

### Best Practices

1. **Optimize Image Size**
   - Resize images before upload
   - Target: 800x600 or smaller
   - Reduces tokens and improves speed

2. **Cache Results**
   - Store descriptions in database
   - Avoid re-analyzing same image
   - Saves API calls and costs

3. **Rate Limiting**
   - Implement client-side throttling
   - Show loading states
   - Handle quota errors gracefully

4. **Error Handling**
   - Provide fallback options
   - Allow manual description entry
   - Show helpful error messages

---

## 🔐 Security Best Practices

### API Key Security

1. **Never Expose in Frontend**
   - ✅ Store in Supabase secrets
   - ✅ Use edge functions
   - ❌ Don't put in client-side code
   - ❌ Don't commit to Git

2. **Rotate Keys Regularly**
   - Change API key every 90 days
   - Use different keys for dev/prod
   - Revoke old keys immediately

3. **Monitor Usage**
   - Check API usage regularly
   - Set up billing alerts
   - Watch for unusual patterns
   - Investigate spikes

4. **Restrict API Key**
   - Limit to specific APIs
   - Set application restrictions
   - Use API key restrictions in Google Cloud

### Edge Function Security

1. **CORS Configuration**
   - Properly configured in edge function
   - Allows requests from your domain
   - Blocks unauthorized origins

2. **Input Validation**
   - Validates image data format
   - Checks file size limits
   - Sanitizes user input

3. **Error Handling**
   - Doesn't expose sensitive info
   - Logs errors securely
   - Returns safe error messages

---

## 📚 Additional Resources

### Documentation

- **Gemini API Docs**: https://ai.google.dev/docs
- **Gemini Models**: https://ai.google.dev/models/gemini
- **API Reference**: https://ai.google.dev/api/rest
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

### Support

- **Google AI Studio**: https://aistudio.google.com
- **Supabase Support**: https://supabase.com/support
- **GitHub Issues**: [Your repository]

### Examples

- **Image Analysis**: See `src/pages/ReportLostPage.tsx`
- **API Integration**: See `src/db/api.ts`
- **Edge Function**: See `supabase/functions/analyze-image-gemini/index.ts`

---

## 🎯 Next Steps

### After Setup

1. ✅ **Test the Feature**
   - Upload various item images
   - Verify descriptions are accurate
   - Check response times

2. ✅ **Monitor Usage**
   - Track API calls
   - Monitor costs
   - Check error rates

3. ✅ **Optimize Performance**
   - Implement image compression
   - Add caching layer
   - Optimize prompts

4. ✅ **Enhance UX**
   - Add loading animations
   - Improve error messages
   - Add retry functionality

### Future Enhancements

- **Smart Matching**: Use AI to match lost and found items
- **Multi-language**: Support descriptions in multiple languages
- **Batch Processing**: Analyze multiple images at once
- **Advanced Features**: Extract text from images (OCR)
- **Similarity Search**: Find similar items in database

---

## ✅ Checklist

Before going live, ensure:

- [ ] Gemini API key is set in Supabase secrets
- [ ] Edge function is deployed and active
- [ ] Test image analysis with various items
- [ ] Error handling works correctly
- [ ] Loading states are visible
- [ ] API usage is monitored
- [ ] Billing alerts are set up
- [ ] Documentation is updated
- [ ] Team is trained on the feature
- [ ] Backup plan exists if API fails

---

## 📞 Support

If you encounter issues:

1. Check this documentation first
2. Review edge function logs
3. Test API key manually
4. Check Gemini API status
5. Contact support if needed

---

**Last Updated**: December 30, 2024  
**Version**: 1.0  
**Model**: Gemini 2.5 Flash Lite  
**Status**: ✅ Production Ready

---

## 🎉 Summary

You now have a fully configured AI-powered image analysis system using Google Gemini 2.5 Flash Lite! This feature will help users create better item descriptions, leading to more successful reunions of lost items with their owners.

**Key Benefits**:
- ⚡ Fast and accurate image analysis
- 💰 Cost-effective solution
- 🎯 Improved item descriptions
- 🤖 Automated workflow
- 📈 Better user experience

**Remember**: Always keep your API key secure and monitor your usage to avoid unexpected costs!
