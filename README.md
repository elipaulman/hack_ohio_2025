# Indoor Navigator - Scott Lab

A Progressive Web App for indoor positioning using device sensors (accelerometer, gyroscope, compass) for the HackOHI/O 2025 Friction Finder Challenge.

## Contributors
- Elijah Paulman
- Caue Faria
- Arnac Chennamaneni
- Artur Ulsenheimer

---

## Problem Statement

Navigating large buildings like Scott Laboratory can be frustrating and time-consuming. Finding specific rooms, especially in the basement, often involves:
- Getting lost in maze-like corridors
- Asking for directions multiple times
- Wasting time backtracking
- Missing appointments due to navigation delays

**Our Solution**: A web-based indoor positioning system that tracks your location in real-time using only your smartphone's built-in sensors—no WiFi infrastructure needed.

## Features

### Core Functionality
- **Real-time Position Tracking**: Uses dead reckoning with device sensors
- **Step Detection**: Advanced algorithm with adaptive threshold and calibration
- **Heading Fusion**: Combines compass and gyroscope for accurate direction
- **Interactive Floor Plan**: Pan, zoom, and tap to set position
- **Visual Feedback**: Blue dot with direction arrow and path history

### Accuracy Improvements
- **Sensor Fusion**: Complementary filter combines gyroscope (short-term) and compass (long-term)
- **Adaptive Step Detection**: Learns your walking pattern
- **Zero Velocity Update (ZUPT)**: Detects when standing still to prevent drift
- **Confidence Tracking**: Shows accuracy degradation over time
- **Easy Recalibration**: One-tap position correction

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3
- **Sensors**: DeviceMotionEvent, DeviceOrientationEvent
- **PWA**: Service Worker for offline capability
- **No Backend Required**: Pure client-side application

## File Structure

```
indoor-nav/
├── index.html              # Main HTML structure
├── styles.css              # Mobile-first responsive styling
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline caching
├── js/
│   ├── app.js             # Main app controller
│   ├── sensor-manager.js  # iOS permission & sensor data
│   ├── step-detector.js   # Step detection algorithm
│   ├── position-tracker.js # Dead reckoning
│   └── canvas-renderer.js # Floor plan rendering
└── assets/
    └── scott-lab-basement.png
```

## How It Works

### 1. Dead Reckoning Algorithm
- Detects steps using accelerometer peak detection
- Tracks direction using compass and gyroscope fusion
- Calculates displacement: `distance = steps × step_length`
- Updates position: `new_position = old_position + (distance × direction_vector)`

### 2. Step Detection
- Monitors acceleration magnitude for spikes
- Uses peak-valley pattern recognition
- Filters false positives (phone movement, standing)
- Adapts threshold based on user's walking pattern

### 3. Heading Fusion
- **Gyroscope**: High-frequency, accurate short-term, but drifts
- **Compass**: Low-frequency, noisy, but no drift
- **Complementary Filter**: `heading = 0.98 × gyro + 0.02 × compass`

### 4. Accuracy Management
- **High (0-20 steps)**: ±2-3 meters drift
- **Medium (20-50 steps)**: ±3-5 meters drift
- **Low (50+ steps)**: ±5-7 meters drift
- **Solution**: Regular recalibration at known landmarks

## Deployment Instructions

### Option 1: GitHub Pages (Recommended)

1. **Create a GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Indoor Navigator app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/indoor-navigator.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`
   - Click Save

3. **Access your app**:
   - URL: `https://YOUR_USERNAME.github.io/indoor-navigator/`
   - Share this URL with your iPhone

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

3. **Follow prompts**:
   - Authorize Netlify
   - Create new site
   - Publish directory: `.` (current directory)

4. **Get your URL**: Netlify will provide a URL like `https://your-app-name.netlify.app`

### Option 3: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Access your app**: Vercel provides URL like `https://your-app-name.vercel.app`

### Option 4: Local Testing (Development Only)

