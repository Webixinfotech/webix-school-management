# Render CI/CD Pipeline Setup Guide

## Overview
This guide explains how to set up automated deployment pipeline for BrainBuilder Backend on Render.

## 🚀 Automatic Deployment (Simple Method)

Render automatically deploys when you push to the connected branch (default: `main`).

### Steps:
1. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select branch: `main`

2. **Configure Environment Variables**
   
   Add these in Render Dashboard → Your Service → Environment:
   
   ```
   NODE_ENV=production
   PORT=5005
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brainbuilder
   JWT_SECRET=your_super_secure_jwt_secret_key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET_NAME=your_s3_bucket_name
   AWS_S3_REGION=us-east-1
   ```

3. **Auto-Deploy is Enabled**
   - Every push to `main` branch triggers automatic deployment
   - You'll see deployment status in Render Dashboard

## 🔧 GitHub Actions Pipeline (Advanced Method)

For better control with testing before deployment:

### 1. Get Render API Key
   - Go to Render Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Copy the key

### 2. Get Service ID
   - Go to your service in Render Dashboard
   - URL looks like: `https://dashboard.render.com/web/srv-xxxxx`
   - Copy the `srv-xxxxx` part

### 3. Get Deploy Hook URL
   - Go to your service → Settings
   - Scroll to "Deploy Hook" section
   - Copy the webhook URL

### 4. Add GitHub Secrets
   
   Go to GitHub Repository → Settings → Secrets and Variables → Actions
   
   Add these secrets:
   ```
   RENDER_API_KEY=your_render_api_key
   RENDER_SERVICE_ID=srv-xxxxx
   RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brainbuilder
   ```

### 5. Pipeline Workflow
   
   The `.github/workflows/deploy.yml` will:
   - ✅ Run tests on Node 18.x and 20.x
   - ✅ Run linter to check code quality
   - ✅ Verify build
   - ✅ Deploy to Render (only on main branch push)

## 📄 render.yaml (Infrastructure as Code)

The `render.yaml` file defines your service configuration. You can use it to:
- Deploy directly from Render Dashboard using the blueprint
- Version control your infrastructure
- Recreate services easily

### Deploy using render.yaml:
1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your repository
4. Render will read `render.yaml` and create services automatically

## 🔄 Deployment Workflow

```
Git Push → GitHub Actions → Tests → Build → Deploy to Render
```

### What happens on each push:
1. **Test Stage**: Runs unit tests and linting
2. **Build Stage**: Installs dependencies and verifies build
3. **Deploy Stage**: Triggers Render deployment (production only)

## 📊 Monitoring Deployments

### Render Dashboard:
- View deployment logs: Dashboard → Your Service → Logs
- Check health: Dashboard → Your Service → Health
- Monitor metrics: Dashboard → Your Service → Metrics

### GitHub Actions:
- View pipeline status: Repository → Actions tab
- Check test results and deployment logs

## 🛠 Useful Commands

### Check deployment status:
```bash
# Get service info
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID

# List deployments
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys
```

### Manual deployment trigger:
```bash
curl -X POST $RENDER_DEPLOY_HOOK_URL
```

## ⚠️ Important Notes

1. **MongoDB Access**: Whitelist `0.0.0.0/0` in MongoDB Atlas for Render IPs
2. **Environment Variables**: Never commit `.env` file - use Render dashboard
3. **Build Time**: First deployment may take 3-5 minutes
4. **Health Check**: Ensure `/health` endpoint returns 200 OK
5. **Free Tier**: Render free services sleep after 15 minutes of inactivity

## 🎯 Quick Start

### For automatic deployment (recommended for beginners):
1. ✅ Repository connected to Render
2. ✅ Environment variables configured
3. ✅ Push to `main` → Auto deploys!

### For CI/CD with testing:
1. ✅ Add GitHub secrets (API key, service ID, deploy hook)
2. ✅ Push to `main` → Tests run → Auto deploys if tests pass

## 📝 Troubleshooting

### Build fails:
- Check Render logs for error details
- Verify `package.json` has correct dependencies
- Ensure Node.js version compatibility (>=18.0.0)

### Deployment succeeds but app crashes:
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check application logs in Render Dashboard

### Tests fail in GitHub Actions:
- Ensure all required secrets are added
- Check if test dependencies are installed
- Verify test database connection

## 🔐 Security Best Practices

- ✅ Use Render environment variables (not `.env` files)
- ✅ Use GitHub secrets for sensitive data
- ✅ Enable 2FA on GitHub and Render accounts
- ✅ Regularly rotate API keys and secrets
- ✅ Review deployment logs for suspicious activity

## 📞 Support

- Render Docs: https://render.com/docs
- GitHub Actions Docs: https://docs.github.com/actions
- Project Issues: Create issue in GitHub repository
