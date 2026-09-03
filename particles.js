const PARTICLES = {

    items: [],

    max: 900
};


function resetParticles() {

    PARTICLES.items.length = 0;
}


function particle(
    x,
    y,
    type,
    options = {}
) {

    if (
        PARTICLES.items.length >=
        PARTICLES.max
    ) {

        PARTICLES.items.shift();
    }


    const life =
        options.life ??
        .5;


    PARTICLES.items.push({

        x,

        y,

        vx:
            options.vx ??
            random(
                -30,
                30
            ),

        vy:
            options.vy ??
            random(
                -30,
                30
            ),

        life,

        maxLife: life,

        size:
            options.size ??
            2,

        type,

        gravity:
            options.gravity ??
            0,

        alpha:
            options.alpha ??
            1,

        rotation:
            Math.random() *
            Math.PI *
            2
    });
}


function rocketTrail(
    x,
    y
) {

    particle(
        x,
        y,
        "trail",
        {

            vx:
                random(
                    -100,
                    -45
                ),

            vy:
                random(
                    -25,
                    25
                ),

            life:
                .28,

            size:
                random(
                    2,
                    5
                ),

            alpha:
                .7
        }
    );
}


function deathBurst(
    x,
    y
) {

    for (
        let i = 0;
        i < 110;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const speed =
            random(
                80,
                340
            );


        particle(
            x,
            y,
            "death",
            {

                vx:
                    Math.cos(
                        angle
                    ) *
                    speed,

                vy:
                    Math.sin(
                        angle
                    ) *
                    speed,

                life:
                    random(
                        .4,
                        1
                    ),

                size:
                    random(
                        2,
                        6
                    ),

                gravity:
                    60
            }
        );
    }
}


function updateParticles(dt) {

    for (
        let i =
            PARTICLES.items.length - 1;

        i >= 0;

        i--
    ) {

        const p =
            PARTICLES.items[i];


        p.life -= dt;


        if (
            p.life <= 0
        ) {

            PARTICLES.items.splice(
                i,
                1
            );

            continue;
        }


        p.x +=
            p.vx * dt;

        p.y +=
            p.vy * dt;

        p.vy +=
            p.gravity * dt;
    }
}


function drawParticles(ctx) {

    for (
        const p of
        PARTICLES.items
    ) {

        ctx.save();


        ctx.globalAlpha =
            (
                p.life /
                p.maxLife
            ) *
            p.alpha;


        if (
            p.type ===
            "trail"
        ) {

            ctx.fillStyle =
                "#55d5ff";

            ctx.shadowColor =
                "#2dbbff";

            ctx.shadowBlur =
                12;


            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        if (
            p.type ===
            "death"
        ) {

            ctx.fillStyle =
                "#6fdcff";

            ctx.shadowColor =
                "#36c7ff";

            ctx.shadowBlur =
                15;


            ctx.translate(
                p.x,
                p.y
            );


            ctx.rotate(
                p.rotation
            );


            ctx.fillRect(
                -p.size / 2,
                -p.size / 2,
                p.size,
                p.size
            );
        }


        ctx.restore();
    }
}