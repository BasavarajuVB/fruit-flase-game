const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

// --- Game Settings ---
const canvasWidth = 800; 
const canvasHeight = 1000;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
const circleMinRadius = 20;
const circleMaxRadius = 50;
const circleSpawnFrequency = 1200; 
const circleBaseSpeed = 2;
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

const circles = [];
let mouseX, mouseY, isDragging = false;

const appContainer = document.getElementById('app-container');
const gameContainer = document.querySelector('.game-container');
const gameWrapper = document.getElementById('game-wrapper');

[appContainer, gameContainer, gameWrapper].forEach(element => {
    element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    element.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
});

// Prevent body scrolling
document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.documentElement.style.overflow = 'hidden';

function updateScore(amount) {
    score += amount;
    scoreDisplay.textContent = `Score: ${score}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = `Time: ${timeLeft}`;
}

function circle(x, y, radius, type = 'normal') {
  return { x, y, radius, vx: (Math.random() * 2 - 1) * circleBaseSpeed, vy: (Math.random() * 2 - 1) * circleBaseSpeed, type };
}

function createCircle() {
    const radius = circleMinRadius + Math.random() * (circleMaxRadius - circleMinRadius);
    let x, y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -radius : canvasWidth + radius;
      y = Math.random() * canvasHeight;
    } else {
        x = Math.random() * canvasWidth;
        y = Math.random() < 0.5 ? -radius : canvasHeight + radius;
    }

    let type = 'normal';
    if (Math.random() < clockCircleChance) type = 'clock';
    else if (Math.random() < bombCircleChance) type = 'bomb';

    circles.push(circle(x, y, radius, type));
}

function drawCircle(circle) {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fillStyle = circle.type === 'clock' ? 'green' : circle.type === 'bomb' ? 'red' : 'blue';
    ctx.fill();
    ctx.closePath();
}

function handleCircleCollision(circleIndex) {
    const circle = circles[circleIndex];

    if (circle.type === 'clock') timeLeft += timeBonusPerClock;
    else if (circle.type === 'bomb') updateScore(-scorePenaltyBomb);
    else updateScore(scorePerCircle);

    circles.splice(circleIndex, 1);
}

function updateGame() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = circles.length - 1; i >= 0; i--) {
        let circle = circles[i];

        circle.x += circle.vx * circleSpeedAdjustment;
        circle.y += circle.vy * circleSpeedAdjustment;

        if (circle.x + circle.radius < 0 || circle.x - circle.radius > canvasWidth ||
            circle.y + circle.radius < 0 || circle.y - circle.radius > canvasHeight) {
            circles.splice(i, 1);
            continue;
        }

        drawCircle(circle);

        if (isDragging && isCircleHit(mouseX, mouseY, circle)) {
            handleCircleCollision(i);
            break;
        }
    }
}

function gameLoop() {
    updateGame();
    if (gameRunning) requestAnimationFrame(gameLoop);
}

function gameTimer() {
    if (!gameRunning) return;

    if (timeLeft <= 0) {
        gameRunning = false;
        alert(`Game Over! Your score: ${score}`);
        return;
    }

    timeLeft--;
    updateTimerDisplay();
    setTimeout(gameTimer, 1000);
}

function isCircleHit(x, y, circle) {
    const distX = x - circle.x;
    const distY = y - circle.y;
    return Math.sqrt(distX * distX + distY * distY) <= circle.radius;
}

function handleTouchStart(e) {
    isDragging = true;
    mouseX = e.touches[0].clientX - canvas.offsetLeft;
    mouseY = e.touches[0].clientY - canvas.offsetTop;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    mouseX = e.touches[0].clientX - canvas.offsetLeft;
    mouseY = e.touches[0].clientY - canvas.offsetTop;
}

function handleTouchEnd() {
    isDragging = false;
}

function handleMouseDown(e) {
    isDragging = true;
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
}

function handleMouseMove(e) {
    if (!isDragging) return;
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
}

function handleMouseUp() {
    isDragging = false;
}

// Initialize Game
function initGame() {
    setInterval(createCircle, circleSpawnFrequency / circleSpawnAdjust);
    gameLoop();
    gameTimer();

    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);

    canvas.addEventListener('mousedown', handleMouseDown, false);
    canvas.addEventListener('mousemove', handleMouseMove, false);
    canvas.addEventListener('mouseup', handleMouseUp, false);
}

initGame();
