# Chess Platform Deployment Guide

This guide covers multiple deployment options for the Chess Platform project using GitHub and other platforms.

## 🎮 QUICK START - Play Chess on GitHub Pages NOW!

Your chess game should be automatically deploying to GitHub Pages. Here's how to access it:

### Step 1: Enable GitHub Pages (One-time setup)
1. Go to your GitHub repository: `https://github.com/devslayr/Essentials-of-IT-Ethics---Assignment3`
2. Click on **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **"GitHub Actions"**
5. Save the settings

### Step 2: Wait for Deployment
- The GitHub Actions workflow is now running automatically
- You can check the progress in the **Actions** tab of your repository
- Wait for the green checkmark ✅

### Step 3: Play Chess Online!
Once deployed, your chess game will be available at:
**https://devslayr.github.io/Essentials-of-IT-Ethics---Assignment3/**

## 🚀 What You'll Get on GitHub Pages

**Perfect for playing chess online:**
- ✅ Full chess gameplay with all rules
- ✅ Beautiful interactive chess board
- ✅ Move validation and legal move highlighting  
- ✅ Check/Checkmate/Stalemate detection
- ✅ Move history and notation
- ✅ Multiple themes and board styles
- ✅ Responsive design (works on mobile)
- ❌ No multiplayer (GitHub Pages is static hosting)

## 🔧 Troubleshooting GitHub Pages

### If you see a README instead of the chess game:
1. Check that GitHub Pages source is set to "GitHub Actions"
2. Look at the Actions tab to see if the deployment succeeded
3. Wait a few minutes for DNS propagation

### If the deployment fails:
1. Go to your repository's **Actions** tab
2. Click on the failed workflow run
3. Check the error logs
4. Common fix: Make sure all files are committed and pushed

## Quick Start Options

### 1. GitHub Pages (Client-Only) - Simplest Option

GitHub Pages is perfect for deploying the client-side chess game without multiplayer features.

**Steps:**

1. **Enable GitHub Pages in your repository:**
   - Go to your GitHub repository settings
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"

2. **Deploy automatically:**
   ```bash
   npm run deploy:pages
   ```
   Or simply push to main branch - the GitHub Actions workflow will automatically deploy!

3. **Access your site:**
   - Your chess game will be available at: `https://yourusername.github.io/repository-name`

**What's included:**
- ✅ Full chess gameplay (solo mode)
- ✅ Chess engine with move validation
- ✅ Multiple themes and settings
- ❌ No multiplayer (requires server)

### 2. Full-Stack Deployment (Complete Experience)

For the complete chess experience with multiplayer, you need a platform that supports Node.js servers.

## Deployment Platforms

### Option A: Railway (Recommended)

Railway offers easy deployment with GitHub integration:

1. **Sign up at [Railway](https://railway.app)**
2. **Connect your GitHub account**
3. **Deploy from GitHub:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your chess platform repository
   - Railway will automatically detect the Node.js app

4. **Environment Setup:**
   - Railway will automatically build using our Dockerfile
   - The app will be available at a Railway-provided URL

### Option B: Render

1. **Sign up at [Render](https://render.com)**
2. **Create a new Web Service:**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Choose "Node" environment

### Option C: Heroku

1. **Install Heroku CLI and login:**
   ```bash
   brew install heroku/brew/heroku  # macOS
   heroku login
   ```

2. **Create and deploy:**
   ```bash
   heroku create your-chess-app-name
   git push heroku main
   ```

### Option D: Docker Deployment

For any platform supporting Docker:

1. **Local testing:**
   ```bash
   docker-compose up
   ```

2. **Deploy to container platforms:**
   - Build image: `docker build -t chess-platform .`
   - Deploy to any Docker-compatible platform

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Continuous Integration

The project includes GitHub Actions that automatically:
- ✅ Run tests on every push
- ✅ Build the application
- ✅ Deploy to GitHub Pages (if enabled)
- ✅ Test on multiple Node.js versions

## Configuration Options

### Environment Variables

For full-stack deployment, you can configure:

```bash
# Server port (default: 3001)
PORT=3001

# Environment mode
NODE_ENV=production

# WebSocket configuration (optional)
WS_PORT=3002
```

### Custom Domain (GitHub Pages)

1. Add a `CNAME` file to your repository root:
   ```
   your-custom-domain.com
   ```

2. Configure your domain's DNS to point to GitHub Pages

## Troubleshooting

### Common Issues

1. **GitHub Pages shows 404:**
   - Ensure the workflow completed successfully
   - Check that "Pages" is enabled in repository settings

2. **Multiplayer not working on GitHub Pages:**
   - GitHub Pages only supports static sites
   - Use a full-stack platform like Railway or Render

3. **Build failures:**
   - Check Node.js version compatibility
   - Ensure all dependencies are installed
   - Review GitHub Actions logs

### Getting Help

- Check the GitHub Actions logs for deployment issues
- Verify all required files are committed to your repository
- Ensure package.json scripts are correctly configured

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   Deployment    │
│                 │    │                  │    │                 │
│ • Source Code   │    │ • Build & Test   │    │ • GitHub Pages  │
│ • Workflows     │    │ • Docker Build   │    │ • Railway       │
│ • Dependencies  │    │ • Auto Deploy    │    │ • Render        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Next Steps

1. **Choose your deployment method** based on your needs
2. **Enable GitHub Actions** by pushing to your repository
3. **Test your deployment** to ensure everything works
4. **Set up custom domain** (optional)
5. **Monitor your application** using platform-specific tools

Your Chess Platform is now ready for the world! 🎉