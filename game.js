const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
let score = 0;
let attempts = 0;
let gameRunning = true;

// Claw properties
const claw = {
    x: canvas.width / 2,
    y: 150,
    targetX: canvas.width / 2,
    width: 80,
    height: 60,
    isDropping: false,
    isReturning: false,
    isCarrying: false,
    speed: 2,
    dropSpeed: 3,
    minY: 150,
    maxY: canvas.height - 120,
    grabbing: false,
    grabbedDino: null
};

// Drop off box properties
const dropOffBox = {
    x: canvas.width - 200,
    y: canvas.height - 300,
    width: 120,
    height: 200,
    collected: []
};

// Dinosaur properties
const dinosaurs = [];
const dinoColors = [
    '#90EE90', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C',
    '#98FB98', '#FFDAB9', '#B0E0E6', '#EE82EE', '#F5DEB3'
];

const rainbowColors = ['#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#0080FF', '#8000FF'];

// Physics
const gravity = 0.3;
const friction = 0.98;
const bounce = 0.3;

// Create dinosaur
function createDinosaur(x, y) {
    return {
        x: x,
        y: y,
        width: 48,
        height: 48,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        color: dinoColors[Math.floor(Math.random() * dinoColors.length)],
        onGround: false,
        grabbed: false,
        collected: false
    };
}

// Initialize dinosaurs
function initDinosaurs() {
    dinosaurs.length = 0;
    const rows = 5;
    const cols = Math.floor((canvas.width - 400) / 60);
    const startY = canvas.height - 200;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = 150 + col * 60 + Math.random() * 20;
            const y = startY - row * 60 + Math.random() * 20;
            dinosaurs.push(createDinosaur(x, y));
        }
    }
}

// Draw pixelated rectangle
function drawPixelRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

// Draw claw
function drawClaw() {
    const clawX = Math.floor(claw.x);
    const clawY = Math.floor(claw.y);
    
    // Claw rope/cable
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(clawX, 0);
    ctx.lineTo(clawX, clawY);
    ctx.stroke();
    
    // Claw body
    drawPixelRect(clawX - 40, clawY - 30, 80, 60, '#c0c0c0');
    drawPixelRect(clawX - 36, clawY - 26, 72, 52, '#d3d3d3');
    
    // Claw arms
    if (claw.grabbing) {
        // Closed claw
        drawPixelRect(clawX - 30, clawY + 20, 16, 30, '#a0a0a0');
        drawPixelRect(clawX + 14, clawY + 20, 16, 30, '#a0a0a0');
        drawPixelRect(clawX - 6, clawY + 40, 12, 16, '#a0a0a0');
    } else {
        // Open claw
        drawPixelRect(clawX - 40, clawY + 20, 16, 30, '#a0a0a0');
        drawPixelRect(clawX + 24, clawY + 20, 16, 30, '#a0a0a0');
    }
}

