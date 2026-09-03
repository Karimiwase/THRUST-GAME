const WORLD = {

    hazards: [],

    stars: [],
    dust: [],

    nextSpawn: 900,

    sector: 1,

    scroll: 0,

    lastPattern: -1,

    bgA: {
        r: 5,
        g: 9,
        b: 20
    },

    bgB: {
        r: 11,
        g: 35,
        b: 75
    },

    targetA: {
        r: 5,
        g: 9,
        b: 20
    },

    targetB: {
        r: 11,
        g: 35,
        b: 75
    },


    colors: [

        [
            [5, 9, 20],
            [11, 35, 75]
        ],

        [
            [4, 16, 29],
            [7, 76, 100]
        ],

        [
            [13, 6, 31],
            [58, 16, 100]
        ],

        [
            [27, 6, 13],
            [105, 15, 40]
        ],

        [
            [35, 20, 4],
            [110, 67, 8]
        ],

        [
            [3, 28, 25],
            [5, 105, 74]
        ],

        [
            [20, 5, 39],
            [92, 10, 120]
        ],

        [
            [4, 14, 35],
            [20, 75, 155]
        ],

        [
            [30, 4, 7],
            [135, 14, 28]
        ],

        [
            [2, 2, 8],
            [55, 55, 75]
        ]
    ]
};


function random(min, max) {

    return Math.random() *
        (max - min) +
        min;
}


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function lerp(
    a,
    b,
    t
) {

    return a +
        (b - a) * t;
}


function resetWorld() {

    WORLD.hazards = [];

    WORLD.stars = [];

    WORLD.dust = [];

    WORLD.nextSpawn = 1200;

    WORLD.scroll = 0;

    WORLD.sector = 1;

    WORLD.lastPattern = -1;


    for (
        let i = 0;
        i < 180;
        i++
    ) {

        WORLD.stars.push({

            x: Math.random(),

            y: Math.random(),

            size:
                random(
                    .4,
                    2.4
                ),

            speed:
                random(
                    .01,
                    .065
                ),

            alpha:
                random(
                    .15,
                    .8
                )
        });
    }


    for (
        let i = 0;
        i < 60;
        i++
    ) {

        WORLD.dust.push({

            x: Math.random(),

            y: Math.random(),

            size:
                random(
                    1,
                    3
                ),

            speed:
                random(
                    .04,
                    .2
                ),

            alpha:
                random(
                    .04,
                    .25
                )
        });
    }


    setSector(1);
}


function setSector(sector) {

    const index =
        clamp(
            sector - 1,
            0,
            9
        );


    const color =
        WORLD.colors[index];


    WORLD.targetA = {

        r: color[0][0],
        g: color[0][1],
        b: color[0][2]

    };


    WORLD.targetB = {

        r: color[1][0],
        g: color[1][1],
        b: color[1][2]

    };
}


/* =========================================================
   DIFFICULTY DIRECTOR
========================================================= */

function difficulty() {

    const d =
        GAME.distance;


    if (
        d < 600
    ) {

        return {
            min: 950,
            max: 1200,
            patterns: 2
        };
    }


    if (
        d < 1500
    ) {

        return {
            min: 850,
            max: 1050,
            patterns: 3
        };
    }


    if (
        d < 3000
    ) {

        return {
            min: 760,
            max: 950,
            patterns: 4
        };
    }


    if (
        d < 5000
    ) {

        return {
            min: 680,
            max: 860,
            patterns: 5
        };
    }


    if (
        d < 7000
    ) {

        return {
            min: 620,
            max: 790,
            patterns: 6
        };
    }


    return {

        min: 570,

        max: 730,

        patterns: 7
    };
}


/* =========================================================
   SHARDS
========================================================= */

function shard(
    x,
    y,
    size = 38,
    rotation = 0
) {

    WORLD.hazards.push({

        x,

        y,

        size,

        rotation,

        spin:
            random(
                -.8,
                .8
            ),

        pulse:
            random(
                0,
                Math.PI * 2
            )
    });
}


function safeY() {

    return random(
        GAME.height * .18,
        GAME.height * .82
    );
}


/* =========================================================
   PATTERN 1
========================================================= */

function patternSingle() {

    shard(
        GAME.width + 160,
        safeY(),
        random(34, 45),
        random(-.6, .6)
    );
}


/* =========================================================
   PATTERN 2
========================================================= */

function patternGate() {

    const center =
        safeY();


    const gap =
        GAME.height * .35;


    shard(
        GAME.width + 160,
        clamp(
            center - gap / 2,
            GAME.height * .12,
            GAME.height * .88
        ),
        38
    );


    shard(
        GAME.width + 160,
        clamp(
            center + gap / 2,
            GAME.height * .12,
            GAME.height * .88
        ),
        38
    );
}


/* =========================================================
   PATTERN 3
========================================================= */

