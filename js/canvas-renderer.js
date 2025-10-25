class CanvasRenderer {
    constructor(canvasId, floorPlanImagePath) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Floor plan
        this.floorPlanImage = new Image();
        this.floorPlanImagePath = floorPlanImagePath;
        this.imageLoaded = false;

        // Pan and zoom state
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minScale = 0.5;
        this.maxScale = 3.0;

        // Touch handling for pan/zoom
        this.isPanning = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.touchStartDistance = 0;
        this.touchStartScale = 1.0;

        // Click callback
        this.onCanvasClickCallback = null;

        // Device pixel ratio for crisp rendering
        this.dpr = window.devicePixelRatio || 1;

        // Initialize
        this.setupCanvas();
        this.loadFloorPlan();
    }

    setupCanvas() {
        // Set canvas size to container size
        this.resizeCanvas();

        // Add event listeners
        window.addEventListener('resize', () => this.resizeCanvas());

        // Touch events for panning
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Mouse events for desktop testing
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Click events for position setting
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Set actual size in memory (scaled by dpr for crisp rendering)
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;

        // Scale context to match
        this.ctx.scale(this.dpr, this.dpr);

        // Redraw
        if (this.imageLoaded) {
            this.render();
        }
    }

    loadFloorPlan() {
        this.floorPlanImage.onload = () => {
            this.imageLoaded = true;

            // Center and fit the floor plan
            this.fitFloorPlan();

            // Initial render
            this.render();
        };

        this.floorPlanImage.onerror = () => {
            console.error('Failed to load floor plan image');
        };

        this.floorPlanImage.src = this.floorPlanImagePath;
    }

    fitFloorPlan() {
        const canvasWidth = this.canvas.width / this.dpr;
        const canvasHeight = this.canvas.height / this.dpr;
        const imageWidth = this.floorPlanImage.width;
        const imageHeight = this.floorPlanImage.height;

        // Calculate scale to fit
        const scaleX = canvasWidth / imageWidth;
        const scaleY = canvasHeight / imageHeight;
        this.scale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some padding

        // Center the image
        this.offsetX = (canvasWidth - imageWidth * this.scale) / 2;
        this.offsetY = (canvasHeight - imageHeight * this.scale) / 2;
    }

    render(userDot = null, pathHistory = null) {
        if (!this.imageLoaded) return;

        const canvasWidth = this.canvas.width / this.dpr;
        const canvasHeight = this.canvas.height / this.dpr;

        // Clear canvas
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Save context state
        this.ctx.save();

        // Apply transformations
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw floor plan
        this.ctx.drawImage(this.floorPlanImage, 0, 0);

        // Draw path history if provided
        if (pathHistory && pathHistory.length > 1) {
            this.drawPathHistory(pathHistory);
        }

        // Restore context state
        this.ctx.restore();

        // Note: User dot is drawn via HTML element for smoother animation
    }

    drawPathHistory(pathHistory) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
        this.ctx.lineWidth = 3 / this.scale; // Constant width regardless of zoom
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        pathHistory.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });

        this.ctx.stroke();
    }

    // Convert screen coordinates to canvas coordinates
    screenToCanvas(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;

        // Account for pan and zoom
        const canvasX = (x - this.offsetX) / this.scale;
        const canvasY = (y - this.offsetY) / this.scale;

        return { x: canvasX, y: canvasY };
    }

    // Convert canvas coordinates to screen coordinates for user dot positioning
    canvasToScreen(canvasX, canvasY) {
        const screenX = canvasX * this.scale + this.offsetX;
        const screenY = canvasY * this.scale + this.offsetY;

        return { x: screenX, y: screenY };
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            // Single touch - pan
            this.isPanning = true;
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // Two finger - zoom
            e.preventDefault();
            this.touchStartDistance = this.getTouchDistance(e.touches);
            this.touchStartScale = this.scale;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isPanning) {
            const dx = e.touches[0].clientX - this.lastTouchX;
            const dy = e.touches[0].clientY - this.lastTouchY;

            this.offsetX += dx;
            this.offsetY += dy;

            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;

            this.render();
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const distance = this.getTouchDistance(e.touches);
            const scaleChange = distance / this.touchStartDistance;
            this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.touchStartScale * scaleChange));

            this.render();
        }
    }

    handleTouchEnd(e) {
        if (e.touches.length === 0) {
            this.isPanning = false;
        }
    }

    handleMouseDown(e) {
        this.isPanning = true;
        this.lastTouchX = e.clientX;
        this.lastTouchY = e.clientY;
    }

    handleMouseMove(e) {
        if (this.isPanning) {
            const dx = e.clientX - this.lastTouchX;
            const dy = e.clientY - this.lastTouchY;

            this.offsetX += dx;
            this.offsetY += dy;

            this.lastTouchX = e.clientX;
            this.lastTouchY = e.clientY;

            this.render();
        }
    }

    handleMouseUp(e) {
        this.isPanning = false;
    }

    handleClick(e) {
        // Don't trigger click if user was panning
        if (this.isPanning) return;

        const canvasCoords = this.screenToCanvas(e.clientX, e.clientY);

        if (this.onCanvasClickCallback) {
            this.onCanvasClickCallback(canvasCoords.x, canvasCoords.y);
        }
    }

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    onCanvasClick(callback) {
        this.onCanvasClickCallback = callback;
    }

    getImageDimensions() {
        if (!this.imageLoaded) return null;

        return {
            width: this.floorPlanImage.width,
            height: this.floorPlanImage.height
        };
    }

    updateUserDot(canvasX, canvasY, heading) {
        const userDot = document.getElementById('user-dot');
        const directionArrow = document.getElementById('direction-arrow');

        // Convert canvas coordinates to screen coordinates
        const screenCoords = this.canvasToScreen(canvasX, canvasY);

        // Update position
        userDot.style.left = screenCoords.x + 'px';
        userDot.style.top = screenCoords.y + 'px';
        userDot.classList.add('visible');

        // Update direction arrow rotation
        if (directionArrow) {
            directionArrow.style.transform = `translateX(-50%) rotate(${heading}deg)`;
        }
    }

    hideUserDot() {
        const userDot = document.getElementById('user-dot');
        userDot.classList.remove('visible');
    }
}
