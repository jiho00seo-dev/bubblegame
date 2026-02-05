const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const levelElement = document.getElementById('level');
const startScreen = document.getElementById('start-screen');
const resultScreen = document.getElementById('result-screen');
const finalScoreElement = document.getElementById('final-score-val');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let timeLeft = 10;
let level = 1;
let gameStatus = 'READY'; // READY, PLAYING, ENDED
let bubbles = [];
let animationId;
let spawnTimer;
let gameTimerInterval;

class Bubble {
    constructor(currentLevel) {
        this.radius = Math.random() * 30 + 15;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        // 속도 증가: 기본 속도에 레벨 비례 가산
        this.speed = (Math.random() * 2 + 1.5) * (1 + (currentLevel - 1) * 0.25);
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
        this.wiggle = 0;
        this.wiggleSpeed = Math.random() * 0.05;
    }

    update() {
        this.y -= this.speed;
        this.wiggle += this.wiggleSpeed;
        this.x += Math.sin(this.wiggle) * 0.5;

        // 천장에 닿으면 게임 오버
        if (this.y - this.radius <= 0) {
            endGame('MISSED');
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

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
    bubbles.push(new Bubble(level));

    // 무작위 생성 간격 (레벨이 올라갈수록 조금 더 짧게)
    const nextSpawn = (Math.random() * 700 + 300) / (1 + (level - 1) * 0.1);
    spawnTimer = setTimeout(spawnBubble, nextSpawn);
}

function animate() {
    if (gameStatus !== 'PLAYING') {
        animationId = requestAnimationFrame(animate);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        if (gameStatus !== 'PLAYING') break; // update 도중 endGame 호출될 수 있음
        bubbles[i].draw();
    }

    animationId = requestAnimationFrame(animate);
}

function startGame() {
    score = 0;
    level = 1;
    startLevel();
}

function startLevel() {
    timeLeft = 10;
    bubbles = [];
    gameStatus = 'PLAYING';

    scoreElement.textContent = score.toString().padStart(3, '0');
    timeElement.textContent = `${timeLeft}s`;
    levelElement.textContent = level;

    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    if (spawnTimer) clearTimeout(spawnTimer);
    spawnBubble();

    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
        timeLeft--;
        timeElement.textContent = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(gameTimerInterval);
            nextLevel();
        }
    }, 1000);
}

function nextLevel() {
    level++;
    startLevel();
}

function endGame(reason) {
    gameStatus = 'ENDED';
    clearInterval(gameTimerInterval);
    clearTimeout(spawnTimer);

    resultScreen.classList.remove('hidden');
    finalScoreElement.textContent = score;

    if (reason === 'MISSED') {
        document.querySelector('#result-screen h2').textContent = 'Bubble Escaped!';
    } else {
        document.querySelector('#result-screen h2').textContent = 'Game Over!';
    }
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
            bubbles.splice(i, 1);
            // 레벨 가중치 반영 점수
            score += Math.round((50 / (bubble.radius / 10)) * (1 + (level - 1) * 0.5));
            scoreElement.textContent = score.toString().padStart(3, '0');
            break;
        }
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameStatus !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        const dist = Math.sqrt((mouseX - bubble.x) ** 2 + (mouseY - bubble.y) ** 2);
        if (dist < bubble.radius) {
            bubbles.splice(i, 1);
            score += Math.round((50 / (bubble.radius / 10)) * (1 + (level - 1) * 0.5));
            scoreElement.textContent = score.toString().padStart(3, '0');
            break;
        }
    }
}, { passive: false });

window.addEventListener('resize', resizeCanvas);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

resizeCanvas();
animate();
