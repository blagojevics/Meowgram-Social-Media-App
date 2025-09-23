# 🔒 SECURITY GUIDELINES

## ⚠️ BEFORE PUSHING TO GITHUB

**CRITICAL**: Ensure the following security measures are in place before making this repository public:

### ✅ Environment Variables

- All sensitive credentials are in `.env` file (which is in `.gitignore`)
- No hardcoded API keys, secrets, or passwords in source code
- Use `import.meta.env.VITE_*` for all configuration values

### ✅ Private Keys & Service Accounts

- **NEVER** commit `keys/` folder or any `.json` service account files
- **NEVER** commit private keys, certificates, or credentials
- Use Firebase Admin SDK only on server-side (if needed)

### ✅ Git History

- Check git history doesn't contain any previously committed secrets
- If secrets were committed before, consider:
  1. Rotating all exposed credentials
  2. Using `git filter-branch` or BFG Repo Cleaner
  3. Creating a new repository from clean codebase

## 🛡️ SECURITY CHECKLIST

### Firebase Security

- [ ] All Firebase config uses environment variables
- [ ] Firestore Security Rules are properly configured
- [ ] Storage Security Rules are properly configured
- [ ] No admin privileges in client-side code

### Cloudinary Security

- [ ] Upload presets are configured with appropriate restrictions
- [ ] No API secret keys in client-side code (only cloud name and upload preset)

### General Security

- [ ] `.env` file is in `.gitignore`
- [ ] `keys/` folder is in `.gitignore`
- [ ] No hardcoded passwords or secrets anywhere
- [ ] All third-party API keys use environment variables

## 🔑 ENVIRONMENT VARIABLES REQUIRED

Create a `.env` file with these variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## 🚨 IF CREDENTIALS ARE EXPOSED

If you accidentally expose credentials:

1. **Immediately rotate all exposed keys**
2. **Revoke the exposed credentials**
3. **Update your `.env` file with new credentials**
4. **Clean git history if needed**
5. **Review security rules and access permissions**

## 📋 DEPLOYMENT SECURITY

For production deployments:

1. Use environment variables on hosting platform
2. Enable Firebase Security Rules
3. Restrict CORS origins
4. Enable authentication required for sensitive operations
5. Monitor usage and set up alerts for unusual activity
