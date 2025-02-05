// const canvas = document.getElementById('gameCanvas');
// const ctx = canvas.getContext('2d');
// const scoreDisplay = document.getElementById('score');
// const timerDisplay = document.getElementById('timer');

// // --- Game Settings (Adjust These to your liking) ---
// const canvasWidth = 800; // Adjust as needed
// const canvasHeight = 1000;
// canvas.width = canvasWidth;
// canvas.height = canvasHeight;
// const circleMinRadius = 20;
// const circleMaxRadius = 50;
// const circleSpawnFrequency = 1000; // Milliseconds
// const circleBaseSpeed = 5; // Speed of each circle on X and Y
// const scorePerCircle = 10; // Base score for slicing
// const timeBonusPerClock = 5; // Time bonus for clock circle
// const scorePenaltyBomb = 50; // Score penalty for Bomb circle
// const clockCircleChance = 0.1; // 10% chance for clock circle
// const bombCircleChance = 0.05; // 5% chance for bomb circle
// let circleSpeedAdjustment = 1; // Adjust overall circle speed
// let circleSpawnAdjust = 1; // Adjust overall circle spawn rate

// let score = 0;
// let timeLeft = 60;
// let gameRunning = true;

// const circles = []; // Stores all circles
// let mouseX, mouseY, isDragging = false;

// const appContainer = document.getElementById('app-container');
// const gameContainer = document.querySelector('.game-container');
// const gameWrapper = document.getElementById('game-wrapper');

// [appContainer, gameContainer, gameWrapper].forEach(element => {
//     element.addEventListener('touchstart', (e) => {
//         e.preventDefault();
//     }, { passive: false });
    
//     element.addEventListener('touchmove', (e) => {
//         e.preventDefault();
//     }, { passive: false });
    
//     element.addEventListener('touchend', (e) => {
//         e.preventDefault();
//     }, { passive: false });
// });

// // Prevent body scrolling
// document.body.style.overflow = 'hidden';
// document.body.style.position = 'fixed';
// document.documentElement.style.overflow = 'hidden';

// function updateScore(amount) {
//     score += amount;
//     scoreDisplay.textContent = `Score: ${score}`;
// }

// function updateTimerDisplay() {
//   timerDisplay.textContent = `Time: ${timeLeft}`;
// }

// function circle(x, y, radius, type = 'normal') {
//   return { x, y, radius, vx: (Math.random() * 2 - 1) * circleBaseSpeed, vy: (Math.random() * 2 - 1) * circleBaseSpeed, type };
// }

// function createCircle() {
//     const radius = circleMinRadius + Math.random() * (circleMaxRadius - circleMinRadius);
//     let x, y;

//     // Try to avoid initial overlaps on the edges of the screen:
//     if (Math.random() < 0.5) {
//       x = Math.random() < 0.5 ? -radius : canvasWidth + radius;
//       y = Math.random() * canvasHeight;
//     }
//     else {
//         x = Math.random() * canvasWidth;
//         y = Math.random() < 0.5 ? -radius : canvasHeight + radius;
//     }

//     let type = 'normal';
//     if (Math.random() < clockCircleChance) type = 'clock';
//     else if (Math.random() < bombCircleChance) type = 'bomb';

//     circles.push(circle(x, y, radius, type));
// }

// function drawCircle(circle) {
//     ctx.beginPath();
//     ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);

//     switch (circle.type) {
//         case 'clock':
//             ctx.fillStyle = 'green';
//             break;
//         case 'bomb':
//             ctx.fillStyle = 'red';
//             break;
//         default:
//             ctx.fillStyle = 'blue'; // Normal circle
//     }

//     ctx.fill();
//     ctx.closePath();
// }

// function handleCircleCollision(circleIndex) {
//   const circle = circles[circleIndex];

//   switch (circle.type) {
//     case 'clock':
//       timeLeft += timeBonusPerClock;
//       break;
//     case 'bomb':
//         updateScore(-scorePenaltyBomb);
//         break;
//     default:
//       updateScore(scorePerCircle);
//   }

//   circles.splice(circleIndex, 1);
// }

