// Board configuration
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Bird dimensions and positioning
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;

let bird = {
x: birdX,
y: birdY,
width: birdWidth,
height: birdHeight
};
let birdImg;
let bgImg; // Built-in background image object

// Pipes configurations
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// Game Physics & States
let baseSpeed = -2;
let velocityX = baseSpeed;
let velocityY = 0;
let gravity = 0.4;

let gameStarted = false;
let gameOver = false;
let score = 0;

// --- LEVEL SYSTEM ---
let currentLevel = 1;
let scoreToNextLevel = 5;

// --- AUDIO OBJECTS ---
let bgmMario = new Audio("./bgm_mario.mp3");
let sfxWing = new Audio("./sfx_wing (2).wav");
let sfxPoint = new Audio("./sfx_point.wav");
let sfxHit = new Audio("./sfx_hit.wav");
let sfxDie = new Audio("./sfx_die.wav");

bgmMario.loop = true;
bgmMario.volume = 0.4;

window.onload = function() {
board = document.getElementById("board");
board.height = boardHeight;
board.width = boardWidth;
context = board.getContext("2d");

// Load Background Image
bgImg = new Image();
bgImg.src = "./flappybirdbg.png";

// Load Bird Image
birdImg = new Image();
birdImg.src = "./flappybird3.png";
birdImg.onload = function() {
context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

// Load Pipe Images
topPipeImg = new Image();
topPipeImg.src = "./toppipe.png";

bottomPipeImg = new Image();
bottomPipeImg.src = "./bottompipe.png";

// Main game render loop
requestAnimationFrame(update);

// Spawns pipes every 1.5 seconds
setInterval(placePipes, 1500);

// Event listener for controls
document.addEventListener("keydown", moveBird);
}

function update() {
requestAnimationFrame(update);

// Clear the previous frame
context.clearRect(0, 0, board.width, board.height);

// Draw the background image first so it sits behind gameplay elements
if (bgImg.complete) {
context.drawImage(bgImg, 0, 0, boardWidth, boardHeight);
}

// --- HOOFDMENU / START STATE ---
if (!gameStarted) {
context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

context.fillStyle = "white";
context.font = "bold 30px sans-serif";
context.fillText("FLAPPY BIRD", 85, boardHeight / 2 - 50);
context.font = "20px sans-serif";
context.fillText("Press Space to Start", 80, boardHeight / 2);
return;
}

// --- GAME OVER STATE ---
if (gameOver) {
// Draw the static pipes and bird where they crashed
for (let i = 0; i < pipeArray.length; i++) {
let pipe = pipeArray[i];
context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
}
context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

context.fillStyle = "red";
context.font = "bold 40px sans-serif";
context.fillText("GAME OVER", 55, boardHeight / 2);
context.fillStyle = "white";
context.font = "20px sans-serif";
context.fillText("Press Space to Restart", 75, (boardHeight / 2) + 40);

// Final Score Display
context.font = "bold 45px sans-serif";
context.fillText(Math.floor(score), 15, 50);
return;
}

// --- ACTIVE GAMEPLAY STATE ---

// Adjust speed based on the current level index
velocityX = baseSpeed - (currentLevel - 1) * 0.7;

// Apply gravity physics to bird
velocityY += gravity;
bird.y = Math.max(bird.y + velocityY, 0);

// Draw Bird
context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

// Check floor crash boundary
if (bird.y > boardHeight) {
bgmMario.pause();
sfxDie.play();
gameOver = true;
}

// Loop through and update pipes
for (let i = 0; i < pipeArray.length; i++) {
let pipe = pipeArray[i];
pipe.x += velocityX;

context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

// Score tracking
if (!pipe.passed && bird.x > pipe.x + pipe.width) {
score += 0.5;
if (score % 1 === 0) {
sfxPoint.currentTime = 0;
sfxPoint.play();
checkLevelUp();
}
pipe.passed = true;
}

// Collision logic check
if (detectCollision(bird, pipe)) {
bgmMario.pause();
sfxHit.play();
setTimeout(() => { sfxDie.play(); }, 400);
gameOver = true;
}
}

// Clear off-screen pipes to free memory cache
while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
pipeArray.shift();
}

// UI Displays (Score & Level)
context.fillStyle = "white";
context.font = "bold 40px sans-serif";
context.fillText(Math.floor(score), 15, 50);

context.font = "bold 20px sans-serif";
context.fillText("Level: " + currentLevel, boardWidth - 100, 40);
}

function checkLevelUp() {
let calculatedLevel = Math.floor(score / scoreToNextLevel) + 1;
if (calculatedLevel > currentLevel) {
currentLevel = calculatedLevel;
triggerLevelEffect();
}
}

function triggerLevelEffect() {
let gameBoard = document.getElementById("board");
if (currentLevel === 2) {
gameBoard.style.filter = "hue-rotate(45deg)";
} else if (currentLevel >= 3) {
gameBoard.style.filter = "hue-rotate(180deg)";
}
}

function placePipes() {
// If game hasn't started or is over, do absolutely nothing
if (!gameStarted || gameOver) {
return;
}

let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
let openingSpace = Math.max(board.height / 4 - (currentLevel * 5), board.height / 5.5);

let topPipe = {
img: topPipeImg,
x: pipeX,
y: randomPipeY,
width: pipeWidth,
height: pipeHeight,
passed: false
};
pipeArray.push(topPipe);

let bottomPipe = {
img: bottomPipeImg,
x: pipeX,
y: randomPipeY + pipeHeight + openingSpace,
width: pipeWidth,
height: pipeHeight,
passed: false
};
pipeArray.push(bottomPipe);
}

function moveBird(e) {
if (e.code == "Space" || e.code == "ArrowUp") {

// Handle transitions from Menu to Game
if (!gameStarted) {
pipeArray = [];
gameStarted = true;
bgmMario.play();
velocityY = -6;
sfxWing.currentTime = 0;
sfxWing.play();
return;
}

// Handle clean state reset on Game Over
if (gameOver) {
pipeArray = []; // COMPLETELY PURGE OLD PIPES
bird.y = birdY;
score = 0;
currentLevel = 1;
velocityY = 0;
velocityX = baseSpeed; // Reset pipe speed back to start settings

let gameBoard = document.getElementById("board");
gameBoard.style.filter = "none";

gameOver = false; // Toggle state back to live gameplay last
bgmMario.currentTime = 0;
bgmMario.play();
return;
}

// Normal gameplay jump
velocityY = -6;
sfxWing.currentTime = 0;
sfxWing.play();
}
}

function detectCollision(a, b) {
return a.x < b.x + b.width &&
a.x + a.width > b.x &&
a.y < b.y + b.height &&
a.y + a.height > b.y;
}
