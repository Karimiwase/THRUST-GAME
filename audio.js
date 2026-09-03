const AUDIO = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,

    playing: false,
    enabled: true,
    sfxEnabled: true,

    bpm: 138,
    step: 0,
    nextNote: 0,
    timer: null,

    intensity: 0,
    runId: 0,
    deathSequence: false
};


// ============================================================
// AUDIO INITIALIZATION
// ============================================================

function initAudio() {
    if (AUDIO.ctx) return;

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    AUDIO.ctx = new AudioContext();

    AUDIO.master = AUDIO.ctx.createGain();
    AUDIO.musicGain = AUDIO.ctx.createGain();
    AUDIO.sfxGain = AUDIO.ctx.createGain();

    AUDIO.master.gain.value = 0.72;
    AUDIO.musicGain.gain.value = 0.0001;
    AUDIO.sfxGain.gain.value = 0.82;

    AUDIO.musicGain.connect(AUDIO.master);
    AUDIO.sfxGain.connect(AUDIO.master);
    AUDIO.master.connect(AUDIO.ctx.destination);
}


function resumeAudio() {
    initAudio();

    if (AUDIO.ctx.state === "suspended") {
        AUDIO.ctx.resume();
    }
}


// ============================================================
// OSCILLATOR
// ============================================================

function osc(
    type,
    frequency,
    duration,
    volume,
    destination,
    startTime,
    endFreq = null
) {
    if (!AUDIO.ctx) return;

    const oscillator = AUDIO.ctx.createOscillator();
    const gain = AUDIO.ctx.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );

    if (endFreq !== null) {
        oscillator.frequency.exponentialRampToValueAtTime(
            Math.max(20, endFreq),
            startTime + duration
        );
    }

    gain.gain.setValueAtTime(
        0.0001,
        startTime
    );

    gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, volume),
        startTime + 0.008
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start(startTime);

    oscillator.stop(
        startTime + duration + 0.03
    );
}


// ============================================================
// NOISE
// ============================================================

