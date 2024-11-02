const canvas = document.getElementById("background");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const lines = [];
const lineLength = 400;
const growthRate = 2;
const maxLines = 12;
const delay = 30;
const fadeRate = 0.02;

let frameCount = 0;
let colorToggle = true; // Toggle between colors

class Line {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = 0;
        this.opacity = 1;
        this.active = true;
        this.color = colorToggle ? "#00d0ff" : "#ffffff";
        colorToggle = !colorToggle;
    }

    update() {
        if (this.length < lineLength) {
            this.length += growthRate;
        } else {
            this.opacity -= fadeRate;
            if (this.opacity <= 0) {
                this.active = false;
            }
        }

        const endX = this.x + Math.cos(this.angle) * this.length;
        const endY = this.y + Math.sin(this.angle) * this.length;

        ctx.strokeStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${this.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${this.opacity})`;
        ctx.fill();

        return { x: endX, y: endY };
    }
}

function randomAngle() {
    const diagonalAngles = [Math.PI / 4, (3 * Math.PI) / 4, -Math.PI / 4, -(3 * Math.PI) / 4];
    return diagonalAngles[Math.floor(Math.random() * diagonalAngles.length)];
}

function generateRandomPosition() {
    const gridSize = 8;
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    const gridX = Math.floor(Math.random() * gridSize);
    const gridY = Math.floor(Math.random() * gridSize);

    const x = gridX * cellWidth + Math.random() * cellWidth;
    const y = gridY * cellHeight + Math.random() * cellHeight;

    return { x, y };
}

function linesIntersect(line1, line2) {
    const p1 = { x: line1.x, y: line1.y };
    const p2 = { x: line1.x + Math.cos(line1.angle) * lineLength, y: line1.y + Math.sin(line1.angle) * lineLength };
    const p3 = { x: line2.x, y: line2.y };
    const p4 = { x: line2.x + Math.cos(line2.angle) * lineLength, y: line2.y + Math.sin(line2.angle) * lineLength };

    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0) return false;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}

function isCollision(x, y, angle) {
    const newLine = new Line(x, y, angle);
    for (let line of lines) {
        if (linesIntersect(newLine, line)) {
            return true;
        }
    }
    return false;
}

function addLine() {
    if (frameCount % delay === 0) {
        let position;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            position = generateRandomPosition();
            attempts++;
        } while (isCollision(position.x, position.y, randomAngle()) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
            lines.push(new Line(position.x, position.y, randomAngle()));
            if (lines.length > maxLines) {
                lines.shift();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach(line => {
        if (line.active) line.update();
    });

    addLine();
    frameCount++;
    requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let isPlaying = false;
const mainAudio = document.getElementById("background-music");
mainAudio.volume = 0.4;

const musicToggle = document.getElementById("music-toggle");
musicToggle.addEventListener("click", function () {
    if (!isPlaying) {
        mainAudio.play().then(() => {
            isPlaying = true;
            updateToggleIcon();
        }).catch(error => {
            console.error("Error playing audio:", error);
        })
    } else {
        mainAudio.pause();
        isPlaying = false;
        updateToggleIcon();
    }
});

function updateToggleIcon() {
    const playIcon = document.getElementById("play-icon");
    if (isPlaying) {
        playIcon.classList.remove("fa-volume-mute");
        playIcon.classList.add("fa-volume-up");
    } else {
        playIcon.classList.remove("fa-volume-up");
        playIcon.classList.add("fa-volume-mute");
    }
}

function startAudio() {
    mainAudio.play();
    isPlaying = true;
}

const consentBox = document.getElementById("consentBox");
const acceptBtn = document.querySelector(".consentButton");
const rejectBtn = document.querySelector(".rejectButton");

if (document.cookie.indexOf("CookieBy=GeeksForGeeks") === -1) {
    consentBox.classList.remove("hide");
    acceptBtn.focus();
} else {
    consentBox.classList.add("hide");
}

acceptBtn.onclick = () => {
    document.cookie = "CookieBy=GeeksForGeeks; max-age=" + 60 * 60 * 24;
    if (document.cookie) {
        consentBox.classList.add("hide");
    } else {
        alert("Cookie can't be set! Please unblock this site from the cookie setting of your browser.");
    }
    startAudio();
};

rejectBtn.onclick = () => {
    alert("Cookies rejected. Some functionality may be limited.");
    startAudio();
    consentBox.classList.add("hide");
};
