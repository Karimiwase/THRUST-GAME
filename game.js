const GAME = {

    running: false,
    paused: false,

    width: 0,
    height: 0,

    frame: null,
    lastTime: 0,

    distance: 0,

    speed: 285,
    maxSpeed: 285,

    sector: 1,

    best: Number(
        localStorage.getItem(
            "thrustBest"
        ) || 0
    ),

    shake: 0,

    eventTimer: 0,
    eventText: "",

    selectedRocket:
        localStorage.getItem(
            "thrustRocket"
        ) || "classic",

    missionDistance: 0,

    ability: null,

    abilityTimer: 0
};


const PLAYER = {

    x: 220,
    y: 0,

    velocityY: 0,

    rotation: 0,

    radius: 18,

    thrusting: false,

    trailTimer: 0,

    invincible: 0
};


const canvas =
    document.getElementById(
        "gameCanvas"
    );

const ctx =
    canvas.getContext("2d");


function resizeGame() {

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
        GAME.width + "px";

    canvas.style.height =
        GAME.height + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    PLAYER.x =
        Math.max(
            190,
            Math.min(
                260,
                GAME.width * .20
            )
        );
}


function resetGame() {

    GAME.distance = 0;

    GAME.speed = 285;

    GAME.maxSpeed = 285;

    GAME.sector = 1;

    GAME.shake = 0;

    GAME.eventTimer = 0;

    GAME.eventText =
        "SECTOR 01";

    GAME.ability = null;

    GAME.abilityTimer = 0;

    GAME.missionDistance = 0;


    PLAYER.x =
        Math.max(
            190,
            Math.min(
                260,
                GAME.width * .20
            )
        );

    PLAYER.y =
        GAME.height * .5;

    PLAYER.velocityY = 0;

    PLAYER.rotation = 0;

    PLAYER.thrusting = false;

    PLAYER.trailTimer = 0;

    PLAYER.invincible = 0;


    resetWorld();

    resetParticles();

    updateGameHUD();
}


function startGame() {

    showScreen(
        "gameScreen"
    );

    resizeGame();

    resetGame();

    GAME.running = true;

    GAME.paused = false;

    GAME.lastTime =
        performance.now();


    if (
        typeof startMusic ===
        "function"
    ) {
        startMusic();
    }


    if (
        GAME.frame !== null
    ) {

        cancelAnimationFrame(
            GAME.frame
        );
    }


    GAME.frame =
        requestAnimationFrame(
            gameLoop
        );
}


function pauseGame() {

    if (
        !GAME.running ||
        GAME.paused
    ) {
        return;
    }

    GAME.paused = true;

    document
        .getElementById(
            "pauseOverlay"
        )
        .classList.add(
            "active"
        );
}