function patternFlow() {

    const base =
        safeY();


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        shard(

            GAME.width +
            170 +
            i * 220,

            clamp(
                base +
                Math.sin(
                    i * 1.2
                ) * 140,

                GAME.height * .13,

                GAME.height * .87
            ),

            random(
                32,
                43
            ),

            random(
                -.7,
                .7
            )
        );
    }
}


/* =========================================================
   PATTERN WAVE
========================================================= */

function patternWave() {

    const base =
        safeY();


    const values = [
        -140,
        0,
        150,
        35
    ];


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        shard(

            GAME.width +
            160 +
            i * 210,

            clamp(
                base +
                values[i],
                GAME.height * .13,
                GAME.height * .87
            ),

            random(
                30,
                42
            )
        );
    }
}


/* =========================================================
   PATTERN ZIG
========================================================= */

function patternZig() {

    const base =
        safeY();


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        shard(

            GAME.width +
            160 +
            i * 190,

            clamp(
                base +
                (
                    i % 2 === 0
                        ? -135
                        : 135
                ),

                GAME.height * .13,

                GAME.height * .87
            ),

            random(
                29,
                40
            )
        );
    }
}


/* =========================================================
   PATTERN FLOW 2
========================================================= */

function patternReverse() {

    const base =
        safeY();


    const values = [
        130,
        -100,
        120,
        -40
    ];


    for (
        let i = 0;
        i < values.length;
        i++
    ) {

        shard(

            GAME.width +
            170 +
            i * 195,

            clamp(
                base +
                values[i],
                GAME.height * .13,
                GAME.height * .87
            ),

            random(
                30,
                43
            )
        );
    }
}


/* =========================================================
   PATTERN PRESSURE
========================================================= */

function patternPressure() {

    const center =
        safeY();


    const gap =
        Math.max(
            GAME.height * .27,
            220 -
            GAME.distance *
            .003
        );


    shard(
        GAME.width + 160,
        clamp(
            center - gap,
            GAME.height * .1,
            GAME.height * .9
        ),
        42
    );


    shard(
        GAME.width + 160,
        clamp(
            center + gap,
            GAME.height * .1,
            GAME.height * .9
        ),
        42
    );
}


/* =========================================================
   PATTERN SELECTOR
========================================================= */

function spawnPattern() {

    const d =
        difficulty();


    let pattern;


    do {

        pattern =
            Math.floor(
                Math.random() *
                d.patterns
            );

    } while (
        pattern ===
        WORLD.lastPattern
    );


    WORLD.lastPattern =
        pattern;


    switch (pattern) {

        case 0:
            patternSingle();
            break;

        case 1:
            patternGate();
            break;

        case 2:
            patternFlow();
            break;

        case 3:
            patternWave();
            break;

        case 4:
            patternZig();
            break;

        case 5:
            patternReverse();
            break;

        case 6:
            patternPressure();
            break;
    }
}


/* =========================================================
   UPDATE
========================================================= */

function updateWorld(dt) {

    WORLD.scroll +=
        GAME.speed * dt;


    const smooth =
        Math.min(
            1,
            dt * .8
        );


    WORLD.bgA.r =
        lerp(
            WORLD.bgA.r,
            WORLD.targetA.r,
            smooth
        );

    WORLD.bgA.g =
        lerp(
            WORLD.bgA.g,
            WORLD.targetA.g,
            smooth
        );

    WORLD.bgA.b =
        lerp(
            WORLD.bgA.b,
            WORLD.targetA.b,
            smooth
        );


    WORLD.bgB.r =
        lerp(
            WORLD.bgB.r,
            WORLD.targetB.r,
            smooth
        );

    WORLD.bgB.g =
        lerp(
            WORLD.bgB.g,
            WORLD.targetB.g,
            smooth
        );

    WORLD.bgB.b =
        lerp(
            WORLD.bgB.b,
            WORLD.targetB.b,
            smooth
        );


    WORLD.nextSpawn -=
        dt * 1000;


    if (
        WORLD.nextSpawn <= 0
    ) {

        spawnPattern();


        const d =
            difficulty();


        WORLD.nextSpawn =
            random(
                d.min,
                d.max
            );
    }


    for (
        const h of
        WORLD.hazards
    ) {

        h.x -=
            GAME.speed * dt;

        h.rotation +=
            h.spin * dt;

        h.pulse +=
            dt * 2.5;
    }


    for (
        const star of
        WORLD.stars
    ) {

        star.x -=
            (
                GAME.speed *
                star.speed *
                dt
            ) /
            GAME.width;


        if (
            star.x < -.05
        ) {

            star.x = 1.05;

            star.y =
                Math.random();
        }
    }


    WORLD.hazards =
        WORLD.hazards.filter(
            h =>
                h.x >
                -150
        );


    const newSector =
        Math.min(
            10,
            Math.floor(
                GAME.distance /
                1000
            ) + 1
        );


    if (
        newSector !==
        WORLD.sector
    ) {

        WORLD.sector =
            newSector;

        GAME.sector =
            newSector;


        setSector(
            newSector
        );


        GAME.eventText =
            `SECTOR ${String(
                newSector
            ).padStart(
                2,
                "0"
            )}`;


        GAME.eventTimer =
            2;


        GAME.shake =
            7;


        sectorSound();
    }
}


