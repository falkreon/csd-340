/*
 * CSD340: Web Development
 * Module 10.3 Assignment: JavaScript Exercise, Part 2
 *
 * Isaac Ellingson
 * 3/8/2026
 */

const updatesPerSec = 60;
const msecPerTick = 1000 / updatesPerSec;

const acceleration = 0.6;
const minAccel = 0.01;
const terminalVelocity = 8;
const repulsion = 0.2;

// A collection of {x, y, vx, vy} objects representing position and velocity
let particles = [];

// The size of the field the particles will be confined to
let field = { width: 500, height: 500 };

// The location of an attractor, towards which the particles are attracted
let attractor = { x: 250, y: 250 };

// If true, the attraction vector will be flipped
let repulse = false;


/**
 * Gets the location of a touch event on the particle canvas. This is way more complex than you'd
 * think, because touch events are in page coordinates, and also you could touch with four fingers.
 * We just get the first touch registered by the event and ignore the rest for this simple sim.
 */
function touchLocation(event) {
    let touchX = event.touches[0].pageX;
    let touchY = event.touches[0].pageY;
    let rect = document.getElementById("particle-canvas").getBoundingClientRect();
    touchX -= rect.left;
    touchY -= rect.top;

    return { x: touchX, y: touchY };
}



/**
 * Starts the sim up. MUST be called once after the entire page is loaded - typically this
 * should happen on body onload.
 */
function beginUpdateLoop() {
    // Create all the particles with random positions and velocities
    for(let i=0; i<100; i++) {
        particles.push({
            x: Math.random() * 450 + 5,
            y: Math.random() * 450 + 5,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 - 2
        });
    }

    // Set up all the mouse and touch events we need
    const canvas = document.getElementById("particle-canvas");

    // For the most part, the attractor stays underneath the mouse on desktop
    canvas.addEventListener("mousemove", (e) => {
        attractor = { x: e.offsetX, y: e.offsetY };
    });

    // Holding the mouse on desktop flips the attractor into repulsion.
    canvas.addEventListener("mousedown", (e) => { repulse = true; });
    canvas.addEventListener("mouseup", (e) => { repulse = false; });

    // If we're on desktop and the mouse cursor leaves the field, just snap the attractor
    // to the middle and
    canvas.addEventListener("mouseout", (e) => {
        repulse = false;
        attractor.x = field.width / 2;
        attractor.y = field.height / 2;
    });

    // Tapping on mobile moves the attractor, but does not trigger repulsion.
    canvas.addEventListener("touchstart", (e) => {
        attractor = touchLocation(e);
        e.preventDefault();
    });

    // Dragging with your finger on mobile moves the attractor smoothly.
    canvas.addEventListener("touchmove", (e) => {
        attractor = touchLocation(e);
    });

    // Okay, particles and events are set. Start the sim!
    requestAnimationFrame(updateLoop);
}

/*
 *
 */
var partialTickTime = 0;
let lastUpdate;

/**
 * Every browser paint update, hopefully at least 60 times a second, this gets called,
 * and manages the master loop for the sim.
 *
 * If "partialTickTime" seems confusing, it's a fixed timestep very similar to the
 * "Free the physics" section in the legendary "Fix Your Timestep" article -
 *   https://www.gafferongames.com/post/fix_your_timestep/
 *
 * So, render happens every time we get an animation frame, but ticks happen at, at most, 60Hz.
 *
 * This is actually a pretty fast tick loop. Normally I'd include (prev, next) or (prev, cur)
 * positions for the particles, and linearly interpolate within the frame, allowing us to drop
 * the tick loop all the way down to, say, 20Hz. But this is already overkill for the
 * assignment, so I decided against that for today.
 */
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


/**
 * Updates the field size based on the onscreen size of the canvas, and updates
 * the canvas's internal geometry to match its css-adjusted size. Note that if we
 * were to add a border to the canvas, we'd need to subtract that border size from
 * the rect here otherwise the canvas will just keep increasing its own size.
 *
 * Once the field geometry is sorted out, we paint a smiley face centered on where each
 * particle is.
 */
function render(t) {
    let canvas = document.getElementById("particle-canvas");
    field.width = canvas.getBoundingClientRect().width;
    field.height = canvas.getBoundingClientRect().height;
    canvas.width = field.width;
    canvas.height = field.height;

    let smile = document.getElementById("img-smile");
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

/**
 * Given a particle, applies a strong repulsive force from every other particle within a small
 * radius around it. This is not true collision, and the result is more like flocking. But it
 * adds a lot of analogue character to the sim, so it's worth the O(n^2) complexity.
 */
function doRepulsion(particle) {
    for(const other of particles) {
        if (other === particle) continue; // Don't repel from self

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

/**
 * Runs one physics tick. These ticks are fixed-length steps in time, so the simulation is
 * deterministic.
 */
function tick() {
    for(const particle of particles) {
        // Accelerate particle towards attractor

        let xAccel = softMinSaturate((attractor.x - particle.x) / 500, minAccel);
        if (repulse) xAccel = -xAccel;
        particle.vx += acceleration * xAccel;

        let yAccel = softMinSaturate((attractor.y - particle.y) / 500, minAccel);
        if (repulse) yAccel = -yAccel;
        particle.vy += acceleration * yAccel;

        // Repel from other particles
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
