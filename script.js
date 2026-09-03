/* ============================================================
   THRUST
   MAIN GAME ENGINE
   ============================================================ */


/* ============================================================
   GAME STATE
   ============================================================ */

const GAME = {

    running: false,

    paused: false,

    width: 0,

    height: 0,

    lastTime: 0,

    distance: 0,

    speed: 285,

    maxSpeed: 285,

    sector: 1,

    shake: 0,

    eventTimer: 0,

    eventText: "SECTOR 01",

    deathHandled: false,

    settings: {

        music: true,

        sfx: true

    }

};



/* ============================================================
   PLAYER
   ============================================================ */

const PLAYER = {

    x: 190,

    y: 0,

    velocityY: 0,

    rotation: 0,

    thrusting: false,

    radius: 16,

    trailTimer: 0

};



/* ============================================================
   DOM
   ============================================================ */

const canvas =
    document.getElementById(
        "gameCanvas"
    );

const ctx =
    canvas.getContext("2d");



/* ============================================================
   SCREEN CONTROL
   ============================================================ */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(id);


    if (target) {

        target.classList.add(
            "active"
        );

    }

}



/* ============================================================
   CANVAS RESIZE
   ============================================================ */

function resizeCanvas() {

    GAME.width =
        window.innerWidth;

    GAME.height =
        window.innerHeight;


    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        GAME.width * dpr;

    canvas.height =
        GAME.height * dpr;


    canvas.style.width =
        `${GAME.width}px`;

    canvas.style.height =
        `${GAME.height}px`;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    if (GAME.running) {

        PLAYER.y =
            Math.min(
                PLAYER.y,
                GAME.height - PLAYER.radius - 2
            );

    }

}



window.addEventListener(
    "resize",
    resizeCanvas
);



/* ============================================================
   RESET GAME
   ============================================================ */

function resetGame() {

    GAME.distance = 0;

    GAME.speed = 285;

    GAME.maxSpeed = 285;

    GAME.sector = 1;

    GAME.shake = 0;

    GAME.eventTimer = 0;

    GAME.eventText =
        "SECTOR 01";

    GAME.deathHandled =
        false;


    PLAYER.x = 190;

    PLAYER.y =
        GAME.height * 0.5;

    PLAYER.velocityY = 0;

    PLAYER.rotation = 0;

    PLAYER.thrusting = false;

    PLAYER.trailTimer = 0;


    if (
        typeof resetWorld ===
        "function"
    ) {

        resetWorld();

    }


    if (
        typeof PARTICLES !==
        "undefined" &&
        PARTICLES.particles
    ) {

        PARTICLES.particles.length = 0;

    }


    updateHUD();

}



/* ============================================================
   START GAME
   ============================================================ */

function startGame() {

    /*
        IMPORTANT:

        Show game screen BEFORE resizing.
        Otherwise hidden canvas can have 0x0 dimensions.
    */

    showScreen(
        "gameScreen"
    );


    resizeCanvas();

    resetGame();


    GAME.running = true;

    GAME.paused = false;


    hidePause();


    if (
        typeof startMusic ===
        "function" &&
        GAME.settings.music
    ) {

        startMusic();

    }


    GAME.lastTime =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );

}



/* ============================================================
   MAIN LOOP
   ============================================================ */

function gameLoop(timestamp) {

    if (!GAME.running) {

        draw();

        return;

    }


    const dt =
        Math.min(
            (timestamp - GAME.lastTime) /
            1000,
            0.033
        );


    GAME.lastTime =
        timestamp;


    if (!GAME.paused) {

        update(dt);

        draw();

    }


    requestAnimationFrame(
        gameLoop
    );

}



/* ============================================================
   UPDATE
   ============================================================ */