function resumeGame() {

    if (
        !GAME.running ||
        !GAME.paused
    ) {
        return;
    }

    GAME.paused = false;

    document
        .getElementById(
            "pauseOverlay"
        )
        .classList.remove(
            "active"
        );

    GAME.lastTime =
        performance.now();

    GAME.frame =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================================================
   SPEED
========================================================= */

function updateSpeed(dt) {

    let target;

    const d =
        GAME.distance;


    if (d < 500) {

        target = 285;

    } else if (d < 1500) {

        target = 305;

    } else if (d < 2500) {

        target = 330;

    } else if (d < 4000) {

        target = 360;

    } else if (d < 5500) {

        target = 395;

    } else if (d < 7000) {

        target = 430;

    } else if (d < 8500) {

        target = 465;

    } else if (d < 10000) {

        target = 500;

    } else {

        target = 540;
    }


    GAME.speed +=
        (
            target -
            GAME.speed
        ) *
        Math.min(
            1,
            dt * 1.2
        );


    GAME.maxSpeed =
        Math.max(
            GAME.maxSpeed,
            GAME.speed
        );


    /*
       Distance deliberately isn't
       identical to pixels travelled.

       This gives the game a real
       sense of scale.
    */

    const distanceMultiplier =
        .155 +
        Math.min(
            .025,
            GAME.distance / 400000
        );


    GAME.distance +=
        GAME.speed *
        dt *
        distanceMultiplier;


    GAME.missionDistance =
        GAME.distance;
}


/* =========================================================
   PLAYER PHYSICS
========================================================= */

function updatePlayer(dt) {

    const gravity = 680;

    const thrust = 1650;

    const maxRise = 480;

    const maxFall = 390;


    if (
        PLAYER.thrusting
    ) {

        PLAYER.velocityY -=
            thrust * dt;


        PLAYER.trailTimer -=
            dt;


        if (
            PLAYER.trailTimer <= 0
        ) {

            rocketTrail(
                PLAYER.x - 27,
                PLAYER.y + 2
            );

            PLAYER.trailTimer =
                .02;
        }


        if (
            Math.random() < .035
        ) {

            thrustSound();
        }
    }


    PLAYER.velocityY +=
        gravity * dt;


    PLAYER.velocityY =
        Math.max(
            -maxRise,
            Math.min(
                maxFall,
                PLAYER.velocityY
            )
        );


    PLAYER.y +=
        PLAYER.velocityY * dt;


    PLAYER.invincible =
        Math.max(
            0,
            PLAYER.invincible - dt
        );


    if (
        PLAYER.y -
        PLAYER.radius <= 0
    ) {

        endGame();

        return;
    }


    if (
        PLAYER.y +
        PLAYER.radius >=
        GAME.height
    ) {

        endGame();

        return;
    }


    const desired =
        Math.max(
            -.52,
            Math.min(
                .52,
                PLAYER.velocityY /
                680
            )
        );


    PLAYER.rotation +=
        (
            desired -
            PLAYER.rotation
        ) *
        10 *
        dt;
}


/* =========================================================
   COLLISION
========================================================= */

function checkCollisions() {

    if (
        PLAYER.invincible > 0
    ) {
        return;
    }


    for (
        const shard of
        WORLD.hazards
    ) {

        const dx =
            PLAYER.x -
            shard.x;

        const dy =
            PLAYER.y -
            shard.y;

        const dist =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const hit =
            PLAYER.radius +
            shard.size *
            .57;


        if (
            dist < hit
        ) {

            endGame();

            return;
        }
    }
}


/* =========================================================
   ABILITIES
========================================================= */

function activateAbility() {

    if (
        GAME.ability !== null
    ) {
        return;
    }


    const abilities = [
        "phase",
        "magnet",
        "surge"
    ];


    GAME.ability =
        abilities[
        Math.floor(
            Math.random() *
            abilities.length
        )
        ];


    GAME.abilityTimer =
        5;


    if (
        GAME.ability ===
        "phase"
    ) {

        PLAYER.invincible = 5;

    }


    if (
        GAME.ability ===
        "surge"
    ) {

        GAME.speed += 60;

    }


    GAME.eventText =
        GAME.ability
            .toUpperCase();

    GAME.eventTimer = 1.2;
}


function updateAbility(dt) {

    if (
        GAME.ability === null
    ) {
        return;
    }


    GAME.abilityTimer -= dt;


    if (
        GAME.abilityTimer <= 0
    ) {

        GAME.ability = null;
    }
}


/* =========================================================
   END GAME
========================================================= */

function endGame() {

    if (
        !GAME.running
    ) {
        return;
    }


    GAME.running = false;


    PLAYER.thrusting =
        false;


    deathSound();

    deathBurst(
        PLAYER.x,
        PLAYER.y
    );


    const distance =
        Math.floor(
            GAME.distance
        );


    const newRecord =
        distance >
        GAME.best;


    if (
        newRecord
    ) {

        GAME.best =
            distance;

        localStorage.setItem(
            "thrustBest",
            String(
                distance
            )
        );
    }


    saveRunAchievements();

    saveMissionProgress();


    GAME.shake = 15;


    setTimeout(
        () => {

            showGameOver(
                distance,
                newRecord
            );

        },
        400
    );
}


/* =========================================================
   GRADES
========================================================= */

function getGrade(distance) {

    if (
        distance >= 10000
    ) return "S";

    if (
        distance >= 7500
    ) return "A";

    if (
        distance >= 5000
    ) return "B";

    if (
        distance >= 3000
    ) return "C";

    if (
        distance >= 1500
    ) return "D";

    return "L";
}


/* =========================================================
   ACHIEVEMENTS
========================================================= */

function getUnlocked() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "thrustAchievements"
            ) || "[]"
        );

    } catch {

        return [];
    }
}


function saveRunAchievements() {

    if (
        typeof GAME_DATA ===
        "undefined"
    ) {
        return;
    }


    const unlocked =
        getUnlocked();


    for (
        const achievement of
        GAME_DATA.achievements
    ) {

        if (
            GAME.distance >=
            achievement.score &&
            !unlocked.includes(
                achievement.id
            )
        ) {

            unlocked.push(
                achievement.id
            );

            achievementSound();
        }
    }


    localStorage.setItem(
        "thrustAchievements",
        JSON.stringify(
            unlocked
        )
    );
}


function saveMissionProgress() {

    const current =
        Number(
            localStorage.getItem(
                "thrustMissionBest"
            ) || 0
        );


    if (
        GAME.distance >
        current
    ) {

        localStorage.setItem(
            "thrustMissionBest",
            String(
                Math.floor(
                    GAME.distance
                )
            )
        );
    }
}


/* =========================================================
   HUD
========================================================= */

