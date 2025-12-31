# 🚀 Gemini 2.5 Flash Lite - Quick Reference

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Get API Key
```
Visit: https://aistudio.google.com/app/apikey
→ Sign in → Create API Key → Copy
```

### 2️⃣ Update .env File
```bash
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3️⃣ Set Supabase Secret
```bash
# Dashboard: Settings → Edge Functions → Secrets → GEMINI_API_KEY
# OR CLI:
supabase secrets set GEMINI_API_KEY=your_key_here
```

---

## 📝 Usage

### In Code (Frontend)
```typescript
import { analyzeImageWithGemini } from '@/db/api';

// Convert image to base64
const base64Image = await convertImageToBase64(file);

// Analyze image
const result = await analyzeImageWithGemini(base64Image);
console.log(result.description);
```

### In UI
1. Go to "Report Lost" or "Report Found"
2. Upload image
3. Click "Analyze Image with AI"
4. Get instant description

---

## 🔧 Configuration

### Model Details
- **Name**: `gemini-2.5-flash-lite`
- **Speed**: Fast (2-3 seconds)
- **Cost**: Very low (~$0.0002/request)
- **Accuracy**: High

### API Limits (Free Tier)
- **RPM**: 15 requests/minute
- **RPD**: 1,500 requests/day
- **TPM**: 1M tokens/minute

### Generation Config
```javascript
{
  temperature: 0.4,      // Focused responses
  topK: 32,              // Vocabulary limit
  topP: 1,               // Nucleus sampling
  maxOutputTokens: 500   // Max length
}
```

---

## 🐛 Troubleshooting

### Error: "API key not configured"
```bash
# Check .env file
cat .env | grep GEMINI

# Update Supabase secret
supabase secrets set GEMINI_API_KEY=your_key
```

### Error: "Failed to analyze image"
- ✅ Check API key validity
- ✅ Verify image format (JPEG, PNG, WebP)
- ✅ Reduce image size (<4MB)
- ✅ Check API quota

### Edge Function Logs
```bash
# View logs in Supabase Dashboard:
Edge Functions → analyze-image-gemini → Logs
```

---

## 📊 API Endpoints

### Edge Function
```
POST /functions/v1/analyze-image-gemini
```

**Request**:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response**:
```json
{
  "description": "This is an Apple iPhone 13...",
  "success": true
}
```

### Gemini API
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=API_KEY
```

---

## 🎯 Best Practices

### Image Optimization
```javascript
// Resize before upload
const maxWidth = 800;
const maxHeight = 600;

// Compress quality
const quality = 0.8;

// Supported formats
const formats = ['image/jpeg', 'image/png', 'image/webp'];
```

### Error Handling
```typescript
try {
  const result = await analyzeImageWithGemini(base64);
  setDescription(result.description);
} catch (error) {
  console.error('AI analysis failed:', error);
  // Fallback to manual entry
  setShowManualInput(true);
}
```

### Rate Limiting
```typescript
// Debounce requests
const debouncedAnalyze = debounce(analyzeImage, 1000);

// Show loading state
setIsAnalyzing(true);
await analyzeImage();
setIsAnalyzing(false);
```

---

## 🔐 Security Checklist

- [ ] API key stored in Supabase secrets
- [ ] API key NOT in frontend code
- [ ] API key NOT committed to Git
- [ ] .env file in .gitignore
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Error messages sanitized
- [ ] Usage monitoring active

---

## 📚 Resources

### Documentation
- [Gemini API Docs](https://ai.google.dev/docs)
- [Full Integration Guide](./GEMINI_INTEGRATION_GUIDE.md)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Files
- **Edge Function**: `supabase/functions/analyze-image-gemini/index.ts`
- **API Client**: `src/db/api.ts`
- **Usage Example**: `src/pages/ReportLostPage.tsx`

### Support
- [Google AI Studio](https://aistudio.google.com)
- [Supabase Support](https://supabase.com/support)

---

## 🎉 Quick Test

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to
http://localhost:5173/report-lost

# 3. Upload image & click "Analyze Image with AI"

# 4. Check console for logs
# Open DevTools → Console
```

---

## 📈 Monitoring

### Check Usage
```bash
# Google Cloud Console
https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com

# View metrics:
- Requests per day
- Error rate
- Latency
- Quota usage
```

### Set Alerts
```bash
# Google Cloud Console → Monitoring → Alerting
- Alert when quota > 80%
- Alert on error rate > 5%
- Alert on high latency
```

---

## 💡 Tips

### Optimize Costs
- Resize images before upload
- Cache descriptions in database
- Implement request throttling
- Use batch processing when possible

### Improve Accuracy
- Use clear, well-lit images
- Focus on the item
- Include distinctive features
- Avoid blurry images

### Enhance UX
- Show loading animations
- Provide progress feedback
- Allow manual editing
- Offer retry option

---

## 🔄 Update Model

To switch to a different Gemini model:

```typescript
// In: supabase/functions/analyze-image-gemini/index.ts

// Change this line:
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

// To another model:
// gemini-2.5-flash-lite (current - fastest, cheapest)
// gemini-2.5-flash (faster, more accurate)
// gemini-2.5-pro (most accurate, slower)
```

Then redeploy:
```bash
# Redeploy edge function
supabase functions deploy analyze-image-gemini
```

---

## ✅ Status Check

```bash
# Check if everything is configured:

# 1. API key in .env
grep GEMINI .env

# 2. Edge function deployed
# Check Supabase Dashboard → Edge Functions

# 3. Secret set
# Check Supabase Dashboard → Settings → Secrets

# 4. Test endpoint
curl -X POST https://your-project.supabase.co/functions/v1/analyze-image-gemini \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"data:image/jpeg;base64,..."}'
```

---

**Model**: Gemini 2.5 Flash Lite  
**Status**: ✅ Configured & Ready  
**Version**: 1.0  
**Last Updated**: December 30, 2024

---

**Need more details?** See [GEMINI_INTEGRATION_GUIDE.md](./GEMINI_INTEGRATION_GUIDE.md)
