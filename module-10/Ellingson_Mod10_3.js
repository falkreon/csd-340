/*
 * CSD340: Web Development
 * Module 10.3 Assignment: JavaScript Exercise, Part 2
 * Isaac Ellingson
 * 3/8/2026
 */

const updatesPerSec = 60;
const msecPerTick = 1000 / updatesPerSec;

const acceleration = 0.6;
const minAccel = 0.01;
const terminalVelocity = 8;
const repulsion = 0.2;

let particles = [];
let field = { width: 500, height: 500 };
let attractor = { x: 250, y: 250 };

let repulse = false;

let detectedWidth = 500;
let offsetToCanvas = 1;

function beginUpdateLoop() {
    for(let i=0; i<100; i++) {
        particles.push({
            x: Math.random() * 450 + 5,
            y: Math.random() * 450 + 5,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 - 2
        });
    }

    document.getElementById("particle-canvas").addEventListener("mousemove", (e) => {
        attractor.x = e.offsetX * offsetToCanvas;
        attractor.y = e.offsetY * offsetToCanvas;
    });

    document.getElementById("particle-canvas").addEventListener("mousedown", (e) => {
        repulse = true;
    });

    document.getElementById("particle-canvas").addEventListener("mouseup", (e) => {
        repulse = false;
    });

    document.getElementById("particle-canvas").addEventListener("mouseout", (e) => {
        repulse = false;
        attractor.x = field.width / 2;
        attractor.y = field.height / 2;
    });

    console.log("Fun!");
    requestAnimationFrame(updateLoop);
}

var partialTickTime = 0;
let lastUpdate;

function updateLoop(timestamp) {
    let elapsed = 0;

    if (lastUpdate === undefined) {
        lastUpdate = timestamp;
    } else {
        elapsed = timestamp - lastUpdate;
        lastUpdate = timestamp;
    }

    partialTickTime += elapsed;
    let frameProgress = partialTickTime / msecPerTick;
    if (frameProgress > 1) frameProgress = 1;

    if (partialTickTime >= msecPerTick) {
        tick();
        partialTickTime %= msecPerTick;
    }

    render(frameProgress);

    requestAnimationFrame(updateLoop);
}

function render(t) {
    let canvas = document.getElementById("particle-canvas");
    const offsetWidth = canvas.parentElement.offsetWidth;

    field.width = canvas.getBoundingClientRect().width;
    field.height = canvas.getBoundingClientRect().height;
    canvas.width = field.width;
    canvas.height = field.height;

    let smile = document.getElementById("smile");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 500, 500);

    for(const particle of particles) {

        ctx.drawImage(smile, particle.x - 8, particle.y - 8, 18, 18);
    }
}

/**
 * Minimum saturation around zero - basically, if a number gets close to zero on either side,
 * this function forces the value to "stand off" by at least limit.
 */
function softMinSaturate(val, limit) {
    if (val < 0) {
        return (val > -limit) ? -limit : val;
    } else if (val > 0) {
        return (val < limit) ? limit : val;
    } else {
        return 0;
    }
}

/**
 * Clamp around zero - prevents val from exceeding limit on either side of zero.
 */
function clamp(val, limit) {
    if (val < 0) {
        return (val < -limit) ? -limit : val;
    } else if (val > 0) {
        return (val > limit) ? limit : val;
    } else {
        return 0;
    }
}

function doRepulsion(particle) {
    for(const other of particles) {
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const d2 = dx*dx + dy*dy;
        const r2 = 24 * 24;
        if (d2 < r2) {
            particle.vx += -dx / r2 * 8;
            particle.vy += -dy / r2 * 8;
        }
    }
}

function tick() {
    console.log("Tick...");
    for(const particle of particles) {
        // Accelerate particle towards attractor

        let xAccel = softMinSaturate((attractor.x - particle.x) / 500, minAccel);
        if (repulse) xAccel = -xAccel;
        particle.vx += acceleration * xAccel;

        let yAccel = softMinSaturate((attractor.y - particle.y) / 500, minAccel);
        if (repulse) yAccel = -yAccel;
        particle.vy += acceleration * yAccel;

        doRepulsion(particle);



        // Cap particle velocity
        particle.vx = clamp(particle.vx, terminalVelocity);
        particle.vy = clamp(particle.vy, terminalVelocity);

        // Update particle positions based on velocity
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Prevent particles from leaving the screen and bounce them if they do.
        if (particle.x < 0) {
            particle.x = 0;
            if (particle.vx < 0) particle.vx = -particle.vx;
        }
        if (particle.y < 0) {
            particle.y = 0;
            if (particle.vy < 0) particle.vy = -particle.vy;
        }
        if (particle.x > field.width) {
            particle.x = field.width;
            if (particle.vx > 0) particle.vx = -particle.vx;
        }
        if (particle.y > field.height) {
            particle.y = field.height;
            if (particle.vy > 0) particle.vy = -particle.vy;
        }
    }
}
