const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

// Game Settings
const canvasWidth = 800;
const canvasHeight = 1000;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
const circleMinRadius = 20;
const circleMaxRadius = 50;
const circleSpawnFrequency = 1000;
const circleBaseSpeed = 5;
const scorePerCircle = 10;
const timeBonusPerClock = 5;
const scorePenaltyBomb = 50;
const clockCircleChance = 0.1;
const bombCircleChance = 0.05;

let circleSpeedAdjustment = 1;
let circleSpawnAdjust = 1;
let score = 0;
let timeLeft = 60;
let gameRunning = true;
let lastSliceTime = 0;

const circles = [];
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

function circle(x, y, radius, type = 'normal') {
    return {
        x, y, radius,
        vx: (Math.random() * 2 - 1) * circleBaseSpeed,
        vy: (Math.random() * 2 - 1) * circleBaseSpeed,
        type
    };
}

function createCircle() {
    // Increase spawn rate and speed as time decreases
    if (timeLeft < 30) {
        circleSpeedAdjustment = 1.5;
        circleSpawnAdjust = 1.5;
    }
    if (timeLeft < 15) {
        circleSpeedAdjustment = 2;
        circleSpawnAdjust = 2;
    }

    const radius = circleMinRadius + Math.random() * (circleMaxRadius - circleMinRadius);
    const spawnEdge = Math.floor(Math.random() * 4);
    let x, y;

    switch(spawnEdge) {
        case 0: // top
            x = Math.random() * canvasWidth;
            y = -radius;
            break;
        case 1: // right
            x = canvasWidth + radius;
            y = Math.random() * canvasHeight;
            break;
        case 2: // bottom
            x = Math.random() * canvasWidth;
            y = canvasHeight + radius;
            break;
        case 3: // left
            x = -radius;
            y = Math.random() * canvasHeight;
            break;
    }

    let type = 'normal';
    if (Math.random() < clockCircleChance) type = 'clock';
    else if (Math.random() < bombCircleChance) type = 'bomb';

    circles.push(circle(x, y, radius, type));
}

function drawSliceEffect(x1, y1, x2, y2) {
    sliceEffects.push(new SliceEffect(x1, y1, x2, y2));
}

function drawCircle(circle) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    
    switch (circle.type) {
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

// Continue in next part..
function handleCircleCollision(circleIndex) {
    const circle = circles[circleIndex];
    
    // Add particle effect on collision
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 5;
        particles.push({
            x: circle.x,
            y: circle.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            alpha: 1,
            color: circle.type === 'clock' ? '#32CD32' : 
                   circle.type === 'bomb' ? '#FF4500' : '#4169E1'
        });
    }

    switch (circle.type) {
        case 'clock':
            timeLeft += timeBonusPerClock;
            break;
        case 'bomb':
            updateScore(-scorePenaltyBomb);
            break;
        default:
            updateScore(scorePerCircle);
    }

    circles.splice(circleIndex, 1);
}

function updateGame() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw slice effects
    sliceEffects = sliceEffects.filter(effect => {
        effect.draw(ctx);
        return effect.alpha > 0;
    });

    // Update and draw circles
    for (let i = circles.length - 1; i >= 0; i--) {
        let circle = circles[i];
        circle.x += circle.vx * circleSpeedAdjustment;
        circle.y += circle.vy * circleSpeedAdjustment;

        if (circle.x + circle.radius < 0 || 
            circle.x - circle.radius > canvasWidth ||
            circle.y + circle.radius < 0 || 
            circle.y - circle.radius > canvasHeight) {
            circles.splice(i, 1);
            continue;
        }

        drawCircle(circle);
    }

    // Check for slicing
    if (isDragging && lastX !== undefined) {
        const dx = mouseX - lastX;
        const dy = mouseY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            drawSliceEffect(lastX, lastY, mouseX, mouseY);
            
            // Check for circle hits
            circles.forEach((circle, index) => {
                if (isCircleSliced(lastX, lastY, mouseX, mouseY, circle)) {
                    handleCircleCollision(index);
                }
            });
        }
    }

    lastX = mouseX;
    lastY = mouseY;
}

function isCircleSliced(x1, y1, x2, y2, circle) {
    const lineLength = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (lineLength === 0) return false;

    const dot = (((circle.x-x1)*(x2-x1)) + ((circle.y-y1)*(y2-y1))) / (lineLength**2);
    const closestX = x1 + (dot * (x2-x1));
    const closestY = y1 + (dot * (y2-y1));

    if (dot < 0 || dot > 1) return false;

    const distance = Math.sqrt((closestX-circle.x)**2 + (closestY-circle.y)**2);
    return distance <= circle.radius;
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
}

function handleMouseUp() {
    isDragging = false;
    lastX = undefined;
    lastY = undefined;
}

function initGame() {
    setInterval(createCircle, circleSpawnFrequency/circleSpawnAdjust);
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
    if(gameRunning) requestAnimationFrame(gameLoop);
}

initGame();
