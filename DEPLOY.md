# Quick Deployment Guide

## Deploy to Render (Recommended) ⭐

### 1. Push to GitHub (if not already done)
```bash
git add .
git commit -m "Indoor Navigator - Complete implementation"
git push origin main
```

### 2. Deploy to Render
1. **Sign up for Render**: https://render.com (free account)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure the following settings:

**Render Configuration:**
```
Name: indoor-navigator-scott-lab
Branch: main
Build Command: (leave empty)
Publish Directory: .
```

5. Click **"Create Static Site"**
6. Wait 2-3 minutes for deployment

### 3. Access Your App
Your app will be live at: `https://indoor-navigator-scott-lab.onrender.com`

Or you can use a custom domain if you have one!

### 4. Test on iPhone
1. Open Safari on your iPhone
2. Navigate to your Render URL
3. Tap **Start Tracking**
4. Allow sensor permissions when prompted
5. Tap the map to set your position
6. Start walking!

---

## Alternative Option 1: GitHub Pages

### 1. Push to GitHub (if not already done)
```bash
git add .
git commit -m "Indoor Navigator - Complete implementation"
git push origin main
```

### 2. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **main** branch
4. Click **Save**
5. Wait 1-2 minutes for deployment

### 3. Access Your App
Your app will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

Example: If your username is `elijahp` and repo is `hack_ohio_2025`:
- URL: `https://elijahp.github.io/hack_ohio_2025/`

---

## Alternative Option 2: Netlify

1. **Sign up for Netlify**: https://netlify.com (free account)
2. **Drag and drop your folder** into Netlify dashboard
3. **Get instant URL**: e.g., `https://indoor-nav-scott.netlify.app`
4. **Done!** No git required

---

## Troubleshooting

### Sensors Not Working?
- ✅ Must use **HTTPS** (GitHub Pages/Netlify provide this)
- ✅ Must use **Safari** on iOS (Chrome doesn't support DeviceMotion)
- ✅ Must **allow permissions** when prompted

### Floor Plan Not Loading?
- Check browser console for errors
- Verify `assets/scott-lab-basement.png` exists
- Make sure file path is correct in `canvas-renderer.js`

### Position Not Updating?
- Tap the map to set initial position first
- Make sure you clicked "Done" after setting position
- Check that you're walking (not standing still—ZUPT prevents false steps)
- Open Debug Info to see sensor values

---

## Quick Test Checklist

Before your demo:
- [ ] Deploy to HTTPS URL
- [ ] Test on actual iPhone (not simulator)
- [ ] Verify sensors work (check Debug Info)
- [ ] Practice setting initial position
- [ ] Walk 10 steps to calibrate
- [ ] Test recalibration feature
- [ ] Screenshot working app for backup

---

## Demo Tips

1. **Start with the problem**: Show how confusing Scott Lab basement is
2. **Show the solution**: Open app on phone, tap to set position
3. **Live demo**: Walk around and show tracking
4. **Explain accuracy**: Mention recalibration needs, drift over time
5. **Discuss tradeoff**: No infrastructure needed vs. perfect accuracy

Good luck with your HackOHI/O demo! 🚀
