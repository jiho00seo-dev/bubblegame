const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const startScreen = document.getElementById('start-screen');
const resultScreen = document.getElementById('result-screen');
const finalScoreElement = document.getElementById('final-score-val');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let timeLeft = 30;
let gameStatus = 'READY'; // READY, PLAYING, ENDED
let bubbles = [];
let animationId;
let spawnTimer;

class Bubble {
    constructor() {
        this.radius = Math.random() * 30 + 15;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = Math.random() * 2 + 1;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
        this.wiggle = 0;
        this.wiggleSpeed = Math.random() * 0.05;
    }

    update() {
        this.y -= this.speed;
        this.wiggle += this.wiggleSpeed;
        this.x += Math.sin(this.wiggle) * 0.5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Bubble gradient
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight shine
        ctx.beginPath();
        ctx.ellipse(
            this.x - this.radius * 0.4,
            this.y - this.radius * 0.4,
            this.radius * 0.2,
            this.radius * 0.1,
            Math.PI / 4, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

function spawnBubble() {
    if (gameStatus !== 'PLAYING') return;
    bubbles.push(new Bubble());

    // Randomize next spawn time
    const nextSpawn = Math.random() * 800 + 200;
    spawnTimer = setTimeout(spawnBubble, nextSpawn);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        bubbles[i].draw();

        // Remove if bubble goes off screen
        if (bubbles[i].y + bubbles[i].radius < 0) {
            bubbles.splice(i, 1);
        }
    }

    animationId = requestAnimationFrame(animate);
}

function startGame() {
    score = 0;
    timeLeft = 30;
    bubbles = [];
    gameStatus = 'PLAYING';

    scoreElement.textContent = '000';
    timeElement.textContent = '30s';

    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    spawnBubble();

    const gameTimer = setInterval(() => {
        timeLeft--;
        timeElement.textContent = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameStatus = 'ENDED';
    clearTimeout(spawnTimer);
    resultScreen.classList.remove('hidden');
    finalScoreElement.textContent = score;
}

canvas.addEventListener('mousedown', (e) => {
    if (gameStatus !== 'PLAYING') return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        const dist = Math.sqrt((mouseX - bubble.x) ** 2 + (mouseY - bubble.y) ** 2);

        if (dist < bubble.radius) {
            // Burst effect could be added here
            bubbles.splice(i, 1);
            score += Math.round(50 / (bubble.radius / 10)); // Smaller bubbles = more points
            scoreElement.textContent = score.toString().padStart(3, '0');
            break;
        }
    }
});

// Mobile touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    // Reuse the same logic for touch
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        const dist = Math.sqrt((mouseX - bubble.x) ** 2 + (mouseY - bubble.y) ** 2);
        if (dist < bubble.radius) {
            bubbles.splice(i, 1);
            score += Math.round(50 / (bubble.radius / 10));
            scoreElement.textContent = score.toString().padStart(3, '0');
            break;
        }
    }
}, { passive: false });

window.addEventListener('resize', resizeCanvas);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Init
resizeCanvas();
animate();
spawnBubble(); // Initial call
gameStatus = 'READY'; // Reset after initial spawn call
clearTimeout(spawnTimer);
