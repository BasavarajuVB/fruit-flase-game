const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

// Game Settings
const canvasWidth = 800;
const canvasHeight = 1000;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
const squareMinSize = 20;
const squareMaxSize = 50;
const squareSpawnFrequency = 1000;
const squareBaseSpeed = 5;
const scorePerSquare = 10;
const timeBonusPerClock = 5;
const scorePenaltyBomb = 50;
const clockSquareChance = 0.1;
const bombSquareChance = 0.05;

let squareSpeedAdjustment = 1;
let squareSpawnAdjust = 1;
let score = 0;
let timeLeft = 60;
let gameRunning = true;
let lastSliceTime = 0;

const squares = [];
let mouseX, mouseY, lastX, lastY;
let isDragging = false;
let slicePoints = [];

// Prevent scrolling
const preventScroll = (e) => e.preventDefault();
[document.getElementById('app-container'),
 document.querySelector('.game-container'),
 document.getElementById('game-wrapper')
].forEach(element => {
    element.addEventListener('touchstart', preventScroll, { passive: false });
    element.addEventListener('touchmove', preventScroll, { passive: false });
    element.addEventListener('touchend', preventScroll, { passive: false });
});

document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.documentElement.style.overflow = 'hidden';

// Slice effect class
class SliceEffect {
    constructor(x1, y1, x2, y2) {
        this.startX = x1;
        this.startY = y1;
        this.endX = x2;
        this.endY = y2;
        this.alpha = 1;
        this.width = 3;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = this.width;
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        ctx.closePath();
        
        this.alpha -= 0.05;
        this.width -= 0.1;
    }
}

let sliceEffects = [];

function updateScore(amount) {
    score += amount;
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = `Time: ${timeLeft}`;
}

function square(x, y, size, type = 'normal') {
    return {
        x, y, size,
        vx: (Math.random() * 2 - 1) * squareBaseSpeed,
        vy: (Math.random() * 2 - 1) * squareBaseSpeed,
        type
    };
}

function createSquare() {
    // Increase spawn rate and speed as time decreases
    if (timeLeft < 30) {
        squareSpeedAdjustment = 1.5;
        squareSpawnAdjust = 1.5;
    }
    if (timeLeft < 15) {
        squareSpeedAdjustment = 2;
        squareSpawnAdjust = 2;
    }

    const size = squareMinSize + Math.random() * (squareMaxSize - squareMinSize);
    const spawnEdge = Math.floor(Math.random() * 4);
    let x, y;

    switch(spawnEdge) {
        case 0: // top
            x = Math.random() * canvasWidth;
            y = -size;
            break;
        case 1: // right
            x = canvasWidth + size;
            y = Math.random() * canvasHeight;
            break;
        case 2: // bottom
            x = Math.random() * canvasWidth;
            y = canvasHeight + size;
            break;
        case 3: // left
            x = -size;
            y = Math.random() * canvasHeight;
            break;
    }

    let type = 'normal';
    if (Math.random() < clockSquareChance) type = 'clock';
    else if (Math.random() < bombSquareChance) type = 'bomb';

    squares.push(square(x, y, size, type));
}

function drawSliceEffect(x1, y1, x2, y2) {
    sliceEffects.push(new SliceEffect(x1, y1, x2, y2));
}

function drawSquare(square) {
    ctx.beginPath();
    ctx.rect(square.x, square.y, square.size, square.size);
    
    switch (square.type) {
        case 'clock':
            ctx.fillStyle = '#32CD32';
            break;
        case 'bomb':
            ctx.fillStyle = '#FF4500';
            break;
        default:
            ctx.fillStyle = '#4169E1';
    }
    
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function handleSquareCollision(squareIndex) {
    const square = squares[squareIndex];
    
    // Add particle effect on collision
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 5;
        particles.push({
            x: square.x,
            y: square.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            alpha: 1,
            color: square.type === 'clock' ? '#32CD32' : 
                   square.type === 'bomb' ? '#FF4500' : '#4169E1'
        });
    }

    switch (square.type) {
        case 'clock':
            timeLeft += timeBonusPerClock;
            break;
        case 'bomb':
            updateScore(-scorePenaltyBomb);
            break;
        default:
            updateScore(scorePerSquare);
    }

    squares.splice(squareIndex, 1);
}

