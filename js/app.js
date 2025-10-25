class IndoorNavigatorApp {
    constructor() {
        // Core components
        this.sensorManager = new SensorManager();
        this.stepDetector = new StepDetector();
        this.positionTracker = new PositionTracker();
        this.canvasRenderer = new CanvasRenderer('floor-plan-canvas', 'assets/scott-lab-basement.png');

        // Building orientation offset
        // The floor plan's "north" (up on screen) corresponds to 77° on the compass
        // Subtract this offset from compass readings to align with the floor plan
        this.buildingRotationOffset = 223;

        // App state
        this.isTracking = false;
        this.isCalibrationMode = false;
        this.isStepCalibrating = false;

        // UI elements
        this.elements = {
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            recalibrateBtn: document.getElementById('recalibrate-btn'),
            calibrationPanel: document.getElementById('calibration-panel'),
            calibrationDoneBtn: document.getElementById('calibration-done-btn'),
            mainControls: document.getElementById('main-controls'),
            stepCalibration: document.getElementById('step-calibration'),
            stepCalibDoneBtn: document.getElementById('step-calib-done-btn'),
            stepCount: document.getElementById('step-count'),
            headingValue: document.getElementById('heading-value'),
            confidenceValue: document.getElementById('confidence-value'),
            calibStepCount: document.getElementById('calib-step-count'),
            statusText: document.getElementById('status-text'),
            accuracyIndicator: document.getElementById('accuracy-indicator'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            errorModal: document.getElementById('error-modal'),
            errorMessage: document.getElementById('error-message'),
            errorCloseBtn: document.getElementById('error-close-btn'),
            // Debug elements
            debugAccelX: document.getElementById('debug-accel-x'),
            debugAccelY: document.getElementById('debug-accel-y'),
            debugAccelZ: document.getElementById('debug-accel-z'),
            debugGyroAlpha: document.getElementById('debug-gyro-alpha'),
            debugCompass: document.getElementById('debug-compass'),
            debugPosition: document.getElementById('debug-position')
        };

        // Initialize
        this.init();
    }

    init() {
        // Set up event listeners
        this.setupEventListeners();

        // Show calibration instructions
        this.showCalibrationMode();
    }

    setupEventListeners() {
        // Button clicks
        this.elements.startBtn.addEventListener('click', () => this.startTracking());
        this.elements.stopBtn.addEventListener('click', () => this.stopTracking());
        this.elements.recalibrateBtn.addEventListener('click', () => this.enterRecalibrationMode());
        this.elements.calibrationDoneBtn.addEventListener('click', () => this.exitCalibrationMode());
        this.elements.stepCalibDoneBtn.addEventListener('click', () => this.finishStepCalibration());
        this.elements.errorCloseBtn.addEventListener('click', () => this.hideError());

        // Canvas clicks for position setting
        this.canvasRenderer.onCanvasClick((x, y) => {
            if (this.isCalibrationMode) {
                this.setPosition(x, y);
            }
        });

        // Sensor callbacks
        this.sensorManager.onMotion((data) => this.handleMotionData(data));
        this.sensorManager.onOrientation((data) => this.handleOrientationData(data));

        // Step detector callback
        this.stepDetector.onStep((data) => this.handleStep(data));
    }

    showCalibrationMode() {
        this.isCalibrationMode = true;
        this.elements.calibrationPanel.classList.remove('hidden');
        this.elements.mainControls.classList.add('hidden');
        this.updateStatus('Tap the map to set your starting position');
    }

    exitCalibrationMode() {
        if (!this.positionTracker.isPositionSet) {
            this.showError('Please tap the map to set your position first');
            return;
        }

        this.isCalibrationMode = false;
        this.elements.calibrationPanel.classList.add('hidden');
        this.elements.mainControls.classList.remove('hidden');
        this.updateStatus('Ready to track');
        this.elements.recalibrateBtn.disabled = false;
    }

    enterRecalibrationMode() {
        this.isCalibrationMode = true;
        this.elements.calibrationPanel.classList.remove('hidden');
        this.updateStatus('Tap the map to update your position');
    }

    setPosition(x, y) {
        this.positionTracker.setInitialPosition(x, y);
        this.canvasRenderer.updateUserDot(x, y, this.positionTracker.heading);

        this.updateStatus('Position set! Click "Done" to continue');
        this.elements.calibrationDoneBtn.disabled = false;
    }

    async startTracking() {
        this.showLoading('Requesting sensor permissions...');

        // Request sensor permissions
        const permissionResult = await this.sensorManager.requestPermission();

        if (!permissionResult.success) {
            this.hideLoading();
            this.showError(permissionResult.error);
            return;
        }

        this.showLoading('Starting sensors...');

        // Start sensors
        const started = this.sensorManager.start();

        if (!started) {
            this.hideLoading();
            this.showError('Failed to start sensors');
            return;
        }

        this.hideLoading();

        // Update UI
        this.isTracking = true;
        this.elements.startBtn.classList.add('hidden');
        this.elements.stopBtn.classList.remove('hidden');
        this.updateStatus('Tracking...');

        // Show step calibration option
        this.showStepCalibration();
    }

    stopTracking() {
        this.sensorManager.stop();
        this.isTracking = false;

        // Update UI
        this.elements.startBtn.classList.remove('hidden');
        this.elements.stopBtn.classList.add('hidden');
        this.elements.stepCalibration.classList.add('hidden');
        this.updateStatus('Tracking stopped');
    }

    showStepCalibration() {
        this.elements.stepCalibration.classList.remove('hidden');
        this.isStepCalibrating = true;
        this.stepDetector.startCalibration();
    }

    finishStepCalibration() {
        const calibResult = this.stepDetector.finishCalibration();
        this.isStepCalibrating = false;
        this.elements.stepCalibration.classList.add('hidden');

        console.log('Step calibration complete:', calibResult);
        this.updateStatus(`Calibrated! Threshold: ${calibResult.threshold.toFixed(2)}`);
    }

    handleMotionData(data) {
        if (!this.isTracking) return;

        // Update debug display
        this.updateDebugDisplay('accel', data.acceleration);
        this.updateDebugDisplay('gyro', data.rotationRate);

        // Process acceleration for step detection
        this.stepDetector.processAcceleration(data.acceleration);
    }

    handleOrientationData(data) {
        if (!this.isTracking) return;

        // Apply building rotation offset to align compass with floor plan
        // When facing 60° in real life, that should be 0° (north/up) on the floor plan
        const adjustedHeading = (data.compassHeading - this.buildingRotationOffset + 360) % 360;

        // Update heading in position tracker (use adjusted heading for correct movement)
        this.positionTracker.setHeading(adjustedHeading);

        // Update debug display (show raw compass)
        this.updateDebugDisplay('compass', data.compassHeading);

        // Update heading display (show adjusted heading aligned with floor plan)
        this.elements.headingValue.textContent = Math.round(adjustedHeading) + '°';

        // Update user dot direction
        if (this.positionTracker.isPositionSet) {
            const pos = this.positionTracker.getPosition();
            this.canvasRenderer.updateUserDot(pos.x, pos.y, pos.heading);
        }
    }

    handleStep(data) {
        if (!this.isTracking) return;

        // Update step count display
        this.elements.stepCount.textContent = this.stepDetector.getStepCount();

        // Update calibration step count if calibrating
        if (this.isStepCalibrating) {
            this.elements.calibStepCount.textContent = this.stepDetector.getCalibrationSteps();
        }

        // Update position
        const newPosition = this.positionTracker.onStep();

        // Update canvas
        this.canvasRenderer.render(null, this.positionTracker.getPathHistory());
        this.canvasRenderer.updateUserDot(newPosition.x, newPosition.y, newPosition.heading);

        // Update confidence display
        this.updateConfidenceDisplay(newPosition.confidence);

        // Update debug position
        this.updateDebugDisplay('position', { x: newPosition.x, y: newPosition.y });

        // Check if recalibration is recommended
        if (this.positionTracker.shouldRecalibrate()) {
            this.updateStatus('Consider recalibrating for better accuracy');
        }
    }

    updateConfidenceDisplay(confidence) {
        this.elements.confidenceValue.textContent = confidence.charAt(0).toUpperCase() + confidence.slice(1);

        // Update accuracy indicator color
        this.elements.accuracyIndicator.className = '';
        this.elements.accuracyIndicator.classList.add(`accuracy-${confidence}`);
    }

    updateDebugDisplay(type, data) {
        if (type === 'accel') {
            this.elements.debugAccelX.textContent = data.x.toFixed(2);
            this.elements.debugAccelY.textContent = data.y.toFixed(2);
            this.elements.debugAccelZ.textContent = data.z.toFixed(2);
        } else if (type === 'gyro') {
            this.elements.debugGyroAlpha.textContent = data.alpha.toFixed(2);
        } else if (type === 'compass') {
            this.elements.debugCompass.textContent = data.toFixed(1) + '°';
        } else if (type === 'position') {
            this.elements.debugPosition.textContent = `${Math.round(data.x)}, ${Math.round(data.y)}`;
        }
    }

    updateStatus(text) {
        this.elements.statusText.textContent = text;
    }

    showLoading(text) {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorModal.classList.remove('hidden');
    }

    hideError() {
        this.elements.errorModal.classList.add('hidden');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IndoorNavigatorApp();
});
