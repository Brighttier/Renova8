# Renova8 Production Deployment Guide

This guide walks you through deploying Renova8 to Firebase App Hosting for production use.

## Prerequisites

- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project (Project ID: `claude-476618`)
- GitHub account with repository access

---

## Step 1: Firebase CLI Login

```bash
firebase login
```

---

## Step 2: Set Up Firebase Secrets

The application requires several secrets to be configured in Firebase. Run these commands:

### For Cloud Functions

```bash
# Stripe API Keys
firebase functions:secrets:set STRIPE_SECRET_KEY
# Enter your Stripe secret key when prompted

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# Enter your Stripe webhook secret when prompted

# Google AI / Gemini API Key
firebase functions:secrets:set GOOGLE_API_KEY
# Enter your Gemini API key when prompted
```

### For App Hosting (Frontend)

```bash
# Gemini API Key for frontend
firebase apphosting:secrets:set gemini-api-key

# Firebase Web App Configuration
firebase apphosting:secrets:set firebase-api-key
firebase apphosting:secrets:set firebase-messaging-sender-id
firebase apphosting:secrets:set firebase-app-id
```

---

## Step 3: Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_CLAUDE_476618` | Service account JSON for Firebase deployment |
| `VITE_API_KEY` | Gemini API key |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

### Getting the Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the entire JSON content
4. Add it as `FIREBASE_SERVICE_ACCOUNT_CLAUDE_476618` secret in GitHub

---

## Step 4: Deploy Cloud Functions

First, install dependencies and build:

```bash
cd functions
npm install
npm run build
cd ..
```

Deploy functions:

```bash
firebase deploy --only functions
```

---

## Step 5: Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Step 6: Deploy to Firebase Hosting

### Option A: Manual Deployment

```bash
# Build the frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Option B: Automatic Deployment (Recommended)

Push to the `main` branch, and GitHub Actions will automatically:
1. Build the application
2. Deploy to Firebase Hosting
3. Deploy Cloud Functions (if functions/* changed)

---

## Step 7: Configure Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS verification steps

---

## Environment Configuration

### Local Development (.env)

```env
VITE_API_KEY=your_gemini_api_key

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=claude-476618.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=claude-476618
VITE_FIREBASE_STORAGE_BUCKET=claude-476618.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Use emulators
VITE_USE_EMULATORS=false
```

### Production (Firebase App Hosting)

Environment variables are configured in `apphosting.yaml` and use Firebase secrets.

---

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://us-central1-claude-476618.cloudfunctions.net/stripeWebhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy the webhook signing secret
5. Set it using: `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`

---

## Firebase Web App Configuration

To get your Firebase Web App configuration:

1. Go to Firebase Console → Project Settings
2. Under "Your apps", select the Web app
3. Copy the `firebaseConfig` object values

```javascript
const firebaseConfig = {
  apiKey: "your_api_key",           // VITE_FIREBASE_API_KEY
  authDomain: "...",                 // Auto-configured
  projectId: "...",                  // Auto-configured
  storageBucket: "...",              // Auto-configured
  messagingSenderId: "...",          // VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "..."                       // VITE_FIREBASE_APP_ID
};
```

---

## Deployment Checklist

- [ ] Firebase CLI installed and logged in
- [ ] All Firebase secrets configured
- [ ] All GitHub secrets added
- [ ] Cloud Functions deployed successfully
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Hosting deployed
- [ ] Stripe webhook configured
- [ ] Custom domain set up (optional)

---

## Troubleshooting

### Functions not deploying

```bash
# Check logs
firebase functions:log

# Rebuild and redeploy
cd functions && npm run build && cd ..
firebase deploy --only functions
```

### Authentication not working

1. Verify Firebase Auth is enabled in Console
2. Check that authorized domains include your hosting URL
3. Verify environment variables are set correctly

### Stripe webhook errors

1. Check webhook secret is correct
2. Verify endpoint URL is correct
3. Check function logs for errors

---

## Production URLs

- **Hosting**: https://claude-476618.web.app
- **Functions**: https://us-central1-claude-476618.cloudfunctions.net
- **Firestore Console**: https://console.firebase.google.com/project/claude-476618/firestore

---

## Security Reminders

1. **Never commit** `.env` files or service account keys
2. **Rotate API keys** regularly
3. **Monitor** Firebase usage and set budget alerts
4. **Review** Firestore security rules periodically
5. **Keep dependencies** updated for security patches

---

*Last Updated: December 2025*