function update(dt) {

    updateSpeed(dt);

    updatePlayer(dt);


    if (!GAME.running) {

        return;

    }


    if (
        typeof updateWorld ===
        "function"
    ) {

        updateWorld(dt);

    }


    if (
        typeof PARTICLES !==
        "undefined" &&
        typeof PARTICLES.update ===
        "function"
    ) {

        PARTICLES.update(dt);

    }


    GAME.distance +=
        GAME.speed *
        dt *
        0.135;


    GAME.sector =
        Math.floor(
            GAME.distance / 1000
        ) + 1;


    GAME.eventText =
        `SECTOR ${String(
            GAME.sector
        ).padStart(2, "0")}`;


    GAME.eventTimer =
        Math.max(
            0,
            GAME.eventTimer - dt
        );


    if (GAME.shake > 0) {

        GAME.shake -=
            dt * 25;

        GAME.shake =
            Math.max(
                0,
                GAME.shake
            );

    }


    checkAchievementsByDistance();

    checkCollisions();

    updateHUD();

}



/* ============================================================
   SPEED
   ============================================================ */

function updateSpeed(dt) {

    const distance =
        GAME.distance;


    let targetSpeed;


    if (distance < 1000) {

        targetSpeed =
            285 +
            distance * 0.025;

    } else if (distance < 3000) {

        targetSpeed =
            310 +
            (distance - 1000) * 0.020;

    } else if (distance < 5000) {

        targetSpeed =
            350 +
            (distance - 3000) * 0.022;

    } else if (distance < 7000) {

        targetSpeed =
            394 +
            (distance - 5000) * 0.024;

    } else if (distance < 10000) {

        targetSpeed =
            442 +
            (distance - 7000) * 0.026;

    } else {

        targetSpeed =
            520 +
            Math.min(
                100,
                (distance - 10000) *
                0.012
            );

    }


    GAME.speed +=
        (
            targetSpeed -
            GAME.speed
        ) *
        Math.min(
            1,
            dt * 1.8
        );


    GAME.maxSpeed =
        Math.max(
            GAME.maxSpeed,
            GAME.speed
        );

}



/* ============================================================
   PLAYER PHYSICS
   ============================================================ */

function updatePlayer(dt) {

    const gravity =
        720;

    const thrustPower =
        1850;

    const maxUpSpeed =
        520;

    const maxDownSpeed =
        430;


    if (PLAYER.thrusting) {

        PLAYER.velocityY -=
            thrustPower * dt;

        PLAYER.velocityY -=
            35 * dt;


        PLAYER.trailTimer -=
            dt;


        if (
            PLAYER.trailTimer <= 0
        ) {

            if (
                typeof rocketTrail ===
                "function"
            ) {

                rocketTrail(
                    PLAYER.x - 24,
                    PLAYER.y + 2
                );

            }


            PLAYER.trailTimer =
                0.018;

        }


        if (
            Math.random() < 0.06
        ) {

            if (
                typeof thrustSound ===
                "function"
            ) {

                thrustSound();

            }

        }

    }


    PLAYER.velocityY +=
        gravity * dt;


    PLAYER.velocityY =
        Math.max(
            -maxUpSpeed,
            Math.min(
                maxDownSpeed,
                PLAYER.velocityY
            )
        );


    PLAYER.y +=
        PLAYER.velocityY * dt;


    /*
        TOP / BOTTOM ARE DEADLY.
    */

    if (
        PLAYER.y -
        PLAYER.radius <= 0
    ) {

        PLAYER.y =
            PLAYER.radius;

        endGame();

        return;

    }


    if (
        PLAYER.y +
        PLAYER.radius >=
        GAME.height
    ) {

        PLAYER.y =
            GAME.height -
            PLAYER.radius;

        endGame();

        return;

    }


    const targetRotation =
        Math.max(
            -0.48,
            Math.min(
                0.48,
                PLAYER.velocityY / 650
            )
        );


    PLAYER.rotation +=
        (
            targetRotation -
            PLAYER.rotation
        ) *
        13 *
        dt;

}



/* ============================================================
   COLLISION
   ============================================================ */