// Draw cute pixelated dinosaur
function drawDinosaur(dino) {
    if (dino.collected) return;
    
    const x = Math.floor(dino.x);
    const y = Math.floor(dino.y);
    const w = dino.width;
    const h = dino.height;
    
    // Main body (skinnier, more vertical)
    drawPixelRect(x + 12, y + 16, w - 24, h - 24, dino.color);
    drawPixelRect(x + 10, y + 20, w - 20, h - 32, dino.color);
    drawPixelRect(x + 8, y + 24, w - 16, h - 36, dino.color);
    
    // Head (skinnier and more rounded)
    drawPixelRect(x + 14, y + 4, w - 28, 16, dino.color);
    drawPixelRect(x + 12, y + 8, w - 24, 12, dino.color);
    drawPixelRect(x + 10, y + 12, w - 20, 8, dino.color);
    
    // Belly (lighter shade, skinnier)
    const bellyColor = lightenColor(dino.color, 0.3);
    drawPixelRect(x + 14, y + 20, w - 28, h - 32, bellyColor);
    drawPixelRect(x + 16, y + 24, w - 32, h - 40, bellyColor);
    
    // Rainbow spikes along the back edge - outside the body
    const spikePositions = [y + 14, y + 22, y + 30];
    for (let i = 0; i < spikePositions.length; i++) {
        const spikeX = x + w - 8; // Position on the right edge
        const spikeY = spikePositions[i];
        const spikeColor = rainbowColors[i % rainbowColors.length];
        
        // Triangle spike extending outward
        drawPixelRect(spikeX, spikeY, 4, 4, spikeColor);
        drawPixelRect(spikeX + 2, spikeY - 2, 4, 2, spikeColor);
        drawPixelRect(spikeX + 4, spikeY - 4, 2, 1, spikeColor);
    }
    
    // Cute eyes (adjusted for skinnier head)
    drawPixelRect(x + 14, y + 12, 3, 3, '#000');
    drawPixelRect(x + 22, y + 12, 3, 3, '#000');
    
    // Eye shine
    drawPixelRect(x + 15, y + 13, 1, 1, '#FFF');
    drawPixelRect(x + 23, y + 13, 1, 1, '#FFF');
    
    // Cute smile (adjusted position)
    drawPixelRect(x + 17, y + 18, 2, 2, '#000');
    drawPixelRect(x + 20, y + 19, 2, 2, '#000');
    drawPixelRect(x + 23, y + 18, 2, 2, '#000');
    
    // Little arms (adjusted for skinnier body)
    drawPixelRect(x + 6, y + 24, 4, 8, dino.color);
    drawPixelRect(x + w - 10, y + 24, 4, 8, dino.color);
    
    // Little feet (adjusted spacing)
    drawPixelRect(x + 12, y + h - 8, 6, 6, dino.color);
    drawPixelRect(x + w - 18, y + h - 8, 6, 6, dino.color);
    
    // Tail (adjusted for skinnier body)
    drawPixelRect(x + w - 6, y + 20, 4, 12, dino.color);
    drawPixelRect(x + w - 4, y + 24, 4, 8, dino.color);
    
    // Subtle outline
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 4, w - 16, h - 8);
}

// Helper function to lighten color
function lightenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
}

// Update dinosaur physics
function updateDinosaurPhysics(dino) {
    if (dino.collected || dino.grabbed) return;
    
    // Apply gravity
    dino.vy += gravity;
    
    // Update position
    dino.x += dino.vx;
    dino.y += dino.vy;
    
    // Ground collision
    if (dino.y + dino.height >= canvas.height - 80) {
        dino.y = canvas.height - 80 - dino.height;
        dino.vy *= -bounce;
        dino.vx *= friction;
        dino.onGround = true;
        
        if (Math.abs(dino.vy) < 0.5) {
            dino.vy = 0;
        }
    }
    
    // Wall collisions
    if (dino.x <= 0) {
        dino.x = 0;
        dino.vx *= -bounce;
    }
    if (dino.x + dino.width >= canvas.width) {
        dino.x = canvas.width - dino.width;
        dino.vx *= -bounce;
    }
    
    // Drop off box collision - dinosaurs can't enter
    if (dino.x < dropOffBox.x + dropOffBox.width &&
        dino.x + dino.width > dropOffBox.x &&
        dino.y < dropOffBox.y + dropOffBox.height &&
        dino.y + dino.height > dropOffBox.y) {
        
        // Push dinosaur away from drop off box
        const dinoCenterX = dino.x + dino.width / 2;
        const dinoCenterY = dino.y + dino.height / 2;
        const dropCenterX = dropOffBox.x + dropOffBox.width / 2;
        const dropCenterY = dropOffBox.y + dropOffBox.height / 2;
        
        const dx = dinoCenterX - dropCenterX;
        const dy = dinoCenterY - dropCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const pushForce = 5;
            dino.vx += (dx / distance) * pushForce;
            dino.vy += (dy / distance) * pushForce;
            
            // Move dinosaur outside the drop off box
            dino.x += (dx / distance) * 3;
            dino.y += (dy / distance) * 3;
        }
    }
    
    // Dinosaur-to-dinosaur collisions (simplified)
    for (let other of dinosaurs) {
        if (other !== dino && !other.collected && !other.grabbed) {
            const dx = dino.x - other.x;
            const dy = dino.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < dino.width) {
                const overlap = dino.width - distance;
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                dino.x += normalX * overlap * 0.5;
                dino.y += normalY * overlap * 0.5;
                other.x -= normalX * overlap * 0.5;
                other.y -= normalY * overlap * 0.5;
                
                // Bounce
                const relativeVelocityX = dino.vx - other.vx;
                const relativeVelocityY = dino.vy - other.vy;
                const impulse = (relativeVelocityX * normalX + relativeVelocityY * normalY) * 0.5;
                
                dino.vx -= impulse * normalX;
                dino.vy -= impulse * normalY;
                other.vx += impulse * normalX;
                other.vy += impulse * normalY;
            }
        }
    }
}