function noise(
    duration,
    volume,
    destination,
    startTime,
    filterFreq = 5000
) {
    if (!AUDIO.ctx) return;

    const bufferSize =
        Math.floor(
            AUDIO.ctx.sampleRate * duration
        );

    const buffer =
        AUDIO.ctx.createBuffer(
            1,
            bufferSize,
            AUDIO.ctx.sampleRate
        );

    const data =
        buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const source =
        AUDIO.ctx.createBufferSource();

    const filter =
        AUDIO.ctx.createBiquadFilter();

    const gain =
        AUDIO.ctx.createGain();

    source.buffer = buffer;

    filter.type = "highpass";
    filter.frequency.value = filterFreq;

    gain.gain.setValueAtTime(
        volume,
        startTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + duration
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    source.start(startTime);
}


// ============================================================
// DRUMS
// ============================================================

function kick(time, power = 1) {
    osc(
        "sine",
        125,
        0.18,
        0.52 * power,
        AUDIO.musicGain,
        time,
        38
    );
}


function heavyKick(time, power = 1) {
    osc(
        "sine",
        155,
        0.25,
        0.82 * power,
        AUDIO.musicGain,
        time,
        32
    );

    noise(
        0.04,
        0.22 * power,
        AUDIO.musicGain,
        time,
        1800
    );
}


function snare(time, power = 1) {
    noise(
        0.11,
        0.23 * power,
        AUDIO.musicGain,
        time,
        1700
    );

    osc(
        "triangle",
        190,
        0.075,
        0.075 * power,
        AUDIO.musicGain,
        time
    );
}


function hat(time, power = 1) {
    noise(
        0.032,
        0.07 * power,
        AUDIO.musicGain,
        time,
        6500
    );
}


// ============================================================
// BASS
// ============================================================

function bass(
    time,
    note,
    duration = 0.18,
    power = 1
) {
    const notes = {
        C: 65.41,
        D: 73.42,
        E: 82.41,
        F: 87.31,
        G: 98.00,
        A: 110.00,
        Bb: 116.54
    };

    const frequency = notes[note];

    if (!frequency) return;

    osc(
        "sawtooth",
        frequency,
        duration,
        0.105 * power,
        AUDIO.musicGain,
        time
    );
}


// ============================================================
// SYNTH
// ============================================================

function synthHit(
    time,
    frequency,
    power = 1
) {
    osc(
        "square",
        frequency,
        0.075,
        0.032 * power,
        AUDIO.musicGain,
        time
    );
}


function lead(
    time,
    frequency,
    duration = 0.12,
    power = 1
) {
    osc(
        "triangle",
        frequency,
        duration,
        0.038 * power,
        AUDIO.musicGain,
        time,
        frequency * 0.98
    );
}


function riser(
    time,
    duration = 1.2,
    power = 1
) {
    osc(
        "sawtooth",
        95,
        duration,
        0.052 * power,
        AUDIO.musicGain,
        time,
        1400
    );
}


// ============================================================
// MUSIC ENGINE
// ============================================================

function scheduleMusic() {
    if (!AUDIO.playing) return;
    if (AUDIO.deathSequence) return;
    if (!AUDIO.ctx) return;

    const stepDuration =
        60 / AUDIO.bpm / 4;

    while (
        AUDIO.nextNote <
        AUDIO.ctx.currentTime + 0.15
    ) {
        const time = AUDIO.nextNote;
        const step = AUDIO.step % 32;

        const distance =
            typeof GAME !== "undefined"
                ? GAME.distance
                : 0;

        const intensity =
            Math.min(1, distance / 8000);

        AUDIO.intensity = intensity;

        const power =
            0.72 + intensity * 0.48;


        // KICK
        if (
            step === 0 ||
            step === 8 ||
            step === 16 ||
            step === 24
        ) {
            heavyKick(time, power);
        }


        if (
            intensity > 0.18 &&
            (
                step === 6 ||
                step === 22
            )
        ) {
            kick(
                time,
                0.62 + intensity * 0.28
            );
        }


        // SNARE
        if (
            step === 4 ||
            step === 12 ||
            step === 20 ||
            step === 28
        ) {
            snare(time, power);
        }


        // HI-HATS
        if (step % 2 === 0) {
            hat(
                time,
                0.68 + intensity * 0.52
            );
        }


        if (
            intensity > 0.32 &&
            step % 4 === 2
        ) {
            hat(time, 0.85);
        }


        // BASS
        const bassPattern = [
            "C",
            "C",
            "G",
            "C",
            "Bb",
            "Bb",
            "F",
            "G"
        ];

        if (step % 4 === 0) {
            const note =
                bassPattern[
                (step / 4) %
                bassPattern.length
                ];

            bass(
                time,
                note,
                0.21,
                0.78 + intensity * 0.48
            );
        }


        // MELODY
        if (intensity > 0.28) {
            const melody = [
                261.63,
                329.63,
                392.00,
                329.63,
                293.66,
                349.23,
                440.00,
                392.00
            ];

            if (step % 4 === 2) {
                lead(
                    time,
                    melody[
                    Math.floor(step / 4) %
                    melody.length
                    ],
                    0.11,
                    intensity
                );
            }
        }


        // SYNTH ACCENTS
        if (
            intensity > 0.22 &&
            (
                step === 3 ||
                step === 7 ||
                step === 11 ||
                step === 15 ||
                step === 19 ||
                step === 23 ||
                step === 27 ||
                step === 31
            )
        ) {
            synthHit(
                time,
                220 + intensity * 150,
                1
            );
        }


        // ENDGAME EXTRA
        if (
            intensity > 0.7 &&
            (
                step === 14 ||
                step === 30
            )
        ) {
            synthHit(
                time,
                440,
                0.8
            );
        }


        AUDIO.step++;

        AUDIO.nextNote += stepDuration;
    }
}


// ============================================================
// START MUSIC
// ============================================================

function startMusic() {
    resumeAudio();

    if (!AUDIO.enabled) return;

    stopMusicImmediate();

    AUDIO.runId++;
    AUDIO.deathSequence = false;
    AUDIO.playing = true;

    AUDIO.step = 0;
    AUDIO.intensity = 0;
    AUDIO.bpm = 138;

    const now = AUDIO.ctx.currentTime;

    AUDIO.nextNote = now + 0.10;


    AUDIO.musicGain.gain.cancelScheduledValues(now);

    AUDIO.musicGain.gain.setValueAtTime(
        0.0001,
        now
    );


    // BUILD-UP
    AUDIO.musicGain.gain.exponentialRampToValueAtTime(
        0.16,
        now + 0.18
    );

    AUDIO.musicGain.gain.exponentialRampToValueAtTime(
        0.32,
        now + 0.42
    );

    AUDIO.musicGain.gain.exponentialRampToValueAtTime(
        0.43,
        now + 0.82
    );


    // INTRO
    kick(
        now + 0.04,
        0.85
    );

    noise(
        0.18,
        0.08,
        AUDIO.musicGain,
        now + 0.03,
        2600
    );

    riser(
        now + 0.18,
        0.55,
        0.72
    );


    AUDIO.timer = setInterval(
        scheduleMusic,
        25
    );
}


// ============================================================
// STOP MUSIC
// ============================================================

function stopMusicImmediate() {
    if (!AUDIO.ctx) return;

    AUDIO.playing = false;
    AUDIO.deathSequence = false;

    if (AUDIO.timer) {
        clearInterval(AUDIO.timer);
        AUDIO.timer = null;
    }

    const now = AUDIO.ctx.currentTime;

    AUDIO.musicGain.gain.cancelScheduledValues(now);

    AUDIO.musicGain.gain.setValueAtTime(
        0.0001,
        now
    );
}


function stopMusic() {
    if (!AUDIO.ctx) return;

    AUDIO.playing = false;
    AUDIO.deathSequence = false;

    if (AUDIO.timer) {
        clearInterval(AUDIO.timer);
        AUDIO.timer = null;
    }

    const now = AUDIO.ctx.currentTime;

    AUDIO.musicGain.gain.cancelScheduledValues(now);

    AUDIO.musicGain.gain.setTargetAtTime(
        0.0001,
        now,
        0.08
    );
}


// ============================================================
// DEATH MUSIC TRANSITION
// ============================================================

function deathMusicTransition() {
    if (!AUDIO.ctx) return;
    if (!AUDIO.playing) return;

    AUDIO.deathSequence = true;
    AUDIO.playing = false;

    if (AUDIO.timer) {
        clearInterval(AUDIO.timer);
        AUDIO.timer = null;
    }

    const now = AUDIO.ctx.currentTime;

    AUDIO.musicGain.gain.cancelScheduledValues(now);

    AUDIO.musicGain.gain.setValueAtTime(
        Math.max(
            0.0001,
            AUDIO.musicGain.gain.value
        ),
        now
    );

    AUDIO.musicGain.gain.exponentialRampToValueAtTime(
        0.075,
        now + 0.08
    );

    AUDIO.musicGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.38
    );


    // DEATH STINGER
    osc(
        "sawtooth",
        150,
        0.50,
        0.11,
        AUDIO.musicGain,
        now,
        30
    );

    osc(
        "sine",
        72,
        0.62,
        0.18,
        AUDIO.musicGain,
        now + 0.025,
        24
    );
}


