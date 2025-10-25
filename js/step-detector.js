class StepDetector {
    constructor() {
        // Step detection parameters
        this.threshold = 1.5;
        this.minStepInterval = 250; // milliseconds (prevents double counting)
        this.adaptiveThreshold = true;

        // State
        this.stepCount = 0;
        this.lastStepTime = 0;
        this.lastMagnitude = 0;
        this.peakDetected = false;
        this.stepCallback = null;

        // Calibration mode
        this.isCalibrating = false;
        this.calibrationSteps = 0;
        this.calibrationMagnitudes = [];

        // Adaptive threshold learning
        this.magnitudeHistory = [];
        this.maxHistorySize = 100;

        // Zero Velocity Update (ZUPT) - detect standing still
        this.zeroVelocityThreshold = 0.3;
        this.zeroVelocityCount = 0;
        this.isStationary = false;

        // Motion variance for better detection
        this.recentAccelerations = [];
        this.varianceWindowSize = 10;
    }

    processAcceleration(acceleration) {
        // Calculate acceleration magnitude
        const magnitude = Math.sqrt(
            acceleration.x * acceleration.x +
            acceleration.y * acceleration.y +
            acceleration.z * acceleration.z
        );

        // Store for variance calculation
        this.recentAccelerations.push(magnitude);
        if (this.recentAccelerations.length > this.varianceWindowSize) {
            this.recentAccelerations.shift();
        }

        // Check if user is stationary (ZUPT)
        this.updateStationaryStatus(magnitude);

        // Don't detect steps if stationary
        if (this.isStationary) {
            this.lastMagnitude = magnitude;
            return;
        }

        // Detect step using peak detection
        const now = Date.now();
        const timeSinceLastStep = now - this.lastStepTime;

        // Look for peak (acceleration spike)
        if (magnitude > this.threshold &&
            magnitude > this.lastMagnitude &&
            !this.peakDetected &&
            timeSinceLastStep > this.minStepInterval) {

            // Verify it's a real step by checking variance
            if (this.hasEnoughVariance()) {
                this.peakDetected = true;
            }
        }

        // Look for valley (descent after peak)
        if (this.peakDetected &&
            magnitude < this.lastMagnitude &&
            timeSinceLastStep > this.minStepInterval) {

            // Step confirmed!
            this.onStepDetected();
            this.lastStepTime = now;
            this.peakDetected = false;

            // Learn from this step for adaptive threshold
            if (this.adaptiveThreshold) {
                this.updateAdaptiveThreshold(magnitude);
            }

            // Store magnitude for calibration
            if (this.isCalibrating) {
                this.calibrationMagnitudes.push(magnitude);
            }
        }

        this.lastMagnitude = magnitude;
    }

    hasEnoughVariance() {
        if (this.recentAccelerations.length < this.varianceWindowSize) {
            return true; // Not enough data yet
        }

        const mean = this.recentAccelerations.reduce((a, b) => a + b, 0) / this.recentAccelerations.length;
        const variance = this.recentAccelerations.reduce((sum, val) => {
            return sum + Math.pow(val - mean, 2);
        }, 0) / this.recentAccelerations.length;

        const stdDev = Math.sqrt(variance);

        // Require minimum variance to avoid false positives from small movements
        return stdDev > 0.2;
    }

    updateStationaryStatus(magnitude) {
        if (magnitude < this.zeroVelocityThreshold) {
            this.zeroVelocityCount++;
            if (this.zeroVelocityCount > 5) {
                this.isStationary = true;
            }
        } else {
            this.zeroVelocityCount = 0;
            this.isStationary = false;
        }
    }

    updateAdaptiveThreshold(magnitude) {
        this.magnitudeHistory.push(magnitude);

        if (this.magnitudeHistory.length > this.maxHistorySize) {
            this.magnitudeHistory.shift();
        }

        // Calculate adaptive threshold as percentage of average peak magnitude
        if (this.magnitudeHistory.length > 10) {
            const avgMagnitude = this.magnitudeHistory.reduce((a, b) => a + b, 0) / this.magnitudeHistory.length;
            this.threshold = avgMagnitude * 0.7; // 70% of average peak

            // Constrain to reasonable bounds
            this.threshold = Math.max(0.8, Math.min(this.threshold, 3.0));
        }
    }

    onStepDetected() {
        this.stepCount++;

        if (this.isCalibrating) {
            this.calibrationSteps++;
        }

        if (this.stepCallback) {
            this.stepCallback({
                stepCount: this.stepCount,
                timestamp: Date.now(),
                isCalibrating: this.isCalibrating
            });
        }
    }

    onStep(callback) {
        this.stepCallback = callback;
    }

    reset() {
        this.stepCount = 0;
        this.lastStepTime = 0;
        this.peakDetected = false;
    }

    startCalibration() {
        this.isCalibrating = true;
        this.calibrationSteps = 0;
        this.calibrationMagnitudes = [];
    }

    finishCalibration() {
        this.isCalibrating = false;

        if (this.calibrationMagnitudes.length > 0) {
            // Calculate optimal threshold from calibration data
            const avgMagnitude = this.calibrationMagnitudes.reduce((a, b) => a + b, 0) / this.calibrationMagnitudes.length;
            this.threshold = avgMagnitude * 0.75;

            // Ensure reasonable bounds
            this.threshold = Math.max(0.8, Math.min(this.threshold, 3.0));
        }

        return {
            steps: this.calibrationSteps,
            avgMagnitude: this.calibrationMagnitudes.length > 0
                ? this.calibrationMagnitudes.reduce((a, b) => a + b, 0) / this.calibrationMagnitudes.length
                : 0,
            threshold: this.threshold
        };
    }

    getStepCount() {
        return this.stepCount;
    }

    getThreshold() {
        return this.threshold;
    }

    setThreshold(value) {
        this.threshold = value;
    }

    isUserStationary() {
        return this.isStationary;
    }

    getCalibrationSteps() {
        return this.calibrationSteps;
    }
}
