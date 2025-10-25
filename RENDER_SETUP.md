# Render Deployment Configuration

## Quick Setup Checklist

### ✅ Step 1: Prepare Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### ✅ Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (easiest option)
3. Authorize Render to access your repositories

### ✅ Step 3: Create Static Site

1. Click **"New +"** button (top right)
2. Select **"Static Site"**
3. Choose your repository: `hack_ohio_2025`
4. Click **"Connect"**

### ✅ Step 4: Configure Settings

**Copy these exact settings:**

| Setting | Value |
|---------|-------|
| **Name** | `indoor-navigator-scott-lab` (or your choice) |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Build Command** | (leave empty) |
| **Publish Directory** | `.` (just a dot) |
| **Auto-Deploy** | ✅ Yes |

### ✅ Step 5: Advanced Settings (Optional)

Click **"Advanced"** to add custom settings:

**Headers (for security):**
- Not required, but already configured in `render.yaml` if you want to use it

**Environment Variables:**
- None needed for this static site

### ✅ Step 6: Deploy

1. Click **"Create Static Site"**
2. Render will start building (takes 1-2 minutes)
3. Watch the logs for any errors
4. Once complete, you'll see: ✅ **Live** with a green checkmark

### ✅ Step 7: Get Your URL

Your app will be live at:
```
https://indoor-navigator-scott-lab.onrender.com
```

Or whatever name you chose in Step 4.

---

## Alternative: Use render.yaml (Blueprint)

If you want automatic configuration, Render can read the `render.yaml` file included in this repo.

### To use Blueprint deployment:

1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Connect your repository
4. Render will automatically read `render.yaml` and configure everything

**Note:** The `render.yaml` in this project is already configured correctly!

---

## Testing Your Deployment

### 1. Check the URL
```bash
# Open in your default browser
open https://YOUR-APP-NAME.onrender.com

# Or manually visit in Safari on your iPhone
```

### 2. Verify HTTPS
- Render provides free SSL certificates automatically
- Your URL should show 🔒 (lock icon)
- This is REQUIRED for iOS sensor permissions

### 3. Test Sensors on iPhone
1. Open Safari (not Chrome!)
2. Navigate to your Render URL
3. Tap "Start Tracking"
4. iOS will prompt for motion sensor access
5. Tap "Allow"

---

## Render Configuration Details

### What Render Does:
1. ✅ Clones your repository
2. ✅ Serves static files from root directory
3. ✅ Provides HTTPS automatically (SSL certificate)
4. ✅ Gives you a `.onrender.com` subdomain
5. ✅ Auto-deploys on every git push to main branch

### What You Don't Need:
- ❌ No build command (pure HTML/JS/CSS)
- ❌ No environment variables
- ❌ No custom domains (unless you want one)
- ❌ No backend server

### Free Tier Limits:
- ✅ Unlimited static sites
- ✅ 100 GB bandwidth/month
- ✅ Free SSL certificates
- ✅ Auto-deploy from GitHub

**This is perfect for your hackathon project!**

---

## Troubleshooting

### Build Failed?
Check the logs in Render dashboard. Common issues:
- Wrong publish directory (should be `.`)
- Missing files (make sure everything is pushed)

### Site Not Loading?
- Check that deployment is "Live" (green checkmark)
- Verify URL is correct
- Clear browser cache

### Sensors Not Working on iPhone?
- ✅ Must use HTTPS (Render provides this automatically)
- ✅ Must use Safari browser (not Chrome)
- ✅ Must grant permissions when prompted
- ✅ Check browser console for errors

### Floor Plan Not Showing?
- Verify `assets/scott-lab-basement.png` exists in repo
- Check browser console for 404 errors
- Make sure file is committed and pushed

---

## Custom Domain (Optional)

If you want to use your own domain:

1. Go to your static site settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `indoor-nav.yourdomain.com`)
4. Follow DNS configuration instructions
5. Render will provision SSL automatically

---

## Auto-Deploy

Render automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature X"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Rebuild the site
# 3. Deploy the new version
# 4. Takes ~30-60 seconds
```

---

## Monitoring & Logs

### View Deployment Logs:
1. Go to Render Dashboard
2. Click on your static site
3. Click **"Logs"** tab
4. See real-time deployment and access logs

### Check Site Status:
- Green checkmark = Live and working
- Yellow spinner = Deploying
- Red X = Failed (check logs)

---

## Quick Commands Reference

```bash
# Initial deployment
git add .
git commit -m "Initial Render deployment"
git push origin main

# Update deployment
git add .
git commit -m "Update: feature description"
git push origin main

# Check git status
git status

# View current branch
git branch

# Create new branch (if needed)
git checkout -b feature-name
```

---

## Support

- Render Docs: https://render.com/docs/static-sites
- Render Status: https://status.render.com
- Community: https://community.render.com

---

**Your app is ready to deploy to Render! 🚀**

Just follow the steps above and you'll be live in minutes.
