class PositionTracker {
    constructor() {
        // Position in pixels (on canvas)
        this.x = 0;
        this.y = 0;

        // Heading in degrees (0 = North, 90 = East, 180 = South, 270 = West)
        this.heading = 0;

        // Step length configuration
        this.stepLengthMeters = 0.7; // Default average step length
        this.pixelsPerMeter = 20; // Will be calibrated based on floor plan

        // Position confidence tracking
        this.totalSteps = 0;
        this.confidenceLevel = 'high'; // high, medium, low
        this.driftEstimate = 0; // Estimated drift in meters

        // Recalibration tracking
        this.stepsSinceCalibration = 0;
        this.recalibrationThreshold = 50; // Steps before confidence drops

        // Path history for visualization
        this.pathHistory = [];
        this.maxPathLength = 100;

        // Initial position set flag
        this.isPositionSet = false;
    }

    setInitialPosition(x, y) {
        this.x = x;
        this.y = y;
        this.isPositionSet = true;
        this.resetTracking();

        // Start path history
        this.pathHistory = [{ x: this.x, y: this.y }];
    }

    setHeading(heading) {
        // Normalize heading to 0-360
        this.heading = (heading + 360) % 360;
    }

    onStep() {
        if (!this.isPositionSet) {
            console.warn('Position not set yet');
            return { x: this.x, y: this.y };
        }

        // Convert heading to radians
        const headingRad = (this.heading * Math.PI) / 180;

        // Calculate displacement in meters
        // Note: In compass coordinates, 0° is North (up on map)
        const dxMeters = this.stepLengthMeters * Math.sin(headingRad);
        const dyMeters = this.stepLengthMeters * Math.cos(headingRad);

        // Convert to pixels
        const dxPixels = dxMeters * this.pixelsPerMeter;
        const dyPixels = dyMeters * this.pixelsPerMeter;

        // Update position (Y axis is inverted in screen coordinates)
        this.x += dxPixels;
        this.y -= dyPixels; // Subtract because Y increases downward on screen

        // Update tracking
        this.totalSteps++;
        this.stepsSinceCalibration++;

        // Update confidence
        this.updateConfidence();

        // Add to path history
        this.addToPathHistory(this.x, this.y);

        return {
            x: this.x,
            y: this.y,
            heading: this.heading,
            confidence: this.confidenceLevel
        };
    }

    updateConfidence() {
        // Confidence degrades with steps since last calibration
        if (this.stepsSinceCalibration < 20) {
            this.confidenceLevel = 'high';
            this.driftEstimate = this.stepsSinceCalibration * 0.05; // ~5cm per step
        } else if (this.stepsSinceCalibration < 50) {
            this.confidenceLevel = 'medium';
            this.driftEstimate = this.stepsSinceCalibration * 0.1; // ~10cm per step
        } else {
            this.confidenceLevel = 'low';
            this.driftEstimate = this.stepsSinceCalibration * 0.15; // ~15cm per step
        }
    }

    addToPathHistory(x, y) {
        this.pathHistory.push({ x, y });

        if (this.pathHistory.length > this.maxPathLength) {
            this.pathHistory.shift();
        }
    }

    recalibrate(newX, newY) {
        this.x = newX;
        this.y = newY;
        this.stepsSinceCalibration = 0;
        this.updateConfidence();

        // Keep path history but add new calibrated point
        this.addToPathHistory(this.x, this.y);
    }

    resetTracking() {
        this.totalSteps = 0;
        this.stepsSinceCalibration = 0;
        this.driftEstimate = 0;
        this.confidenceLevel = 'high';
        this.pathHistory = [];
    }

    setStepLength(lengthInMeters) {
        this.stepLengthMeters = lengthInMeters;
    }

    setPixelsPerMeter(pixels) {
        this.pixelsPerMeter = pixels;
    }

    calibrateStepLength(knownDistanceMeters, stepsTaken) {
        if (stepsTaken > 0) {
            this.stepLengthMeters = knownDistanceMeters / stepsTaken;
        }
    }

    getPosition() {
        return {
            x: this.x,
            y: this.y,
            heading: this.heading,
            confidence: this.confidenceLevel,
            driftEstimate: this.driftEstimate
        };
    }

    getPathHistory() {
        return this.pathHistory;
    }

    getTotalSteps() {
        return this.totalSteps;
    }

    getStepsSinceCalibration() {
        return this.stepsSinceCalibration;
    }

    shouldRecalibrate() {
        return this.stepsSinceCalibration >= this.recalibrationThreshold;
    }

    getConfidenceLevel() {
        return this.confidenceLevel;
    }

    getDriftEstimate() {
        return this.driftEstimate;
    }

    // Estimate user height to step length (optional enhancement)
    setUserHeight(heightInCm) {
        // Average step length is approximately 0.43 * height
        this.stepLengthMeters = (heightInCm * 0.43) / 100;
    }
}
