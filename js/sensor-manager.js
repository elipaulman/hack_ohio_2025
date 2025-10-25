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

        // Start listening to device orientation
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));

        this.isActive = true;
        this.lastTimestamp = Date.now();
        return true;
    }

    stop() {
        window.removeEventListener('devicemotion', this.handleMotion.bind(this));
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
        this.isActive = false;
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
        if (event.alpha !== null) {
            const rawHeading = event.alpha;

            // Apply circular averaging for compass
            this.compassHeading = this.applyCircularFilter(rawHeading, this.compassFilter);

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
        const fusedHeading = this.gyroWeight * gyroHeading + (1 - this.gyroWeight) * compassHeading;
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