function checkCollisions() {

    if (!GAME.running) return;


    for (
        const hazard
        of WORLD.hazards
    ) {

        const dx =
            PLAYER.x -
            hazard.x;

        const dy =
            PLAYER.y -
            hazard.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const hitDistance =
            PLAYER.radius +
            hazard.size *
            0.68;


        if (
            distance <
            hitDistance
        ) {

            /*
                ONE clean collision event.
            */

            if (
                typeof collisionSound ===
                "function"
            ) {

                collisionSound();

            }


            if (
                typeof deathMusicTransition ===
                "function"
            ) {

                deathMusicTransition();

            }


            if (
                typeof deathBurst ===
                "function"
            ) {

                deathBurst(
                    PLAYER.x,
                    PLAYER.y
                );

            }


            GAME.shake =
                20;


            endGame();

            return;

        }

    }

}



/* ============================================================
   END GAME
   ============================================================ */

async function endGame() {

    if (
        GAME.deathHandled
    ) {

        return;

    }


    GAME.deathHandled =
        true;

    GAME.running = false;

    GAME.paused = false;


    if (
        typeof deathSound ===
        "function"
    ) {

        deathSound();

    }


    /*
        Stop accepting input.
    */

    PLAYER.thrusting =
        false;


    /*
        Save this flight online.
    */

    const finalDistance =
        Math.floor(
            GAME.distance
        );


    const finalSector =
        Math.floor(
            GAME.distance / 1000
        ) + 1;


    document.getElementById(
        "finalDistance"
    ).textContent =
        `${finalDistance.toLocaleString()}m`;


    document.getElementById(
        "finalSector"
    ).textContent =
        String(
            finalSector
        ).padStart(2, "0");


    document.getElementById(
        "finalSpeed"
    ).textContent =
        Math.round(
            GAME.maxSpeed
        );


    const recordElement =
        document.getElementById(
            "worldRecord"
        );


    const statusElement =
        document.getElementById(
            "leaderboardStatus"
        );


    recordElement.classList.add(
        "hidden"
    );


    statusElement.textContent =
        "SAVING FLIGHT...";


    showScreen(
        "gameOverScreen"
    );


    /*
        Send run to global database.
    */

    if (
        typeof submitRun ===
        "function"
    ) {

        const result =
            await submitRun(
                finalDistance
            );


        if (
            result &&
            result.success
        ) {

            statusElement.textContent =
                "FLIGHT SAVED TO WORLD LEADERBOARD";


            if (
                result.worldRecord
            ) {

                recordElement.classList.remove(
                    "hidden"
                );

            }

        } else {

            statusElement.textContent =
                "COULD NOT SAVE FLIGHT";

        }

    } else {

        statusElement.textContent =
            "LEADERBOARD OFFLINE";

    }

}



/* ============================================================
   HUD
   ============================================================ */

function updateHUD() {

    const distance =
        document.getElementById(
            "distance"
        );


    const speed =
        document.getElementById(
            "speed"
        );


    const sector =
        document.getElementById(
            "sector"
        );


    const event =
        document.getElementById(
            "eventLabel"
        );


    const progress =
        document.getElementById(
            "progressBar"
        );


    if (distance) {

        distance.textContent =
            `${Math.floor(
                GAME.distance
            ).toLocaleString()}m`;

    }


    if (speed) {

        speed.textContent =
            Math.round(
                GAME.speed
            );

    }


    if (sector) {

        sector.textContent =
            String(
                GAME.sector
            ).padStart(
                2,
                "0"
            );

    }


    if (event) {

        event.textContent =
            GAME.eventText;

    }


    if (progress) {

        const progressInSector =
            GAME.distance % 1000;


        const percent =
            (
                progressInSector /
                1000
            ) * 100;


        progress.style.width =
            `${percent}%`;

    }

}



/* ============================================================
   ACHIEVEMENT COMPATIBILITY
   ============================================================

   The old achievements UI is gone.

   We keep this empty compatibility function so older
   game code cannot break if it calls it.
*/

function checkAchievementsByDistance() {

    return;

}



/* ============================================================
   DRAW
   ============================================================ */

