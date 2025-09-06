// Game variables
let canvas;
let ctx;
let scoreElement;
let gameOverElement;
let finalScoreElement;

// Settings elements
let pipeDistanceSlider;
let pipeDistanceNum;
let pipeWidthSlider;
let pipeWidthNum;
let pipeGapSlider;
let pipeGapNum;

// Game state
let gameRunning = false;
let score = 0;
let gravity = 0.5;
let velocity = 0;
let birdY = 320; // 10 * 32
let birdX = 96;  // 3 * 32
let birdSize = 32; // 32x32 pixel bird

// Pipe variables - these will be updated by settings
let pipes = [];
let pipeWidth = 64; // 2 * 32
let pipeGap = 160; // 5 * 32
let pipeSpeed = 2;
let pipeDistance = 224; // 7 * 32

// Visual effects
let particles = [];
let cloudOffset = 0;
let backgroundOffset = 0;

// Game loop
let gameLoop;

// Bird class
class Bird {
    constructor() {
        this.x = birdX;
        this.y = birdY;
        this.velocity = 0;
        this.size = birdSize;
        this.rotation = 0;
        this.wingFlap = 0;
    }
    
    update() {
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Update rotation based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 2, -45), 45);
        
        // Animate wing flap
        this.wingFlap += 0.3;
        
        // Keep bird on screen
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        if (this.y > canvas.height - this.size) {
            this.y = canvas.height - this.size;
            this.velocity = 0;
        }
    }
    
    flap() {
        this.velocity = -8;
        // Add flap particles
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(this.x + 16, this.y + 32, '#FFD700', 2));
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        // Bird body with gradient
        const gradient = ctx.createLinearGradient(-16, -16, 16, 16);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        ctx.fillRect(-16, -16, 32, 32);
        
        // Bird body outline
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -16, 32, 32);
        
        // Bird eye with highlight
        ctx.fillStyle = '#000';
        ctx.fillRect(8, -8, 8, 8);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(10, -6, 3, 3);
        
        // Bird wing with animation
        const wingY = Math.sin(this.wingFlap) * 2;
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(-20, -6 + wingY, 16, 12);
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(-20, -6 + wingY, 16, 12);
        
        // Bird beak
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(16, -2, 8, 4);
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(16, -2, 8, 4);
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = Math.random() * speed;
        this.color = color;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Pipe class
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.width = pipeWidth;
        this.gap = pipeGap;
        this.gapY = Math.floor(Math.random() * (canvas.height - this.gap - 128) / 32) * 32 + 64; // Align to 32px grid
        this.passed = false;
    }
    
    update() {
        this.x -= pipeSpeed;
    }
    
    draw() {
        // Create pipe gradients
        const topGradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        topGradient.addColorStop(0, '#228B22');
        topGradient.addColorStop(0.3, '#32CD32');
        topGradient.addColorStop(0.7, '#228B22');
        topGradient.addColorStop(1, '#006400');
        
        const bottomGradient = ctx.createLinearGradient(this.x, this.gapY + this.gap, this.x + this.width, this.gapY + this.gap);
        bottomGradient.addColorStop(0, '#006400');
        bottomGradient.addColorStop(0.3, '#228B22');
        bottomGradient.addColorStop(0.7, '#32CD32');
        bottomGradient.addColorStop(1, '#228B22');
        
        // Top pipe with gradient
        ctx.fillStyle = topGradient;
        ctx.fillRect(this.x, 0, this.width, this.gapY);
        
        // Bottom pipe with gradient
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(this.x, this.gapY + this.gap, this.width, canvas.height - this.gapY - this.gap);
        
        // Pipe caps with enhanced design
        const capGradient = ctx.createLinearGradient(this.x - 8, 0, this.x + this.width + 8, 0);
        capGradient.addColorStop(0, '#006400');
        capGradient.addColorStop(0.5, '#32CD32');
        capGradient.addColorStop(1, '#006400');
        
        ctx.fillStyle = capGradient;
        ctx.fillRect(this.x - 8, this.gapY - 32, this.width + 16, 32);
        ctx.fillRect(this.x - 8, this.gapY + this.gap, this.width + 16, 32);
        
        // Pipe highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x + 2, 0, 4, this.gapY);
        ctx.fillRect(this.x + 2, this.gapY + this.gap, 4, canvas.height - this.gapY - this.gap);
        
        // Pipe shadows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + this.width - 6, 0, 4, this.gapY);
        ctx.fillRect(this.x + this.width - 6, this.gapY + this.gap, 4, canvas.height - this.gapY - this.gap);
    }
    
    getBounds() {
        return {
            top: { x: this.x, y: 0, width: this.width, height: this.gapY },
            bottom: { x: this.x, y: this.gapY + this.gap, width: this.width, height: canvas.height - this.gapY - this.gap }
        };
    }
}

// Game objects
let bird;

// Initialize game
function initGame() {
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    gameOverElement = document.getElementById('gameOver');
    finalScoreElement = document.getElementById('finalScore');
    
    // Get settings elements
    pipeDistanceSlider = document.getElementById('pipeDistance');
    pipeDistanceNum = document.getElementById('pipeDistanceNum');
    pipeWidthSlider = document.getElementById('pipeWidth');
    pipeWidthNum = document.getElementById('pipeWidthNum');
    pipeGapSlider = document.getElementById('pipeGap');
    pipeGapNum = document.getElementById('pipeGapNum');
    
    // Check if elements exist
    if (!canvas || !ctx || !scoreElement || !gameOverElement || !finalScoreElement) {
        console.error('Game elements not found');
        return;
    }
    
    // Set up settings event listeners
    setupSettings();
    
    // Set up canvas click event listener
    canvas.addEventListener('click', () => {
        if (gameRunning) {
            bird.flap();
        }
    });
    
    bird = new Bird();
    pipes = [];
    score = 0;
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    gameRunning = true;
    
    // Start game loop
    gameLoop = setInterval(update, 1000/60); // 60 FPS
}