// function updateGame() {
//   if (!gameRunning) return;
  
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   for (let i = circles.length - 1; i >= 0; i--) {
//     let circle = circles[i];

//     circle.x += circle.vx * circleSpeedAdjustment;
//     circle.y += circle.vy * circleSpeedAdjustment;

//     // Remove circle if it's off the screen
//     if (circle.x + circle.radius < 0 || circle.x - circle.radius > canvasWidth ||
//         circle.y + circle.radius < 0 || circle.y - circle.radius > canvasHeight) {
//         circles.splice(i, 1);
//         continue;
//     }

//     drawCircle(circle);

//     if (isDragging && isCircleHit(mouseX, mouseY, circle)) {
//         handleCircleCollision(i);
//         break; // only cut one at a time
//     }
//   }
// }

// function gameLoop() {
//   updateGame();
//   if(gameRunning) requestAnimationFrame(gameLoop);
// }

// // Add this function to handle score updates
// function updateUserScore(userId, gameScore) {
//   const db = firebase.database()
//   const userRef = db.ref(`users/${userId}`)

//   userRef
//     .once("value")
//     .then((snapshot) => {
//       if (snapshot.exists()) {
//         // User exists, update the score
//         const userData = snapshot.val()
//         const currentScore = userData.score || 0
//         const newTotalScore = currentScore + gameScore

//         return userRef.update({
//           score: newTotalScore,
//           lastPlayed: Date.now(),
//         })
//       } else {
//         // New user, initialize with the game score
//         return userRef.set({
//           score: gameScore,
//           lastPlayed: Date.now(),
//         })
//       }
//     })
//     .then(() => {
//       console.log("Score updated successfully! Added:", gameScore)
//     })
//     .catch((error) => {
//       console.error("Error updating score:", error)
//     })
// }

// function gameTimer(){
//     if(!gameRunning) return;
//     if (timeLeft <= 0) {
//         gameRunning = false;
//         try {
//           const tg = window.Telegram.WebApp
//           if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
//             throw new Error("Telegram WebApp user data not available")
//           }
    
//           const userId = tg.initDataUnsafe.user.id.toString()
    
//           updateUserScore(userId, score)
    
//           alert(`Game Over! Your score: ${score}`)
//         } catch (error) {
//           console.error("Error handling game end:", error)
//           alert(`Game Over! Score: ${score}. Error saving score.`)
//         }
//         return
//       }
//     timeLeft--;
//     updateTimerDisplay();
//     setTimeout(gameTimer, 1000); // Countdown every 1 second
// }

// function isCircleHit(x, y, circle) {
//     const distX = x - circle.x;
//     const distY = y - circle.y;
//     return Math.sqrt(distX * distX + distY * distY) <= circle.radius;
// }

// function handleTouchStart(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     isDragging = true;
//     const rect = canvas.getBoundingClientRect();
//     mouseX = e.touches[0].clientX - rect.left;
//     mouseY = e.touches[0].clientY - rect.top;
//     console.log('Touch Start:', mouseX, mouseY); // Debugging
// }

// function handleTouchMove(e) {
//     if (!isDragging) return;
//     e.preventDefault();
//     e.stopPropagation();
//     const rect = canvas.getBoundingClientRect();
//     mouseX = e.touches[0].clientX - rect.left;
//     mouseY = e.touches[0].clientY - rect.top;
//     console.log('Touch Move:', mouseX, mouseY); // Debugging
// }

// function handleTouchEnd(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     isDragging = false;
//     console.log('Touch End'); // Debugging
// }

// function handleMouseDown(e) {
//     isDragging = true;
//     mouseX = e.clientX - canvas.offsetLeft;
//     mouseY = e.clientY - canvas.offsetTop;
// }

// function handleMouseMove(e) {
//     if (!isDragging) return;
//     mouseX = e.clientX - canvas.offsetLeft;
//     mouseY = e.clientY - canvas.offsetTop;
// }

// function handleMouseUp() {
//     isDragging = false;
// }

// // Initialize Game
// function initGame(){
//     setInterval(createCircle, circleSpawnFrequency/circleSpawnAdjust);
//     gameLoop();
//     gameTimer();

//     canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
//     canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
//     canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

//     canvas.addEventListener('mousedown', handleMouseDown, false);
//     canvas.addEventListener('mousemove', handleMouseMove, false);
//     canvas.addEventListener('mouseup', handleMouseUp, false);
// }

// initGame(); 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');

// --- Game Settings ---
const canvasWidth = 800; // Adjust as needed
const canvasHeight = 1000;
canvas.width = canvasWidth;
canvas.height = canvasHeight;
const circleMinRadius = 20;
const circleMaxRadius = 50;
const circleSpawnFrequency = 800; // Increased frequency
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

const circles = []; // Stores all circles
let mouseX, mouseY, isDragging = false;

[document.body, canvas].forEach(element => {
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

    switch (circle.type) {
        case 'clock':
            timeLeft += timeBonusPerClock;
            break;
        case 'bomb':
            updateScore(-scorePenaltyBomb);
            break;
        default:
            updateScore(scorePerCircle);
            break;
    }

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

    if (Math.random() < circleSpawnFrequency / 1000) {
        createCircle();
    }

    if (timeLeft <= 0) {
        gameRunning = false;
        alert('Game Over! Final Score: ' + score);
    } else {
        updateTimerDisplay();
        requestAnimationFrame(updateGame);
    }
}

function isCircleHit(mouseX, mouseY, circle) {
    return Math.sqrt((mouseX - circle.x) ** 2 + (mouseY - circle.y) ** 2) < circle.radius;
}

setInterval(() => {
    if (gameRunning) timeLeft--;
    updateTimerDisplay();
}, 1000);

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    isDragging = true;
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

setInterval(() => {
    if (gameRunning) {
        updateGame();
    }
}, 1000 / 60);