function draw() {

    if (!ctx) return;


    ctx.clearRect(
        0,
        0,
        GAME.width,
        GAME.height
    );


    ctx.save();


    if (
        GAME.shake > 0
    ) {

        ctx.translate(
            (
                Math.random() -
                0.5
            ) * GAME.shake,

            (
                Math.random() -
                0.5
            ) * GAME.shake
        );

    }


    if (
        typeof drawWorld ===
        "function"
    ) {

        drawWorld(ctx);

    }


    if (
        typeof drawHazards ===
        "function"
    ) {

        drawHazards(ctx);

    }


    drawRocket(ctx);


    if (
        typeof PARTICLES !==
        "undefined" &&
        typeof PARTICLES.draw ===
        "function"
    ) {

        PARTICLES.draw(ctx);

    }


    ctx.restore();

}



/* ============================================================
   ROCKET
   ============================================================ */

function drawRocket(ctx) {

    ctx.save();


    ctx.translate(
        PLAYER.x,
        PLAYER.y
    );


    ctx.rotate(
        PLAYER.rotation
    );


    /*
        ENGINE FLAME
    */

    if (
        PLAYER.thrusting
    ) {

        const flame =
            15 +
            Math.random() * 12;


        ctx.shadowColor =
            "#43d9ff";

        ctx.shadowBlur =
            18;


        const gradient =
            ctx.createLinearGradient(
                -42,
                0,
                -5,
                0
            );


        gradient.addColorStop(
            0,
            "rgba(255,255,255,0.95)"
        );

        gradient.addColorStop(
            0.35,
            "rgba(60,210,255,0.9)"
        );

        gradient.addColorStop(
            1,
            "rgba(30,100,255,0)"
        );


        ctx.fillStyle =
            gradient;


        ctx.beginPath();

        ctx.moveTo(
            -12,
            -6
        );

        ctx.lineTo(
            -12 - flame,
            0
        );

        ctx.lineTo(
            -12,
            6
        );

        ctx.closePath();

        ctx.fill();

    }


    ctx.shadowBlur = 0;


    /*
        ROCKET BODY
    */

    const bodyGradient =
        ctx.createLinearGradient(
            0,
            -16,
            0,
            16
        );


    bodyGradient.addColorStop(
        0,
        "#eef7ff"
    );

    bodyGradient.addColorStop(
        0.45,
        "#a8c7df"
    );

    bodyGradient.addColorStop(
        1,
        "#536d85"
    );


    ctx.fillStyle =
        bodyGradient;


    ctx.beginPath();

    ctx.moveTo(
        27,
        0
    );

    ctx.quadraticCurveTo(
        10,
        -15,
        -18,
        -11
    );

    ctx.lineTo(
        -22,
        0
    );

    ctx.lineTo(
        -18,
        11
    );

    ctx.quadraticCurveTo(
        10,
        15,
        27,
        0
    );

    ctx.closePath();

    ctx.fill();


    /*
        COCKPIT
    */

    ctx.fillStyle =
        "#0a2238";

    ctx.shadowColor =
        "#45d9ff";

    ctx.shadowBlur =
        8;


    ctx.beginPath();

    ctx.ellipse(
        7,
        -3,
        8,
        5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    /*
        TOP FIN
    */

    ctx.fillStyle =
        "#38566f";


    ctx.beginPath();

    ctx.moveTo(
        -7,
        -8
    );

    ctx.lineTo(
        -1,
        -19
    );

    ctx.lineTo(
        8,
        -10
    );

    ctx.closePath();

    ctx.fill();


    /*
        BOTTOM FIN
    */

    ctx.beginPath();

    ctx.moveTo(
        -7,
        8
    );

    ctx.lineTo(
        -1,
        19
    );

    ctx.lineTo(
        8,
        10
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();

}



/* ============================================================
   INPUT
   ============================================================ */

function setThrust(
    active
) {

    if (!GAME.running) {

        PLAYER.thrusting =
            false;

        return;

    }


    if (GAME.paused) {

        PLAYER.thrusting =
            false;

        return;

    }


    PLAYER.thrusting =
        active;

}



window.addEventListener(
    "keydown",
    event => {

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            setThrust(true);

        }


        if (
            event.code ===
            "Escape"
        ) {

            togglePause();

        }

    }
);



window.addEventListener(
    "keyup",
    event => {

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            setThrust(false);

        }

    }
);



canvas.addEventListener(
    "mousedown",
    () => {

        setThrust(true);

    }
);