/* =========================================================
   DRAW
========================================================= */

function drawWorld(ctx) {

    const w =
        GAME.width;

    const h =
        GAME.height;


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            w,
            h
        );


    gradient.addColorStop(
        0,
        `rgb(
            ${WORLD.bgA.r},
            ${WORLD.bgA.g},
            ${WORLD.bgA.b}
        )`
    );


    gradient.addColorStop(
        1,
        `rgb(
            ${WORLD.bgB.r},
            ${WORLD.bgB.g},
            ${WORLD.bgB.b}
        )`
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    /*
       Massive atmospheric glow
    */

    const glow =
        ctx.createRadialGradient(
            w * .58,
            h * .5,
            0,
            w * .58,
            h * .5,
            h * .85
        );


    glow.addColorStop(
        0,
        "rgba(70,190,255,.09)"
    );

    glow.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
        glow;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    /*
       Stars
    */

    for (
        const star of
        WORLD.stars
    ) {

        ctx.globalAlpha =
            star.alpha;

        ctx.fillStyle =
            "#e4f4ff";

        ctx.beginPath();

        ctx.arc(
            star.x * w,
            star.y * h,
            star.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    /*
       Dust
    */

    for (
        const d of
        WORLD.dust
    ) {

        ctx.globalAlpha =
            d.alpha;

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            d.x * w,
            d.y * h,
            d.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    ctx.globalAlpha = 1;


    /*
       High-speed lines
    */

    const intensity =
        Math.min(
            1,
            GAME.speed / 550
        );


    ctx.globalAlpha =
        .025 +
        intensity * .07;


    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const y =
            (
                i * 97 +
                WORLD.scroll * .25
            ) % h;


        const x =
            (
                i * 211 +
                WORLD.scroll
            ) % w;


        ctx.strokeStyle =
            "#ccefff";

        ctx.lineWidth = 1;


        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x -
            60 -
            intensity * 120,
            y
        );

        ctx.stroke();
    }


    ctx.globalAlpha = 1;


    /*
       Subtle grid
    */

    ctx.globalAlpha =
        .025;


    const grid =
        110;


    for (
        let x =
            -(WORLD.scroll % grid);

        x < w;

        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            h
        );

        ctx.strokeStyle =
            "#ffffff";

        ctx.stroke();
    }


    ctx.globalAlpha = 1;


    /*
       Vignette
    */

    const vignette =
        ctx.createRadialGradient(
            w / 2,
            h / 2,
            h * .15,
            w / 2,
            h / 2,
            h * .8
        );


    vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
        1,
        "rgba(0,0,0,.6)"
    );


    ctx.fillStyle =
        vignette;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );
}


/* =========================================================
   SHARD DRAW
========================================================= */

function drawShard(
    ctx,
    h
) {

    const s =
        h.size;


    ctx.save();


    ctx.translate(
        h.x,
        h.y
    );


    ctx.rotate(
        h.rotation
    );


    const pulse =
        1 +
        Math.sin(
            h.pulse
        ) * .04;


    ctx.scale(
        pulse,
        pulse
    );


    ctx.shadowColor =
        "#32c4ff";

    ctx.shadowBlur =
        26;


    ctx.fillStyle =
        "#07537f";


    ctx.beginPath();

    ctx.moveTo(
        s,
        0
    );

    ctx.lineTo(
        s * .2,
        s * .58
    );

    ctx.lineTo(
        -s * .8,
        s * .38
    );

    ctx.lineTo(
        -s,
        0
    );

    ctx.lineTo(
        -s * .65,
        -s * .42
    );

    ctx.lineTo(
        s * .2,
        -s * .58
    );

    ctx.closePath();

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.fillStyle =
        "#168bc9";


    ctx.beginPath();

    ctx.moveTo(
        s * .72,
        0
    );

    ctx.lineTo(
        0,
        s * .36
    );

    ctx.lineTo(
        -s * .58,
        s * .23
    );

    ctx.lineTo(
        -s * .7,
        0
    );

    ctx.lineTo(
        -s * .5,
        -s * .23
    );

    ctx.lineTo(
        0,
        -s * .36
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "rgba(190,245,255,.85)";


    ctx.beginPath();

    ctx.moveTo(
        s * .45,
        0
    );

    ctx.lineTo(
        0,
        s * .12
    );

    ctx.lineTo(
        -s * .3,
        0
    );

    ctx.lineTo(
        0,
        -s * .12
    );

    ctx.closePath();

    ctx.fill();


    ctx.strokeStyle =
        "#8ee8ff";

    ctx.lineWidth = 1.4;

    ctx.stroke();


    ctx.restore();
}


function drawHazards(ctx) {

    for (
        const h of
        WORLD.hazards
    ) {

        drawShard(
            ctx,
            h
        );
    }
}