// Setup settings controls
function setupSettings() {
    // Pipe Distance
    pipeDistanceSlider.addEventListener('input', (e) => {
        pipeDistance = parseInt(e.target.value);
        pipeDistanceNum.value = pipeDistance;
    });
    
    pipeDistanceNum.addEventListener('input', (e) => {
        pipeDistance = parseInt(e.target.value);
        pipeDistanceSlider.value = pipeDistance;
    });
    
    // Pipe Width
    pipeWidthSlider.addEventListener('input', (e) => {
        pipeWidth = parseInt(e.target.value);
        pipeWidthNum.value = pipeWidth;
    });
    
    pipeWidthNum.addEventListener('input', (e) => {
        pipeWidth = parseInt(e.target.value);
        pipeWidthSlider.value = pipeWidth;
    });
    
    // Pipe Gap
    pipeGapSlider.addEventListener('input', (e) => {
        pipeGap = parseInt(e.target.value);
        pipeGapNum.value = pipeGap;
    });
    
    pipeGapNum.addEventListener('input', (e) => {
        pipeGap = parseInt(e.target.value);
        pipeGapSlider.value = pipeGap;
    });
}

// Reset settings to default values
function resetSettings() {
    pipeDistance = 224; // 7 * 32
    pipeWidth = 64;     // 2 * 32
    pipeGap = 160;      // 5 * 32
    
    pipeDistanceSlider.value = pipeDistance;
    pipeDistanceNum.value = pipeDistance;
    pipeWidthSlider.value = pipeWidth;
    pipeWidthNum.value = pipeWidth;
    pipeGapSlider.value = pipeGap;
    pipeGapNum.value = pipeGap;
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Update bird
    bird.update();
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    // Update pipes
    pipes.forEach(pipe => {
        pipe.update();
        
        // Check if bird passed pipe
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = score;
            
            // Add score particles
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(pipe.x + pipe.width/2, pipe.gapY + pipe.gap/2, '#FFD700', 3));
            }
        }
    });
    
    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
    
    // Generate new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeDistance) {
        pipes.push(new Pipe());
    }
    
    // Check collisions
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    // Update visual effects
    cloudOffset += 0.5;
    backgroundOffset += 0.2;
    
    // Draw everything
    draw();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw animated background
    drawBackground();
    
    // Draw animated clouds
    drawClouds();
    
    // Draw pipes
    pipes.forEach(pipe => pipe.draw());
    
    // Draw particles
    particles.forEach(particle => particle.draw());
    
    // Draw bird
    bird.draw();
    
    // Draw ground with texture
    drawGround();
}

// Draw enhanced background
function drawBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.5, '#98FB98');
    skyGradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Moving background elements
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 64 + backgroundOffset) % (canvas.width + 64);
        ctx.fillRect(x, 100 + Math.sin(i * 0.5) * 20, 32, 32);
    }
}

// Draw enhanced clouds
function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // Cloud 1 with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    ctx.arc(64 + cloudOffset * 0.3, 96, 24, 0, Math.PI * 2);
    ctx.arc(96 + cloudOffset * 0.3, 96, 32, 0, Math.PI * 2);
    ctx.arc(128 + cloudOffset * 0.3, 96, 24, 0, Math.PI * 2);
    ctx.fill();
    
    // Cloud 2 with shadow
    ctx.beginPath();
    ctx.arc(384 + cloudOffset * 0.5, 64, 20, 0, Math.PI * 2);
    ctx.arc(416 + cloudOffset * 0.5, 64, 28, 0, Math.PI * 2);
    ctx.arc(448 + cloudOffset * 0.5, 64, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// Draw enhanced ground
function drawGround() {
    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 32, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(0.7, '#A0522D');
    groundGradient.addColorStop(1, '#CD853F');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 32, canvas.width, 32);
    
    // Ground texture
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    for (let i = 0; i < canvas.width; i += 16) {
        ctx.fillRect(i, canvas.height - 32, 8, 32);
    }
    
    // Ground highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, canvas.height - 32, canvas.width, 8);
}

// Check collisions
function checkCollisions() {
    const birdBounds = bird.getBounds();
    
    // Check pipe collisions
    for (let pipe of pipes) {
        const pipeBounds = pipe.getBounds();
        
        if (birdBounds.x < pipeBounds.top.x + pipeBounds.top.width &&
            birdBounds.x + birdBounds.width > pipeBounds.top.x &&
            birdBounds.y < pipeBounds.top.y + pipeBounds.top.height &&
            birdBounds.y + birdBounds.height > pipeBounds.top.y) {
            return true;
        }
        
        if (birdBounds.x < pipeBounds.bottom.x + pipeBounds.bottom.width &&
            birdBounds.x + birdBounds.width > pipeBounds.bottom.x &&
            birdBounds.y < pipeBounds.bottom.y + pipeBounds.bottom.height &&
            birdBounds.y + birdBounds.height > pipeBounds.bottom.y) {
            return true;
        }
    }
    
    // Check ground collision
    if (birdBounds.y + birdBounds.height >= canvas.height - 32) {
        return true;
    }
    
    return false;
}

// Game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Restart game
function restartGame() {
    initGame();
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameRunning) {
        e.preventDefault();
        bird.flap();
    }
});

// Start game when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, initializing game...');
    initGame();
});
