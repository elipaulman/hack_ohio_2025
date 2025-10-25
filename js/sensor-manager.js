class SensorManager {
    constructor() {
        this.isActive = false;
        this.hasPermission = false;

        // Sensor data
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.rotationRate = { alpha: 0, beta: 0, gamma: 0 };
        this.compassHeading = 0;
        this.gyroHeading = 0;

        // Callbacks
        this.onMotionCallback = null;
        this.onOrientationCallback = null;

        // Filters for smoothing
        this.accelFilter = { x: [], y: [], z: [] };
        this.compassFilter = [];
        this.filterSize = 5;

        // Gyro integration for heading
        this.lastTimestamp = null;
        this.fusedHeading = 0;
        this.gyroWeight = 0.98; // Complementary filter weight

        // Screen orientation tracking
        this.screenOrientationAngle = 0;
        this.updateScreenOrientation();
    }

    async requestPermission() {
        // Check if we're on iOS 13+ which requires explicit permission
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {

            try {
                const motionPermission = await DeviceMotionEvent.requestPermission();
                const orientationPermission = await DeviceOrientationEvent.requestPermission();

                if (motionPermission === 'granted' && orientationPermission === 'granted') {
                    this.hasPermission = true;
                    return { success: true };
                } else {
                    return {
                        success: false,
                        error: 'Permission denied. Please grant access to motion sensors in your browser settings.'
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    error: `Permission request failed: ${error.message}`
                };
            }
        } else {
            // Not iOS 13+ or permission not required
            this.hasPermission = true;
            return { success: true };
        }
    }

    start() {
        if (!this.hasPermission) {
            console.error('Cannot start sensors without permission');
            return false;
        }

        if (this.isActive) {
            console.warn('Sensors already active');
            return true;
        }

        // Start listening to device motion
        window.addEventListener('devicemotion', this.handleMotion.bind(this));

        // Start listening to device orientation with absolute flag
        // This ensures we get compass-based orientation, not device-relative
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);

        // Also try the absolute orientation event (for devices that support it)
        window.addEventListener('deviceorientationabsolute', this.handleOrientation.bind(this));

        // Listen for screen orientation changes
        if (screen.orientation) {
            screen.orientation.addEventListener('change', this.handleScreenOrientationChange.bind(this));
        } else {
            // Fallback for older browsers
            window.addEventListener('orientationchange', this.handleScreenOrientationChange.bind(this));
        }

        this.isActive = true;
        this.lastTimestamp = Date.now();
        return true;
    }

    stop() {
        window.removeEventListener('devicemotion', this.handleMotion.bind(this));
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
        window.removeEventListener('deviceorientationabsolute', this.handleOrientation.bind(this));

        if (screen.orientation) {
            screen.orientation.removeEventListener('change', this.handleScreenOrientationChange.bind(this));
        } else {
            window.removeEventListener('orientationchange', this.handleScreenOrientationChange.bind(this));
        }

        this.isActive = false;
    }

    updateScreenOrientation() {
        // Get the current screen orientation angle
        if (screen.orientation) {
            // Modern API: returns 0, 90, 180, or 270
            this.screenOrientationAngle = screen.orientation.angle || 0;
        } else if (window.orientation !== undefined) {
            // Fallback for older iOS: returns -90, 0, 90, or 180
            this.screenOrientationAngle = window.orientation || 0;
        } else {
            this.screenOrientationAngle = 0;
        }
        console.log('Screen orientation angle:', this.screenOrientationAngle);
    }

    handleScreenOrientationChange() {
        this.updateScreenOrientation();
        // Force an immediate heading update
        console.log('Screen orientation changed to:', this.screenOrientationAngle);
    }

    handleMotion(event) {
        // Get acceleration data (excluding gravity)
        if (event.acceleration) {
            const rawAccel = {
                x: event.acceleration.x || 0,
                y: event.acceleration.y || 0,
                z: event.acceleration.z || 0
            };

            // Apply low-pass filter to reduce noise
            this.acceleration = this.applyLowPassFilter(rawAccel, this.accelFilter);
        } else if (event.accelerationIncludingGravity) {
            // Fallback for devices without separated acceleration
            this.acceleration = {
                x: event.accelerationIncludingGravity.x || 0,
                y: event.accelerationIncludingGravity.y || 0,
                z: event.accelerationIncludingGravity.z || 0
            };
        }

        // Get rotation rate (gyroscope)
        if (event.rotationRate) {
            this.rotationRate = {
                alpha: event.rotationRate.alpha || 0,
                beta: event.rotationRate.beta || 0,
                gamma: event.rotationRate.gamma || 0
            };

            // Integrate gyro for heading (alpha is yaw/heading)
            this.integrateGyroHeading();
        }

        // Trigger callback
        if (this.onMotionCallback) {
            this.onMotionCallback({
                acceleration: this.acceleration,
                rotationRate: this.rotationRate,
                timestamp: Date.now()
            });
        }
    }

    handleOrientation(event) {
        let rawHeading = null;
        let isAbsoluteOrientation = false;

        // Check if this is an absolute orientation event
        if (event.absolute === true || event.type === 'deviceorientationabsolute') {
            isAbsoluteOrientation = true;
        }

        // iOS Safari provides webkitCompassHeading (0 = North, 90 = East, etc.)
        if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
            // webkitCompassHeading is the actual magnetic compass heading
            // It's already in the correct format (0-360, 0 = North)
            // This is relative to the device's natural orientation, so we need to adjust for screen rotation
            rawHeading = event.webkitCompassHeading;
            isAbsoluteOrientation = true;
        }
        // Fallback to alpha for non-iOS devices
        else if (event.alpha !== null) {
            // On Android with absolute orientation, alpha is compass heading
            // Otherwise it's just device rotation
            rawHeading = event.alpha;
        }

        if (rawHeading !== null) {
            // Adjust heading for screen orientation
            // When the device is rotated, the compass needs to be adjusted
            let adjustedHeading = rawHeading;

            if (isAbsoluteOrientation) {
                // For iOS/Safari: webkitCompassHeading is already absolute
                // But we need to adjust for how the screen is oriented
                // webkitCompassHeading reports the direction the device TOP is pointing
                // We need to know the direction the SCREEN TOP (user's view) is pointing
                // Portrait: 0, Landscape-right: 90, Upside-down: 180, Landscape-left: -90/270
                if (this.screenOrientationAngle === -90 || this.screenOrientationAngle === 270) {
                    // Landscape-left: device top points left of screen, so screen top points 90° clockwise from device top
                    adjustedHeading = (rawHeading + 90) % 360;
                } else if (this.screenOrientationAngle === 90) {
                    // Landscape-right: device top points right of screen, so screen top points 90° counter-clockwise from device top
                    adjustedHeading = (rawHeading - 90 + 360) % 360;
                } else if (this.screenOrientationAngle === 180) {
                    // Upside-down: screen top points opposite direction from device top
                    adjustedHeading = (rawHeading + 180) % 360;
                }
                // Portrait (0): screen top = device top, no adjustment needed
            }

            // Apply circular averaging for compass
            this.compassHeading = this.applyCircularFilter(adjustedHeading, this.compassFilter);

            // Initialize gyro heading to match compass on first reading
            if (this.gyroHeading === 0 && this.compassFilter.length === 1) {
                this.gyroHeading = this.compassHeading;
            }

            // Fuse compass with gyro for better short-term accuracy
            this.fusedHeading = this.fuseHeadings(this.compassHeading, this.gyroHeading);
        }

        // Trigger callback
        if (this.onOrientationCallback) {
            this.onOrientationCallback({
                heading: this.fusedHeading,
                compassHeading: this.compassHeading,
                gyroHeading: this.gyroHeading,
                timestamp: Date.now()
            });
        }
    }

    integrateGyroHeading() {
        const now = Date.now();
        if (this.lastTimestamp) {
            const dt = (now - this.lastTimestamp) / 1000; // Convert to seconds

            // Integrate alpha rotation rate to get heading change
            const dHeading = this.rotationRate.alpha * dt;
            this.gyroHeading = (this.gyroHeading + dHeading + 360) % 360;
        }
        this.lastTimestamp = now;
    }

    fuseHeadings(compassHeading, gyroHeading) {
        // Complementary filter: gyro for short-term, compass for long-term
        // This reduces compass jitter while preventing gyro drift

        // Convert angles to unit vectors for proper circular averaging
        const compassRad = compassHeading * Math.PI / 180;
        const gyroRad = gyroHeading * Math.PI / 180;

        const compassX = Math.cos(compassRad);
        const compassY = Math.sin(compassRad);
        const gyroX = Math.cos(gyroRad);
        const gyroY = Math.sin(gyroRad);

        // Weighted average of unit vectors
        const fusedX = this.gyroWeight * gyroX + (1 - this.gyroWeight) * compassX;
        const fusedY = this.gyroWeight * gyroY + (1 - this.gyroWeight) * compassY;

        // Convert back to angle
        const fusedHeading = Math.atan2(fusedY, fusedX) * 180 / Math.PI;
        return (fusedHeading + 360) % 360;
    }

    applyLowPassFilter(rawData, filterArrays) {
        const filtered = {};

        for (const axis in rawData) {
            if (!filterArrays[axis]) {
                filterArrays[axis] = [];
            }

            // Add new value
            filterArrays[axis].push(rawData[axis]);

            // Keep only last N values
            if (filterArrays[axis].length > this.filterSize) {
                filterArrays[axis].shift();
            }

            // Calculate average
            const sum = filterArrays[axis].reduce((a, b) => a + b, 0);
            filtered[axis] = sum / filterArrays[axis].length;
        }

        return filtered;
    }

    applyCircularFilter(newAngle, filterArray) {
        // For circular data (angles), we need special averaging
        filterArray.push(newAngle);

        if (filterArray.length > this.filterSize) {
            filterArray.shift();
        }

        // Convert to unit vectors and average
        let sinSum = 0, cosSum = 0;
        filterArray.forEach(angle => {
            const rad = angle * Math.PI / 180;
            sinSum += Math.sin(rad);
            cosSum += Math.cos(rad);
        });

        const avgAngle = Math.atan2(sinSum, cosSum) * 180 / Math.PI;
        return (avgAngle + 360) % 360;
    }

    onMotion(callback) {
        this.onMotionCallback = callback;
    }

    onOrientation(callback) {
        this.onOrientationCallback = callback;
    }

    getAcceleration() {
        return this.acceleration;
    }

    getRotationRate() {
        return this.rotationRate;
    }

    getHeading() {
        return this.fusedHeading;
    }

    getCompassHeading() {
        return this.compassHeading;
    }

    reset() {
        this.accelFilter = { x: [], y: [], z: [] };
        this.compassFilter = [];
        this.gyroHeading = this.compassHeading;
        this.fusedHeading = this.compassHeading;
        this.lastTimestamp = Date.now();
    }
}
