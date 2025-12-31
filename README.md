# Welcome to Your Miaoda Project
Miaoda Application Link URL
    URL:https://medo.dev/projects/app-8e6wgm5ndzi9

# FINDIT.AI - Multi-Campus Lost & Found Application

## 🎯 Project Overview

FINDIT.AI is a modern, highly interactive web application designed to help campus community members report and search for lost or found items across multiple campus locations. Built with a trust-first design philosophy, it provides a seamless user experience for reuniting people with their belongings.

## ✨ Key Features

- **🤖 AI-Powered Image Analysis**: Automatic item description generation using Gemini 2.5 Flash Lite
- **📦 Lost Items Management**: Report and search for lost items with detailed descriptions
- **🔍 Found Items Management**: Report and browse found items to help return them to owners
- **📜 History of Returns**: View successful reunions and inspiring success stories
- **🔎 Real-time Search**: Instant search with debouncing across all item categories
- **📅 Date Filtering**: Filter items by date range using an intuitive calendar picker
- **📱 Responsive Design**: Seamless experience on desktop and mobile devices
- **💾 My Reports**: Track your submitted reports with localStorage-based session management
- **🎨 Modern UI**: Trust-inspiring blue theme with smooth animations and card-based layout

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Installation

```bash
# Step 1: Clone or download the project
# Step 2: Navigate to the project directory
cd app-8e6wgm5ndzi9

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev -- --host 127.0.0.1

# Alternative if step 4 fails:
npx vite --host 127.0.0.1
```

### Environment Setup

The application uses Supabase for backend services. Environment variables are already configured in the `.env` file.

### 🤖 AI-Powered Image Analysis (Gemini 2.5 Flash Lite)

FINDIT.AI includes AI-powered image analysis to automatically generate detailed item descriptions from uploaded images.

**Quick Setup (3 Steps)**:

1. **Get API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key
2. **Update .env**: Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key
3. **Set Supabase Secret**: Update `GEMINI_API_KEY` in Supabase Dashboard (Settings → Edge Functions → Secrets)

**Automated Setup**:
```bash
chmod +x setup-gemini.sh
./setup-gemini.sh
```

**Documentation**:
- **[GEMINI_INTEGRATION_GUIDE.md](./GEMINI_INTEGRATION_GUIDE.md)** - Comprehensive setup guide
- **[GEMINI_QUICK_REFERENCE.md](./GEMINI_QUICK_REFERENCE.md)** - Quick reference
- **[GEMINI_SUMMARY.md](./GEMINI_SUMMARY.md)** - Implementation overview

**Features**:
- ⚡ Fast analysis (2-3 seconds)
- 🎯 Accurate item descriptions
- 💰 Very low cost (~$0.0002/request)
- 🔒 Secure API key management

## 📚 Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user guide for using the application
- **[APPLICATION_SUMMARY.md](./APPLICATION_SUMMARY.md)** - Technical overview and architecture
- **[VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)** - Complete feature checklist
- **[TODO.md](./TODO.md)** - Development tracking and progress

## 🏗️ Project Structure

```
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── ItemCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── DateRangeFilter.tsx
│   │   ├── layouts/         # Layout components
│   │   │   └── Header.tsx
│   │   └── ui/              # shadcn/ui components
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx
│   │   ├── LostItemsPage.tsx
│   │   ├── FoundItemsPage.tsx
│   │   ├── ReportLostPage.tsx
│   │   ├── ReportFoundPage.tsx
│   │   ├── HistoryPage.tsx
│   │   └── ItemDetailPage.tsx
│   ├── db/                  # Database layer
│   │   ├── supabase.ts      # Supabase client
│   │   └── api.ts           # API functions
│   ├── types/               # TypeScript types
│   │   └── types.ts
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── routes.tsx           # Route configuration
│   ├── App.tsx              # Main app component
│   └── index.css            # Global styles
├── public/                  # Static assets
└── supabase/               # Supabase migrations
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Google Gemini 2.5 Flash Lite
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Build Tool**: Vite
- **Icons**: Lucide React

## 🎨 Design System

### Color Palette
- **Primary**: Trust-inspiring blue (#2563EB / HSL 217 91% 60%)
- **Background**: Clean white (#FFFFFF)
- **Secondary**: Soft gray (#F3F4F6)
- **Text**: Dark gray (#374151)

### Key Design Principles
- Trust-first design with professional appearance
- Card-based grid layout with ample white space
- Smooth animations (200-300ms transitions)
- Clear visual hierarchy
- Responsive breakpoints for all devices

## 📊 Database Schema

### Tables

1. **lost_items**
   - Stores reported lost items
   - Fields: item_name, description, category, date_lost, location, campus, contact info
   - 8 test records included

2. **found_items**
   - Stores reported found items
   - Fields: item_name, description, category, date_found, location, campus, contact info
   - 8 test records included

3. **returned_items**
   - Stores history of successful returns
   - Fields: item details, owner info, finder info, return_date, story
   - 6 test records included

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Type checking
npm run type-check
```