// Update claw
function updateClaw() {
    if (!claw.isDropping && !claw.isReturning) {
        // Move towards target
        const dx = claw.targetX - claw.x;
        if (Math.abs(dx) > 1) {
            claw.x += dx * 0.1;
        }
    }
    
    // Claw physics interaction with dinosaurs
    if (claw.isDropping || claw.isReturning) {
        for (let dino of dinosaurs) {
            if (!dino.collected && !dino.grabbed) {
                // Check collision with claw body
                const clawLeft = claw.x - 40;
                const clawRight = claw.x + 40;
                const clawTop = claw.y - 30;
                const clawBottom = claw.y + 50;
                
                if (dino.x < clawRight && dino.x + dino.width > clawLeft &&
                    dino.y < clawBottom && dino.y + dino.height > clawTop) {
                    
                    // Push dinosaur away from claw
                    const dinoCenterX = dino.x + dino.width / 2;
                    const dinoCenterY = dino.y + dino.height / 2;
                    const clawCenterX = claw.x;
                    const clawCenterY = claw.y;
                    
                    const dx = dinoCenterX - clawCenterX;
                    const dy = dinoCenterY - clawCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const pushForce = 3;
                        dino.vx += (dx / distance) * pushForce;
                        dino.vy += (dy / distance) * pushForce;
                    }
                }
            }
        }
    }
    
    if (claw.isDropping) {
        claw.y += claw.dropSpeed;
        
        // Check if reached bottom
        if (claw.y >= claw.maxY) {
            claw.grabbing = true;
            
            // Check for dinosaur collision - original success rate (70%)
            for (let dino of dinosaurs) {
                if (!dino.collected && !dino.grabbed) {
                    const dx = claw.x - (dino.x + dino.width / 2);
                    const dy = claw.y - (dino.y + dino.height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 60) { // Increased grab range for bigger dinosaurs
                        // 70% success rate (original)
                        if (Math.random() > 0.3) {
                            dino.grabbed = true;
                            claw.grabbedDino = dino;
                            dino.vx = 0;
                            dino.vy = 0;
                            claw.isCarrying = true;
                        }
                        break;
                    }
                }
            }
            
            claw.isDropping = false;
            claw.isReturning = true;
        }
    }
    
    if (claw.isReturning) {
        claw.y -= claw.dropSpeed;
        
        // Move grabbed dinosaur with claw - ALWAYS follow until manually dropped
        if (claw.grabbedDino && claw.isCarrying) {
            // Sometimes drop the dinosaur while returning (30% drop rate)
            if (Math.random() < 0.006) { // 0.6% chance per frame to drop
                claw.grabbedDino.grabbed = false;
                claw.grabbedDino.vx = (Math.random() - 0.5) * 4;
                claw.grabbedDino.vy = Math.random() * 2;
                claw.grabbedDino = null;
                claw.isCarrying = false;
            } else {
                claw.grabbedDino.x = claw.x - claw.grabbedDino.width / 2;
                claw.grabbedDino.y = claw.y + 40;
                claw.grabbedDino.vx = 0;
                claw.grabbedDino.vy = 0;
            }
        }
        
        // Check if reached top
        if (claw.y <= claw.minY) {
            claw.y = claw.minY;
            claw.isReturning = false;
            claw.grabbing = false;
            
            // Only auto-collect if we still have the dinosaur and user didn't drop it
            if (claw.grabbedDino && !claw.isCarrying) {
                claw.grabbedDino.collected = true;
                score += 10;
                document.getElementById('score').textContent = score;
                claw.grabbedDino = null;
            }
            
            attempts++;
            document.getElementById('attempts').textContent = attempts;
        }
    }
    
    // Continue carrying dinosaur while moving horizontally
    if (claw.grabbedDino && claw.isCarrying && !claw.isDropping && !claw.isReturning) {
        claw.grabbedDino.x = claw.x - claw.grabbedDino.width / 2;
        claw.grabbedDino.y = claw.y + 40;
        claw.grabbedDino.vx = 0;
        claw.grabbedDino.vy = 0;
    }
}