// ============================================================
// THRUST SOUND
// ============================================================

function thrustSound() {
    sfx(() => {
        const t = AUDIO.ctx.currentTime;

        osc(
            "triangle",
            88 + Math.random() * 32,
            0.045,
            0.024,
            AUDIO.sfxGain,
            t,
            43
        );
    });
}


// ============================================================
// VOID SHARD COLLISION
// ============================================================

function collisionSound() {
    sfx(() => {
        const t = AUDIO.ctx.currentTime;


        // IMPACT CRACK
        noise(
            0.045,
            0.40,
            AUDIO.sfxGain,
            t,
            3200
        );


        // METAL HIT
        osc(
            "square",
            540,
            0.15,
            0.13,
            AUDIO.sfxGain,
            t,
            105
        );


        // HUGE SUB
        osc(
            "sine",
            110,
            0.55,
            0.40,
            AUDIO.sfxGain,
            t,
            26
        );


        // SECOND BOOM
        osc(
            "triangle",
            68,
            0.40,
            0.27,
            AUDIO.sfxGain,
            t + 0.025,
            29
        );


        // SHARD SNAP
        osc(
            "sawtooth",
            1050,
            0.10,
            0.09,
            AUDIO.sfxGain,
            t + 0.005,
            170
        );


        // DEBRIS
        noise(
            0.30,
            0.25,
            AUDIO.sfxGain,
            t + 0.035,
            850
        );


        // FALLING TONE
        osc(
            "sawtooth",
            380,
            0.68,
            0.10,
            AUDIO.sfxGain,
            t + 0.045,
            31
        );


        // FINAL THUD
        osc(
            "sine",
            48,
            0.50,
            0.32,
            AUDIO.sfxGain,
            t + 0.13,
            24
        );


        // ELECTRONIC DEBRIS
        for (let i = 0; i < 8; i++) {
            const delay =
                0.07 + i * 0.032;

            osc(
                "square",
                150 + Math.random() * 850,
                0.025 + Math.random() * 0.035,
                0.016,
                AUDIO.sfxGain,
                t + delay,
                55
            );
        }
    });
}