### Code Quality

- ✅ TypeScript strict mode enabled
- ✅ No lint errors (84 files checked)
- ✅ Proper type safety throughout
- ✅ Clean component architecture
- ✅ Consistent code style

## 📱 Features in Detail

### Search Functionality
- Real-time search with 300ms debouncing
- Searches across: item names, descriptions, categories, locations, campuses
- Separate search systems for lost and found items
- Results update instantly

### Date Filtering
- Calendar-based date range picker
- Filter by date lost/found/returned
- Clear filter option
- Persistent across page navigation

### Form Validation
- Real-time validation with helpful error messages
- Required field indicators
- Email and phone validation
- Success notifications

### My Reports
- localStorage-based tracking
- View all your submitted reports
- Persists across browser sessions
- Quick access from report pages

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

Copyright © 2025 FINDIT.AI

## 🤝 Support

For technical issues or questions:
1. Check the [USER_GUIDE.md](./USER_GUIDE.md)
2. Review the [APPLICATION_SUMMARY.md](./APPLICATION_SUMMARY.md)
3. Contact your campus IT support

## 🎉 Acknowledgments

Built with modern web technologies and best practices to provide a seamless lost and found experience for campus communities.

## Project Directory

```
├── README.md # Documentation
├── components.json # Component library configuration
├── index.html # Entry file
├── package.json # Package management
├── postcss.config.js # PostCSS configuration
├── public # Static resources directory
│   ├── favicon.png # Icon
│   └── images # Image resources
├── src # Source code directory
│   ├── App.tsx # Entry file
│   ├── components # Components directory
│   ├── context # Context directory
│   ├── db # Database configuration directory
│   ├── hooks # Common hooks directory
│   ├── index.css # Global styles
│   ├── layout # Layout directory
│   ├── lib # Utility library directory
│   ├── main.tsx # Entry file
│   ├── routes.tsx # Routing configuration
│   ├── pages # Pages directory
│   ├── services # Database interaction directory
│   ├── types # Type definitions directory
├── tsconfig.app.json # TypeScript frontend configuration file
├── tsconfig.json # TypeScript configuration file
├── tsconfig.node.json # TypeScript Node.js configuration file
└── vite.config.ts # Vite configuration file
```

## Tech Stack

Vite, TypeScript, React, Supabase

## Development Guidelines

### How to edit code locally?

You can choose [VSCode](https://code.visualstudio.com/Download) or any IDE you prefer. The only requirement is to have Node.js and npm installed.

### Environment Requirements

```
# Node.js ≥ 20
# npm ≥ 10
Example:
# node -v   # v20.18.3
# npm -v    # 10.8.2
```

### Installing Node.js on Windows

```
# Step 1: Visit the Node.js official website: https://nodejs.org/, click download. The website will automatically suggest a suitable version (32-bit or 64-bit) for your system.
# Step 2: Run the installer: Double-click the downloaded installer to run it.
# Step 3: Complete the installation: Follow the installation wizard to complete the process.
# Step 4: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### Installing Node.js on macOS

```
# Step 1: Using Homebrew (Recommended method): Open Terminal. Type the command `brew install node` and press Enter. If Homebrew is not installed, you need to install it first by running the following command in Terminal:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Alternatively, use the official installer: Visit the Node.js official website. Download the macOS .pkg installer. Open the downloaded .pkg file and follow the prompts to complete the installation.
# Step 2: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### After installation, follow these steps:

```
# Step 1: Download the code package
# Step 2: Extract the code package
# Step 3: Open the code package with your IDE and navigate into the code directory
# Step 4: In the IDE terminal, run the command to install dependencies: npm i
# Step 5: In the IDE terminal, run the command to start the development server: npm run dev -- --host 127.0.0.1
# Step 6: if step 5 failed, try this command to start the development server: npx vite --host 127.0.0.1
```

### How to develop backend services?

Configure environment variables and install relevant dependencies.If you need to use a database, please use the official version of Supabase.

## Learn More

You can also check the help documentation: Download and Building the app（ [https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en](https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en)）to learn more detailed content.
