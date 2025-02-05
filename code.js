const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

// --- Game Settings (Adjust These to your liking) ---
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
let sliceEffects = [];

const circles = [];
let mouseX, mouseY, isDragging = false;
let lastMouseX, lastMouseY;

const appContainer = document.getElementById('app-container');
const gameContainer = document.querySelector('.game-container');
const gameWrapper = document.getElementById('game-wrapper');

[appContainer, gameContainer, gameWrapper].forEach(element => {
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    element.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    element.addEventListener('touchend', (e) => {
        e.preventDefault();
    }, { passive: false });
});

document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.documentElement.style.overflow = 'hidden';

function updateScore(amount) {
    score += amount;
    scoreDisplay.textContent = `Score: ${score}`;
    showScorePopup(amount);
}

function showScorePopup(amount) {
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.left = `${mouseX}px`;
    popup.style.top = `${mouseY}px`;
    popup.style.color = amount > 0 ? '#2ecc71' : '#e74c3c';
    popup.style.fontSize = '24px';
    popup.style.fontWeight = 'bold';
    popup.style.pointerEvents = 'none';
    popup.textContent = amount > 0 ? `+${amount}` : amount;
    
    document.body.appendChild(popup);
    
    let opacity = 1;
    let posY = mouseY;
    
    function animate() {
        opacity -= 0.02;
        posY -= 1;
        popup.style.opacity = opacity;
        popup.style.top = `${posY}px`;
        
        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            popup.remove();
        }
    }
    
    requestAnimationFrame(animate);
}

function updateTimerDisplay() {
    timerDisplay.textContent = `Time: ${timeLeft}`;
}

function circle(x, y, radius, type = 'normal') {
    return { x, y, radius, vx: (Math.random() * 2 - 1) * circleBaseSpeed, vy: (Math.random() * 2 - 1) * circleBaseSpeed, type };
}

function createSliceEffect(x, y, color) {
    sliceEffects.push({
        x,
        y,
        color,
        size: 1,
        opacity: 1,
        angle: Math.atan2(mouseY - lastMouseY, mouseX - lastMouseX)
    });
}

function updateSliceEffects() {
    for (let i = sliceEffects.length - 1; i >= 0; i--) {
        const effect = sliceEffects[i];
        effect.size += 2;
        effect.opacity -= 0.05;
        
        if (effect.opacity <= 0) {
            sliceEffects.splice(i, 1);
            continue;
        }
        
        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.rotate(effect.angle);
        ctx.globalAlpha = effect.opacity;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-effect.size, 0);
        ctx.lineTo(effect.size, 0);
        ctx.stroke();
        ctx.restore();
    }
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

    switch (circle.type) {
        case 'clock':
            ctx.fillStyle = 'green';
            break;
        case 'bomb':
            ctx.fillStyle = 'red';
            break;
        default:
            ctx.fillStyle = 'blue';
    }

    ctx.fill();
    ctx.closePath();
}

function handleCircleCollision(circleIndex) {
    const circle = circles[circleIndex];
    const effectColor = circle.type === 'clock' ? '#2ecc71' : 
                       circle.type === 'bomb' ? '#e74c3c' : '#3498db';
    
    createSliceEffect(circle.x, circle.y, effectColor);

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
    
    updateSliceEffects();

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
    if(gameRunning) requestAnimationFrame(gameLoop);
}

function updateUserScore(userId, gameScore) {
    const db = firebase.database()
    const userRef = db.ref(`users/${userId}`)

    userRef
        .once("value")
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val()
                const currentScore = userData.score || 0
                const newTotalScore = currentScore + gameScore

                return userRef.update({
                    score: newTotalScore,
                    lastPlayed: Date.now(),
                })
            } else {
                return userRef.set({
                    score: gameScore,
                    lastPlayed: Date.now(),
                })
            }
        })
        .then(() => {
            console.log("Score updated successfully! Added:", gameScore)
        })
        .catch((error) => {
            console.error("Error updating score:", error)
        })
}

function gameTimer() {
    if(!gameRunning) return;
    if (timeLeft <= 0) {
        gameRunning = false;
        try {
            const tg = window.Telegram.WebApp
            if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
                throw new Error("Telegram WebApp user data not available")
            }
    
            const userId = tg.initDataUnsafe.user.id.toString()
            updateUserScore(userId, score)
            alert(`Game Over! Your score: ${score}`)
        } catch (error) {
            console.error("Error handling game end:", error)
            alert(`Game Over! Score: ${score}. Error saving score.`)
        }
        return
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
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = e.touches[0].clientX - canvas.offsetLeft;
    mouseY = e.touches[0].clientY - canvas.offsetTop;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = e.touches[0].clientX - canvas.offsetLeft;
    mouseY = e.touches[0].clientY - canvas.offsetTop;
}

function handleTouchEnd() {
    isDragging = false;
}

function handleMouseDown(e) {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
}

function handleMouseMove(e) {
    if (!isDragging) return;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
}

function handleMouseUp() {
    isDragging = false;
}

function initGame() {
    setInterval(createCircle, circleSpawnFrequency/circleSpawnAdjust);
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
