#!/bin/bash

# Gemini API Key Setup Script for FINDIT.AI
# This script helps you configure your Gemini API key

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║          🤖 FINDIT.AI - Gemini API Key Setup 🤖                     ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will help you configure Google Gemini 2.5 Flash Lite API"
echo "for AI-powered image analysis in your Lost & Found application."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📋 Step 1: Get Your Gemini API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Visit: https://aistudio.google.com/app/apikey"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API Key'"
echo "4. Copy the generated API key"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prompt for API key
read -p "📝 Enter your Gemini API Key (or press Enter to skip): " api_key

if [ -z "$api_key" ]; then
    echo ""
    echo "⚠️  Skipped: No API key entered."
    echo "You can manually update the .env file later."
    echo ""
    echo "Add this line to your .env file:"
    echo "VITE_GEMINI_API_KEY=your_actual_api_key_here"
    echo ""
else
    # Validate API key format (should start with AIza)
    if [[ ! $api_key =~ ^AIza ]]; then
        echo ""
        echo "⚠️  Warning: API key doesn't start with 'AIza'"
        echo "This might not be a valid Gemini API key."
        echo ""
        read -p "Continue anyway? (y/n): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo "Setup cancelled."
            exit 0
        fi
    fi

    # Update .env file
    if grep -q "VITE_GEMINI_API_KEY=" .env; then
        # Replace existing key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|VITE_GEMINI_API_KEY=.*|VITE_GEMINI_API_KEY=$api_key|" .env
        else
            # Linux
            sed -i "s|VITE_GEMINI_API_KEY=.*|VITE_GEMINI_API_KEY=$api_key|" .env
        fi
        echo ""
        echo "✅ API key updated in .env file!"
    else
        # Add new key
        echo "" >> .env
        echo "# Gemini API Key for AI-powered image analysis" >> .env
        echo "VITE_GEMINI_API_KEY=$api_key" >> .env
        echo ""
        echo "✅ API key added to .env file!"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Step 2: Configure Supabase Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "The API key also needs to be set as a Supabase secret for the edge function."
echo ""
echo "Option A: Using Supabase Dashboard"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to: Settings → Edge Functions → Secrets"
echo "  3. Find 'GEMINI_API_KEY'"
echo "  4. Click 'Edit' and paste your API key"
echo "  5. Save changes"
echo ""
echo "Option B: Using Supabase CLI (if installed)"
echo "  Run: supabase secrets set GEMINI_API_KEY=your_api_key_here"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI detected!"
    echo ""
    if [ ! -z "$api_key" ]; then
        read -p "Would you like to set the secret now using Supabase CLI? (y/n): " set_secret
        if [[ $set_secret =~ ^[Yy]$ ]]; then
            echo ""
            echo "Setting Supabase secret..."
            supabase secrets set GEMINI_API_KEY="$api_key"
            if [ $? -eq 0 ]; then
                echo "✅ Supabase secret set successfully!"
            else
                echo "❌ Failed to set Supabase secret. Please set it manually."
            fi
        fi
    fi
else
    echo "ℹ️  Supabase CLI not found. Please set the secret manually using the dashboard."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Step 3: Verify Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To test the integration:"
echo "  1. Start the development server: npm run dev"
echo "  2. Navigate to 'Report Lost' or 'Report Found' page"
echo "  3. Upload an image"
echo "  4. Click 'Analyze Image with AI'"
echo "  5. Verify that a description is generated"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For detailed information, see: GEMINI_INTEGRATION_GUIDE.md"
echo ""
echo "Key Features:"
echo "  • Model: Gemini 2.5 Flash Lite"
echo "  • Automatic item description generation"
echo "  • Category, color, and brand detection"
echo "  • Fast and cost-effective"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Your Gemini API integration is now configured."
echo "Remember to keep your API key secure and never commit it to version control."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Need help? Check the troubleshooting section in GEMINI_INTEGRATION_GUIDE.md"
echo ""
