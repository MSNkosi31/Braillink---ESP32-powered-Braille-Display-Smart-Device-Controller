# Firebase Setup Guide for Braillink Authentication

This guide will help you set up Firebase Authentication for the Braillink web application.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `braillink-esp32` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click "Email/Password" and enable it
   - **Google**: Click "Google" and enable it (you'll need to configure OAuth consent screen)

## 3. Set up Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (`</>`)
4. Register your app with a nickname (e.g., "Braillink Web App")
5. Copy the Firebase configuration object

## 5. Update Firebase Configuration

Replace the placeholder values in `app/config/firebase.ts` with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Set up Firestore Security Rules

In the Firestore Database section, go to "Rules" and update the rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read public data
    match /public/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## 7. Set up Google OAuth (Optional)

If you want to enable Google sign-in:

1. In Authentication > Sign-in method > Google
2. Click "Web SDK configuration"
3. Add your domain to authorized domains
4. Configure OAuth consent screen in Google Cloud Console

## 8. Environment Variables (Recommended)

For production, use environment variables instead of hardcoding the config:

1. Create a `.env` file in the project root:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

2. Update `app/config/firebase.ts` to use environment variables:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 9. Test the Setup

1. Start the development server: `npm run dev`
2. Go to `http://localhost:5173/`
3. Try creating a new account
4. Check the Firebase Console to see the new user in Authentication
5. Check Firestore to see the user document created

## 10. Production Considerations

- Update Firestore security rules for production
- Set up proper domain restrictions
- Configure email templates for password reset
- Set up monitoring and analytics
- Consider using Firebase App Check for additional security

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Make sure you've updated the Firebase configuration with your actual project details

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Firebase Console > Authentication > Settings

3. **"Firebase: Error (auth/api-key-not-valid)"**
   - Check that your API key is correct and not restricted

4. **Firestore permission denied**
   - Check your Firestore security rules
   - Make sure the user is authenticated

### Getting Help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