function updateGame() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw slice effects
    sliceEffects = sliceEffects.filter(effect => {
        effect.draw(ctx);
        return effect.alpha > 0;
    });

    // Update and draw squares
    for (let i = squares.length - 1; i >= 0; i--) {
        let square = squares[i];
        square.x += square.vx * squareSpeedAdjustment;
        square.y += square.vy * squareSpeedAdjustment;

        if (square.x + square.size < 0 || 
            square.x - square.size > canvasWidth ||
            square.y + square.size < 0 || 
            square.y - square.size > canvasHeight) {
            squares.splice(i, 1);
            continue;
        }

        drawSquare(square);
    }

    // Check for slicing
    if (isDragging && lastX !== undefined) {
        const dx = mouseX - lastX;
        const dy = mouseY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            drawSliceEffect(lastX, lastY, mouseX, mouseY);
            
            // Check for square hits
            squares.forEach((square, index) => {
                if (isSquareSliced(lastX, lastY, mouseX, mouseY, square)) {
                    handleSquareCollision(index);
                }
            });
        }
    }

    lastX = mouseX;
    lastY = mouseY;
}

function isSquareSliced(x1, y1, x2, y2, square) {
    const lineLength = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (lineLength === 0) return false;

    const dot = (((square.x-x1)*(x2-x1)) + ((square.y-y1)*(y2-y1))) / (lineLength**2);
    const closestX = x1 + (dot * (x2-x1));
    const closestY = y1 + (dot * (y2-y1));

    if (dot < 0 || dot > 1) return false;

    const distance = Math.sqrt((closestX-square.x)**2 + (closestY-square.y)**2);
    return distance <= square.size / 2;
}

// Touch event handlers
function handleTouchStart(e) {
    const touch = e.touches[0];
    isDragging = true;
    mouseX = touch.clientX - canvas.offsetLeft;
    mouseY = touch.clientY - canvas.offsetTop;
    lastX = mouseX;
    lastY = mouseY;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    mouseX = touch.clientX - canvas.offsetLeft;
    mouseY = touch.clientY - canvas.offsetTop;

    // Check for square hits
    squares.forEach((square, index) => {
        if (isSquareSliced(lastX, lastY, mouseX, mouseY, square)) {
            handleSquareCollision(index);
        }
    });

    lastX = mouseX;
    lastY = mouseY;
}

function handleTouchEnd() {
    isDragging = false;
    lastX = undefined;
    lastY = undefined;
}

// Mouse event handlers
function handleMouseDown(e) {
    isDragging = true;
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
    lastX = mouseX;
    lastY = mouseY;
}

function handleMouseMove(e) {
    if (!isDragging) return;
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;

    // Check for square hits
    squares.forEach((square, index) => {
        if (isSquareSliced(lastX, lastY, mouseX, mouseY, square)) {
            handleSquareCollision(index);
        }
    });

    lastX = mouseX;
    lastY = mouseY;
}

function handleMouseUp() {
    isDragging = false;
    lastX = undefined;
    lastY = undefined;
}

function initGame() {
    setInterval(createSquare, squareSpawnFrequency/squareSpawnAdjust);
    requestAnimationFrame(gameLoop);
    gameTimer();

    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);

    canvas.addEventListener('mousedown', handleMouseDown, false);
    canvas.addEventListener('mousemove', handleMouseMove, false);
    canvas.addEventListener('mouseup', handleMouseUp, false);
}

function gameLoop() {
    updateGame();
    requestAnimationFrame(gameLoop);
}

function gameTimer() {
    const timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            gameRunning = false;
            alert('Game Over! Final Score: ' + score);
        } else {
            timeLeft -= 1;
            updateTimerDisplay();
        }
    }, 1000);
}

initGame();