window.addEventListener(
    "mouseup",
    () => {

        setThrust(false);

    }
);



canvas.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        setThrust(true);

    },
    {
        passive: false
    }
);



window.addEventListener(
    "touchend",
    () => {

        setThrust(false);

    }
);



/* ============================================================
   PAUSE
   ============================================================ */

function togglePause() {

    if (!GAME.running) {
        return;
    }


    GAME.paused =
        !GAME.paused;


    if (GAME.paused) {

        showPause();

    } else {

        hidePause();

        GAME.lastTime =
            performance.now();

    }

}



function showPause() {

    const overlay =
        document.getElementById(
            "pauseOverlay"
        );


    overlay.classList.remove(
        "hidden"
    );

}



function hidePause() {

    const overlay =
        document.getElementById(
            "pauseOverlay"
        );


    overlay.classList.add(
        "hidden"
    );

}



/* ============================================================
   MENU BUTTONS
   ============================================================ */

document
    .getElementById("playBtn")
    .addEventListener(
        "click",
        () => {

            startGame();

        }
    );



document
    .getElementById("retryBtn")
    .addEventListener(
        "click",
        () => {

            startGame();

        }
    );



document
    .getElementById("gameOverMenuBtn")
    .addEventListener(
        "click",
        () => {

            if (
                typeof stopMusicImmediate ===
                "function"
            ) {

                stopMusicImmediate();

            }


            showScreen(
                "menuScreen"
            );

        }
    );



document
    .getElementById(
        "gameOverLeaderboardBtn"
    )
    .addEventListener(
        "click",
        () => {

            showScreen(
                "leaderboardScreen"
            );

            fetchLeaderboard();

        }
    );



document
    .getElementById(
        "leaderboardBtn"
    )
    .addEventListener(
        "click",
        () => {

            showScreen(
                "leaderboardScreen"
            );

            fetchLeaderboard();

        }
    );



document
    .getElementById(
        "settingsBtn"
    )
    .addEventListener(
        "click",
        () => {

            showScreen(
                "settingsScreen"
            );

        }
    );



/* ============================================================
   PAUSE BUTTONS
   ============================================================ */

document
    .getElementById("pauseBtn")
    .addEventListener(
        "click",
        () => {

            togglePause();

        }
    );



document
    .getElementById("resumeBtn")
    .addEventListener(
        "click",
        () => {

            if (GAME.paused) {

                togglePause();

            }

        }
    );



document
    .getElementById("pauseMenuBtn")
    .addEventListener(
        "click",
        () => {

            GAME.running =
                false;

            GAME.paused =
                false;


            hidePause();


            if (
                typeof stopMusicImmediate ===
                "function"
            ) {

                stopMusicImmediate();

            }


            showScreen(
                "menuScreen"
            );

        }
    );



/* ============================================================
   BACK BUTTONS
   ============================================================ */

document
    .querySelectorAll("[data-back]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showScreen(
                    "menuScreen"
                );

            }
        );

    });



/* ============================================================
   SETTINGS
   ============================================================ */

document
    .getElementById(
        "musicToggle"
    )
    .addEventListener(
        "click",
        event => {

            GAME.settings.music =
                !GAME.settings.music;


            event.target.textContent =
                GAME.settings.music
                    ? "ON"
                    : "OFF";


            if (
                typeof setMusicEnabled ===
                "function"
            ) {

                setMusicEnabled(
                    GAME.settings.music
                );

            }

        }
    );



document
    .getElementById(
        "sfxToggle"
    )
    .addEventListener(
        "click",
        event => {

            GAME.settings.sfx =
                !GAME.settings.sfx;


            event.target.textContent =
                GAME.settings.sfx
                    ? "ON"
                    : "OFF";


            if (
                typeof setSfxEnabled ===
                "function"
            ) {

                setSfxEnabled(
                    GAME.settings.sfx
                );

            }

        }
    );



/* ============================================================
   INITIALIZATION
   ============================================================ */

resizeCanvas();

updateHUD();

initLeaderboard();

showScreen(
    "menuScreen"
);