# Renova8 Production Deployment Guide

This guide walks you through deploying Renova8 to **Firebase App Hosting** for production use.

## Prerequisites

- Node.js 18+
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project (Project ID: `claude-476618`)
- GitHub repository connected to Firebase App Hosting

---

## Step 1: Firebase CLI Login

```bash
firebase login
```

---

## Step 2: Connect GitHub to Firebase App Hosting

If not already connected:

```bash
firebase apphosting:backends:create --project claude-476618
```

This will:
- Link your GitHub repository
- Set up automatic deployments on push to main
- Configure Cloud Build for your project

---

## Step 3: Set Up Secrets in Google Secret Manager

All secrets are managed via Google Secret Manager. Use Firebase CLI to set them:

### Frontend Secrets (App Hosting)

```bash
# Gemini API Key for frontend
firebase apphosting:secrets:set gemini-api-key --project claude-476618

# Firebase Web App Configuration
firebase apphosting:secrets:set firebase-api-key --project claude-476618
firebase apphosting:secrets:set firebase-messaging-sender-id --project claude-476618
firebase apphosting:secrets:set firebase-app-id --project claude-476618
```

### Backend Secrets (Cloud Functions)

```bash
# Stripe API Keys
firebase apphosting:secrets:set stripe-secret-key --project claude-476618
firebase apphosting:secrets:set stripe-webhook-secret --project claude-476618

# Google AI / Gemini API Key for backend
firebase apphosting:secrets:set google-api-key --project claude-476618
```

---

## Step 4: Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..

firebase deploy --only functions --project claude-476618
```

---

## Step 5: Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes --project claude-476618
```

---

## Step 6: Deploy Application

### Automatic Deployment (Recommended)

Push to the `main` branch and Firebase App Hosting will automatically:
1. Detect the push via GitHub webhook
2. Run Cloud Build to build your app
3. Deploy to Firebase App Hosting
4. Make it live at your App Hosting URL

### Manual Deployment

```bash
firebase apphosting:rollouts:create --project claude-476618
```

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

All environment variables are configured in `apphosting.yaml` and reference secrets from Google Secret Manager.

---

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://us-central1-claude-476618.cloudfunctions.net/stripeWebhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy the webhook signing secret
5. Set it: `firebase apphosting:secrets:set stripe-webhook-secret --project claude-476618`

---

## Firebase Web App Configuration

To get your Firebase Web App configuration:

1. Go to Firebase Console → Project Settings
2. Under "Your apps", select the Web app (or create one)
3. Copy the `firebaseConfig` values and set them as secrets

---

## Deployment Checklist

- [ ] Firebase CLI installed and logged in
- [ ] GitHub repo connected to Firebase App Hosting
- [ ] All secrets configured in Google Secret Manager
- [ ] Cloud Functions deployed
- [ ] Firestore rules and indexes deployed
- [ ] Stripe webhook configured
- [ ] Custom domain set up (optional)

---

## Useful Commands

```bash
# Check App Hosting status
firebase apphosting:backends:list --project claude-476618

# View deployment logs
firebase apphosting:rollouts:list --project claude-476618

# View Cloud Functions logs
firebase functions:log --project claude-476618

# Deploy everything
firebase deploy --project claude-476618
```

---

## Production URLs

- **App Hosting**: Check Firebase Console for your App Hosting URL
- **Functions**: https://us-central1-claude-476618.cloudfunctions.net
- **Console**: https://console.firebase.google.com/project/claude-476618

---

## Troubleshooting

### Build fails in Cloud Build

1. Check Cloud Build logs in Google Cloud Console
2. Ensure `apphosting.yaml` is valid
3. Verify all secrets are set

### Functions not deploying

```bash
firebase functions:log --project claude-476618
cd functions && npm run build && cd ..
firebase deploy --only functions --project claude-476618
```

### Secrets not available

```bash
# List all secrets
firebase apphosting:secrets:list --project claude-476618

# Grant access to a secret
firebase apphosting:secrets:grantaccess SECRET_NAME --project claude-476618
```

---

## Security Reminders

1. **Never commit** `.env` files or service account keys
2. **Rotate API keys** regularly
3. **Monitor** Firebase usage and set budget alerts
4. **Review** Firestore security rules periodically
5. All secrets stored in **Google Secret Manager** (encrypted at rest)

---

*Last Updated: December 2025*
