# Firebase Setup Guide

## Prerequisites
- Firebase project created at https://console.firebase.google.com/
- Firebase Authentication enabled with Email/Password and Google sign-in methods

## Configuration Steps

1. **Get Firebase Config**
   - Go to your Firebase project console
   - Click on the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click on the web app icon (</>)
   - Copy the firebaseConfig object

2. **Update Firebase Configuration**
   - Open `firebase.ts` in the root directory
   - Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

3. **Enable Authentication Methods**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Enable "Google" provider and configure OAuth consent screen

4. **Run the Application**
   ```bash
   npm run dev
   ```

## Features Added

- **Authentication**: Email/password and Google sign-in
- **Profile Management**: Complete profile settings with tabs for:
  - Profile Information (name, email, role, phone, organization)
  - Security (password change with re-authentication)
  - Notifications (email, device alerts, system updates, weekly reports)
  - Accessibility (high contrast, large text, screen reader, keyboard navigation)
- **Dashboard Integration**: Profile settings accessible from dashboard sidebar
- **Responsive Design**: Mobile-friendly interface with modern UI

## Notes

- The Firebase configuration is currently using placeholder values
- You need to replace them with your actual Firebase project credentials
- Make sure to enable the required authentication providers in your Firebase console
- The app includes proper error handling for Firebase authentication errors