// Draw background
function drawBackground() {
    // Machine background - changed to custom green
    drawPixelRect(0, 0, canvas.width, canvas.height, '#7B8D6A');
    
    // Machine walls - darker version of the background
    drawPixelRect(0, 0, 20, canvas.height, '#5A6B4A');
    drawPixelRect(canvas.width - 20, 0, 20, canvas.height, '#5A6B4A');
    
    // Floor - changed to gray
    drawPixelRect(0, canvas.height - 80, canvas.width, 80, '#808080');
    
    // Drop off box - darker version of the background
    drawPixelRect(dropOffBox.x, dropOffBox.y, dropOffBox.width, dropOffBox.height, '#5A6B4A');
    drawPixelRect(dropOffBox.x + 5, dropOffBox.y + 5, dropOffBox.width - 10, dropOffBox.height - 10, '#6B7A55');
    
    // Drop off box label
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('DROP', dropOffBox.x + 25, dropOffBox.y + 30);
    ctx.fillText('OFF', dropOffBox.x + 35, dropOffBox.y + 55);
    
    // Draw collected dinosaurs in drop off area
    for (let i = 0; i < dropOffBox.collected.length; i++) {
        const dino = dropOffBox.collected[i];
        const x = dropOffBox.x + 15 + (i % 3) * 30;
        const y = dropOffBox.y + dropOffBox.height - 45 - Math.floor(i / 3) * 30;
        
        // Small collected dinosaur (skinnier version)
        drawPixelRect(x + 4, y + 4, 20, 20, dino.color);
        drawPixelRect(x + 6, y + 6, 16, 16, dino.color);
        
        // Mini rainbow spike on the edge
        drawPixelRect(x + 22, y + 10, 2, 2, '#FF0000');
        drawPixelRect(x + 24, y + 8, 2, 1, '#00FF00');
        
        // Mini eyes
        drawPixelRect(x + 10, y + 10, 2, 2, '#000');
        drawPixelRect(x + 16, y + 10, 2, 2, '#000');
        
        // Mini smile
        drawPixelRect(x + 12, y + 16, 2, 2, '#000');
        drawPixelRect(x + 16, y + 16, 2, 2, '#000');
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update and draw dinosaurs
    for (let dino of dinosaurs) {
        updateDinosaurPhysics(dino);
        drawDinosaur(dino);
    }
    
    // Update and draw claw
    updateClaw();
    drawClaw();
    
    requestAnimationFrame(gameLoop);
}

// Input handling
canvas.addEventListener('click', (e) => {
    if (!claw.isDropping && !claw.isReturning) {
        claw.targetX = e.clientX;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!claw.isDropping && !claw.isReturning) {
            claw.isDropping = true;
        }
    }
    
    if (e.code === 'KeyR') {
        e.preventDefault();
        // Release grabbed dinosaur
        if (claw.grabbedDino && claw.isCarrying) {
            // Check if over drop off box
            if (claw.x >= dropOffBox.x && claw.x <= dropOffBox.x + dropOffBox.width) {
                // Successfully dropped in collection box
                dropOffBox.collected.push({
                    color: claw.grabbedDino.color
                });
                claw.grabbedDino.collected = true;
                score += 10;
                document.getElementById('score').textContent = score;
            } else {
                // Drop dinosaur back into play area
                claw.grabbedDino.grabbed = false;
                claw.grabbedDino.vx = (Math.random() - 0.5) * 4;
                claw.grabbedDino.vy = -2;
            }
            claw.grabbedDino = null;
            claw.isCarrying = false;
        }
    }
    
    if (e.code === 'ArrowLeft') {
        if (!claw.isDropping && !claw.isReturning) {
            claw.targetX = Math.max(30, claw.targetX - 20);
        }
    }
    
    if (e.code === 'ArrowRight') {
        if (!claw.isDropping && !claw.isReturning) {
            claw.targetX = Math.min(canvas.width - 30, claw.targetX + 20);
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    claw.maxY = canvas.height - 120;
    dropOffBox.x = canvas.width - 200;
    dropOffBox.y = canvas.height - 300;
    initDinosaurs();
});

// Start game
initDinosaurs();
gameLoop();