// ============================================================
// DEATH SOUND
// ============================================================

function deathSound() {
    sfx(() => {
        const t = AUDIO.ctx.currentTime;

        osc(
            "sawtooth",
            180,
            0.50,
            0.12,
            AUDIO.sfxGain,
            t,
            35
        );

        noise(
            0.45,
            0.18,
            AUDIO.sfxGain,
            t,
            300
        );
    });
}


// ============================================================
// ACHIEVEMENT SOUND
// ============================================================

function achievementSound() {
    sfx(() => {
        const t = AUDIO.ctx.currentTime;

        osc(
            "sine",
            440,
            0.12,
            0.10,
            AUDIO.sfxGain,
            t
        );

        osc(
            "sine",
            660,
            0.12,
            0.10,
            AUDIO.sfxGain,
            t + 0.12
        );

        osc(
            "sine",
            880,
            0.18,
            0.10,
            AUDIO.sfxGain,
            t + 0.24
        );
    });
}


// ============================================================
// SECTOR SOUND
// ============================================================

function sectorSound() {
    sfx(() => {
        const t = AUDIO.ctx.currentTime;

        osc(
            "sine",
            220,
            0.16,
            0.08,
            AUDIO.sfxGain,
            t,
            440
        );

        osc(
            "triangle",
            330,
            0.18,
            0.075,
            AUDIO.sfxGain,
            t + 0.12,
            660
        );

        osc(
            "sine",
            440,
            0.25,
            0.10,
            AUDIO.sfxGain,
            t + 0.24,
            880
        );

        noise(
            0.22,
            0.08,
            AUDIO.sfxGain,
            t,
            4000
        );
    });
}


// ============================================================
// SFX CONTROLLER
// ============================================================

function sfx(callback) {
    if (!AUDIO.sfxEnabled) return;

    resumeAudio();

    if (!AUDIO.ctx) return;

    callback();
}


// ============================================================
// SETTINGS
// ============================================================

function setMusicEnabled(enabled) {
    AUDIO.enabled = enabled;

    if (enabled) {
        if (
            typeof GAME !== "undefined" &&
            GAME.running
        ) {
            startMusic();
        }
    } else {
        stopMusic();
    }
}


function setSfxEnabled(enabled) {
    AUDIO.sfxEnabled = enabled;
}