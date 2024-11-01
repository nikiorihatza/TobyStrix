const canvas = document.getElementById("background");
const ctx = canvas.getContext("2d");

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables
const lines = [];
const lineLength = 400;  // Length of each line
const growthRate = 2;    // Speed at which each line extends
const maxLines = 12;     // Maximum number of concurrent lines
const delay = 30;        // Frames delay between adding new lines
const fadeRate = 0.02;   // Rate at which each line fades out

let frameCount = 0;      // Counter to manage delay between line additions

// Line class
class Line {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = 0;
        this.opacity = 1; // Start at full opacity
        this.active = true;
    }

    update() {
        if (this.length < lineLength) {
            this.length += growthRate; // Increase length by growthRate
        } else {
            this.opacity -= fadeRate; // Start fading out once max length is reached
            if (this.opacity <= 0) {
                this.active = false; // Deactivate once fully faded out
            }
        }

        const endX = this.x + Math.cos(this.angle) * this.length;
        const endY = this.y + Math.sin(this.angle) * this.length;

        // Draw line with opacity fading from start to end
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw glowing dot at the end with reduced opacity
        ctx.beginPath();
        ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();

        // Return the end position for intersection checks
        return { x: endX, y: endY };
    }
}

// Random angle generator (diagonal only: 45° or 135° intervals)
function randomAngle() {
    const diagonalAngles = [Math.PI / 4, (3 * Math.PI) / 4, -Math.PI / 4, -(3 * Math.PI) / 4];
    return diagonalAngles[Math.floor(Math.random() * diagonalAngles.length)];
}

// Generate a random position evenly distributed across the canvas
function generateRandomPosition() {
    const gridSize = 8; // Divide screen into an 8x8 grid
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    const gridX = Math.floor(Math.random() * gridSize);
    const gridY = Math.floor(Math.random() * gridSize);

    // Generate position within a cell
    const x = gridX * cellWidth + Math.random() * cellWidth;
    const y = gridY * cellHeight + Math.random() * cellHeight;

    return { x, y };
}

// Check if two lines intersect
function linesIntersect(line1, line2) {
    const p1 = { x: line1.x, y: line1.y };
    const p2 = { x: line1.x + Math.cos(line1.angle) * lineLength, y: line1.y + Math.sin(line1.angle) * lineLength };
    const p3 = { x: line2.x, y: line2.y };
    const p4 = { x: line2.x + Math.cos(line2.angle) * lineLength, y: line2.y + Math.sin(line2.angle) * lineLength };

    // Calculate the intersection using vector mathematics
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0) return false; // Lines are parallel

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}

// Check if the new position collides with existing lines
function isCollision(x, y, angle) {
    const newLine = new Line(x, y, angle);
    for (let line of lines) {
        if (linesIntersect(newLine, line)) {
            return true; // Collision detected
        }
    }
    return false;
}

// Add new line at controlled interval
function addLine() {
    if (frameCount % delay === 0) {
        let position;
        let attempts = 0;
        const maxAttempts = 10; // Limit attempts to find a valid position

        do {
            position = generateRandomPosition();
            attempts++;
        } while (isCollision(position.x, position.y, randomAngle()) && attempts < maxAttempts);

        // Only add the line if a valid position was found
        if (attempts < maxAttempts) {
            lines.push(new Line(position.x, position.y, randomAngle()));
            if (lines.length > maxLines) {
                lines.shift(); // Limit number of lines to avoid overcrowding
            }
        }
    }
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Fully clear the canvas each frame

    lines.forEach(line => {
        if (line.active) line.update();
    });

    addLine();
    frameCount++;
    requestAnimationFrame(animate);
}

animate();

// Handle resizing
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Track the audio state
let isPlaying = false; // Start with audio as paused
const mainAudio = document.getElementById("background-music");

// Function to toggle music on click
const musicToggle = document.getElementById("music-toggle");
musicToggle.addEventListener("click", function () {
    if (!isPlaying) {
        mainAudio.play().then(() => {
            isPlaying = true; // Set state to playing
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

// Function to update the toggle icon
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

// Show the consent box when the page loads and focus on the accept button
const consentBox = document.getElementById("consentBox");
const acceptBtn = document.querySelector(".consentButton");
const rejectBtn = document.querySelector(".rejectButton");

if (document.cookie.indexOf("CookieBy=GeeksForGeeks") === -1) {
    consentBox.classList.remove("hide");
    acceptBtn.focus(); // Focus on the accept button
} else {
    consentBox.classList.add("hide");
}

// Handle button clicks
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