**Important**: Sensor permissions require HTTPS. Local testing won't work for sensors.

```bash
# Simple HTTP server (for UI testing only, sensors won't work)
python -m http.server 8000
# or
npx http-server -p 8000
```

## Testing on iPhone

### 1. Deploy to HTTPS (Required for Sensors)
- Use GitHub Pages, Netlify, or Vercel
- Sensors only work on HTTPS connections

### 2. Open in Safari
- Open the deployment URL in Safari (not Chrome)
- iOS requires Safari for DeviceMotion API

### 3. Grant Permissions
- Tap "Start Tracking" button
- iOS will prompt for motion sensor access
- Tap "Allow"

### 4. Add to Home Screen (Optional)
- Tap Share button
- Select "Add to Home Screen"
- App will behave like a native app

### 5. Calibrate and Test
1. **Set Initial Position**: Tap the floor plan where you're standing
2. **Calibrate Steps**: Walk 10 steps normally, tap "Done Calibrating"
3. **Start Walking**: The blue dot should move with you
4. **Recalibrate**: Every 2-3 minutes, tap "Recalibrate" and set new position

## Calibration Tips

### Initial Setup
1. Find a landmark on the floor plan (elevator, stairwell, room number)
2. Stand at that landmark
3. Tap the corresponding spot on the floor plan
4. Orient yourself North (use compass app if needed)

### Step Calibration
1. Walk normally for 10 steps in a straight line
2. Don't run or shuffle—use your normal walking pace
3. The app learns your step pattern

### Ongoing Accuracy
- Recalibrate every 2-3 minutes at known landmarks
- Stand still when setting position (ZUPT helps)
- Hold phone in consistent orientation (portrait recommended)

## Known Limitations

### Expected Behavior
- **Drift**: Position accuracy degrades ~10cm per step
- **Compass Interference**: Metal structures cause heading errors
- **Phone Orientation**: Best when held upright in portrait mode
- **Movement**: Must be walking—doesn't work for running or shuffling

### What Won't Work
- Elevators (no altitude tracking)
- Standing still tracking (intentional—prevents false steps)
- Sub-meter precision without infrastructure (WiFi/beacons)

## Future Enhancements

### Accuracy Improvements
- [ ] Particle filter for position estimation
- [ ] Map-matching (snap to hallways, avoid walls)
- [ ] Machine learning step classifier
- [ ] Barometer for floor detection

### Features
- [ ] Multi-floor support
- [ ] Room search and routing
- [ ] Landmark-based auto-calibration
- [ ] Shared location (meet friends)
- [ ] Historical path replay

### Infrastructure Integration
- [ ] WiFi RSSI fingerprinting
- [ ] Bluetooth beacon support
- [ ] Building entrance auto-detection

## Development

### Run Locally (UI Only)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/indoor-navigator.git
cd indoor-navigator

# Start a local server
python -m http.server 8000

# Open http://localhost:8000
# Note: Sensors won't work without HTTPS
```

### Debug Mode
- Tap "Debug Info" in the app to see:
  - Raw sensor values
  - Step count and threshold
  - Position coordinates
  - Confidence metrics

## HackOHI/O 2025 Submission

### Challenge: Friction Finder (Honda)

**Problem**: Indoor navigation friction in Scott Laboratory
**Solution**: Sensor-based positioning without infrastructure
**Impact**: Reduces time wasted finding rooms, improves accessibility

### Demo Flow
1. Show problem: complex floor plan, easy to get lost
2. Open app on iPhone (PWA)
3. Set starting position
4. Walk around basement
5. Show real-time tracking
6. Demonstrate recalibration
7. Explain accuracy vs infrastructure tradeoff

### Technical Highlights
- Pure web tech—no app store needed
- Works offline (PWA)
- No server infrastructure required
- Advanced sensor fusion algorithms
- Mobile-first responsive design

## License

MIT License - HackOHI/O 2025 Project

---

**Built with ❤️ for HackOHI/O 2025**