function updateGameHUD() {

    document.getElementById(
        "distance"
    ).textContent =
        Math.floor(
            GAME.distance
        ) + "m";


    document.getElementById(
        "speed"
    ).textContent =
        Math.round(
            GAME.speed
        );


    document.getElementById(
        "best"
    ).textContent =
        GAME.best + "m";


    document.getElementById(
        "sector"
    ).textContent =
        String(
            GAME.sector
        ).padStart(
            2,
            "0"
        );


    const progress =
        GAME.distance % 1000;


    document.getElementById(
        "progressBar"
    ).style.width =
        (
            progress /
            1000 *
            100
        ) + "%";


    const label =
        document.getElementById(
            "eventLabel"
        );


    label.textContent =
        GAME.eventTimer > 0
            ? GAME.eventText
            : `SECTOR ${String(
                GAME.sector
            ).padStart(
                2,
                "0"
            )}`;


    const ability =
        document.getElementById(
            "abilityHud"
        );


    if (
        GAME.ability
    ) {

        ability.textContent =
            `${GAME.ability.toUpperCase()} ${GAME.abilityTimer.toFixed(1)
            }`;

    } else {

        ability.textContent =
            "";
    }
}


/* =========================================================
   ROCKET
========================================================= */

function drawPlayer() {

    ctx.save();


    ctx.translate(
        PLAYER.x,
        PLAYER.y
    );


    ctx.rotate(
        PLAYER.rotation
    );


    if (
        PLAYER.invincible > 0
    ) {

        ctx.globalAlpha =
            .65 +
            Math.sin(
                performance.now() / 60
            ) * .3;
    }


    /*
       Engine
    */

    const flame =
        PLAYER.thrusting
            ? 35 +
            Math.random() * 17
            : 9;


    ctx.shadowColor =
        "#35cfff";

    ctx.shadowBlur =
        PLAYER.thrusting
            ? 25
            : 8;


    ctx.fillStyle =
        "#45cfff";


    ctx.beginPath();

    ctx.moveTo(
        -19,
        -7
    );

    ctx.lineTo(
        -19 - flame,
        0
    );

    ctx.lineTo(
        -19,
        7
    );

    ctx.closePath();

    ctx.fill();


    ctx.shadowBlur = 0;


    /*
       Lower fin
    */

    ctx.fillStyle =
        "#0a1727";

    ctx.beginPath();

    ctx.moveTo(
        -5,
        8
    );

    ctx.lineTo(
        -17,
        17
    );

    ctx.lineTo(
        4,
        11
    );

    ctx.closePath();

    ctx.fill();


    /*
       Main body
    */

    ctx.fillStyle =
        "#e4edf2";

    ctx.beginPath();

    ctx.moveTo(
        32,
        0
    );

    ctx.quadraticCurveTo(
        14,
        -14,
        -18,
        -12
    );

    ctx.lineTo(
        -21,
        12
    );

    ctx.quadraticCurveTo(
        14,
        14,
        32,
        0
    );

    ctx.closePath();

    ctx.fill();


    /*
       Bottom body
    */

    ctx.fillStyle =
        "#647789";

    ctx.beginPath();

    ctx.moveTo(
        -20,
        3
    );

    ctx.quadraticCurveTo(
        5,
        17,
        27,
        0
    );

    ctx.quadraticCurveTo(
        5,
        9,
        -20,
        3
    );

    ctx.closePath();

    ctx.fill();


    /*
       Cockpit
    */

    ctx.fillStyle =
        "#103d60";

    ctx.shadowColor =
        "#55d9ff";

    ctx.shadowBlur = 10;


    ctx.beginPath();

    ctx.ellipse(
        10,
        -5,
        10,
        5.5,
        -.15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#bdf4ff";

    ctx.beginPath();

    ctx.ellipse(
        13,
        -6,
        3,
        1.5,
        -.15,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
}


/* =========================================================
   RENDER
========================================================= */

function renderGame() {

    ctx.save();


    if (
        GAME.shake > .1
    ) {

        ctx.translate(
            (
                Math.random() -
                .5
            ) * GAME.shake,

            (
                Math.random() -
                .5
            ) * GAME.shake
        );

        GAME.shake *= .88;
    }


    drawWorld(ctx);

    drawParticles(ctx);

    drawHazards(ctx);

    drawPlayer();

    ctx.restore();
}


/* =========================================================
   LOOP
========================================================= */

function gameLoop(time) {

    if (
        !GAME.running
    ) {

        renderGame();

        return;
    }


    if (
        GAME.paused
    ) {

        renderGame();

        return;
    }


    let dt =
        (
            time -
            GAME.lastTime
        ) / 1000;


    GAME.lastTime =
        time;


    dt =
        Math.min(
            dt,
            .033
        );


    updateSpeed(dt);

    updatePlayer(dt);

    updateWorld(dt);

    updateAbility(dt);

    checkCollisions();

    updateParticles(dt);


    GAME.eventTimer -= dt;


    updateGameHUD();

    renderGame();


    GAME.frame =
        requestAnimationFrame(
            gameLoop
        );
}