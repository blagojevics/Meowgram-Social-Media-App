# 🔥 GET REAL FIREBASE CREDENTIALS - STEP BY STEP

## 🚨 CRITICAL: You MUST replace placeholder values with real Firebase credentials!

Your current `.env` file has placeholder values like `your_api_key_here` which is why you're getting the API key error.

## 📋 Step-by-Step Instructions:

### Step 1: Create/Access Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or select existing project
3. If creating new:
   - Name: `meowgram` (or any name you prefer)
   - Enable Google Analytics (optional)
   - Click "Create project"

### Step 2: Create Web App

1. In your Firebase project dashboard
2. Click the **Web icon** `</>` (or "Add app" if no apps exist)
3. App nickname: `meowgram-web`
4. Check "Also set up Firebase Hosting" (optional)
5. Click "Register app"

### Step 3: Copy Configuration

You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-ABCDEFGHIJ",
};
```

### Step 4: Update Your .env File

Replace the values in your `.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...  # ← Replace with real API key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
```

### Step 5: Enable Authentication

1. In Firebase Console → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Enable **Google** provider:
   - Click Google → Enable
   - Add your email as test user if needed
6. In **Authorized domains**, add: `localhost` (it should be there by default)

### Step 6: Set up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for now)
4. Select a location (closest to your users)

### Step 7: Set up Storage

1. Go to **Storage**
2. Click "Get started"
3. Choose "Start in test mode"
4. Select same location as Firestore

### Step 8: Restart Development Server

After updating `.env`:

```bash
npm run dev
```

## 🔍 How to Verify It's Working

After updating your credentials, check the browser console:

- ✅ Should see: "Firebase initialized successfully with real credentials"
- ❌ If still seeing: "Using placeholder configuration" → credentials not updated properly

## 🚨 Common Issues

1. **Forgot to restart dev server** after updating `.env`
2. **Typos in .env** (no spaces around `=`)
3. **Wrong project selected** in Firebase Console
4. **Google provider not enabled** in Authentication settings

## 📞 Need Help?

If you're stuck on any step, let me know which step you're on and I can provide more detailed guidance!
