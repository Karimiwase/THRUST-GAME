const SUPABASE_URL =
    "https://icdtngyyhzwtjhplzadk.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_0ReowYsqStcQRrGx3dsd0Q_89NGGq3N";

const LEADERBOARD_TABLE = "thrust_leaderboard";
const LEADERBOARD_LIMIT = 100;

const LEADERBOARD = {
    entries: [],
    connected: false,
    loading: false
};


// ============================================================
// SUPABASE REQUEST
// ============================================================

async function leaderboardRequest(endpoint, options = {}) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${endpoint}`,
        {
            ...options,

            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Prefer": "return=representation",

                ...(options.headers || {})
            }
        }
    );

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Supabase ${response.status}: ${errorText}`
        );
    }

    const text = await response.text();

    return text ? JSON.parse(text) : [];
}


// ============================================================
// GET GLOBAL LEADERBOARD
// ============================================================

async function fetchLeaderboard() {

    if (LEADERBOARD.loading) return;

    LEADERBOARD.loading = true;

    try {

        const data = await leaderboardRequest(
            `${LEADERBOARD_TABLE}?select=id,player_name,distance,created_at&order=distance.desc,created_at.asc&limit=${LEADERBOARD_LIMIT}`
        );

        LEADERBOARD.entries =
            Array.isArray(data) ? data : [];

        LEADERBOARD.connected = true;

        updateLiveIndicator();
        renderLeaderboard();

        return LEADERBOARD.entries;

    } catch (error) {

        console.error(
            "THRUST GLOBAL LEADERBOARD ERROR:",
            error
        );

        LEADERBOARD.connected = false;

        updateLiveIndicator();
        renderLeaderboardError();

        return [];

    } finally {

        LEADERBOARD.loading = false;
    }
}


// ============================================================
// SUBMIT FLIGHT
// ============================================================

async function submitRun(distance) {

    const cleanDistance =
        Math.max(
            0,
            Math.floor(Number(distance) || 0)
        );

    if (cleanDistance <= 0) {

        return {
            success: false,
            worldRecord: false,
            newBest: false
        };
    }


    try {

        const playerName = getPlayerName();

        if (!playerName) {

            return {
                success: false,
                worldRecord: false,
                newBest: false
            };
        }


        // ----------------------------------------------------
        // Check player's existing best
        // ----------------------------------------------------

        const existing = await leaderboardRequest(
            `${LEADERBOARD_TABLE}?select=id,player_name,distance&player_name=eq.${encodeURIComponent(playerName)}&limit=1`
        );


        // ----------------------------------------------------
        // Check current WORLD record
        // ----------------------------------------------------

        const worldBestData = await leaderboardRequest(
            `${LEADERBOARD_TABLE}?select=distance&order=distance.desc&limit=1`
        );

        const previousWorldRecord =
            worldBestData.length > 0
                ? Number(worldBestData[0].distance)
                : 0;


        // ----------------------------------------------------
        // PLAYER DOES NOT EXIST
        // ----------------------------------------------------

        if (existing.length === 0) {

            await leaderboardRequest(
                LEADERBOARD_TABLE,
                {
                    method: "POST",

                    body: JSON.stringify({
                        player_name: playerName,
                        distance: cleanDistance
                    })
                }
            );

            await fetchLeaderboard();

            return {
                success: true,
                worldRecord:
                    cleanDistance > previousWorldRecord,
                newBest: true
            };
        }


        // ----------------------------------------------------
        // PLAYER ALREADY EXISTS
        // ----------------------------------------------------

        const player = existing[0];

        const previousBest =
            Number(player.distance);


        // ----------------------------------------------------
        // New run is NOT better
        // ----------------------------------------------------

        if (cleanDistance <= previousBest) {

            await fetchLeaderboard();

            return {
                success: true,
                worldRecord: false,
                newBest: false
            };
        }


        // ----------------------------------------------------
        // New personal best
        // ----------------------------------------------------

        await leaderboardRequest(
            `${LEADERBOARD_TABLE}?id=eq.${player.id}`,
            {
                method: "PATCH",

                body: JSON.stringify({
                    distance: cleanDistance
                })
            }
        );


        await fetchLeaderboard();


        return {
            success: true,

            worldRecord:
                cleanDistance > previousWorldRecord,

            newBest: true
        };


    } catch (error) {

        console.error(
            "THRUST FLIGHT SUBMISSION ERROR:",
            error
        );

        LEADERBOARD.connected = false;

        updateLiveIndicator();

        return {
            success: false,
            worldRecord: false,
            newBest: false
        };
    }
}


// ============================================================
// PLAYER NAME
// ============================================================

function getPlayerName() {

    let savedName =
        localStorage.getItem(
            "thrust_player_name"
        );


    if (savedName) {

        savedName =
            savedName
                .trim()
                .replace(/\s+/g, " ")
                .slice(0, 18);


        if (savedName.length > 0) {

            return savedName;
        }
    }


    let name =
        prompt("ENTER YOUR PILOT NAME");


    if (!name) {

        name = "PILOT";
    }


    name =
        name
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 18);


    if (!name) {

        name = "PILOT";
    }


    localStorage.setItem(
        "thrust_player_name",
        name
    );


    return name;
}


// ============================================================
// RENDER LEADERBOARD
// ============================================================

function renderLeaderboard() {

    const container =
        document.getElementById(
            "leaderboardList"
        );


    if (!container) return;


    if (
        !LEADERBOARD.entries ||
        LEADERBOARD.entries.length === 0
    ) {

        container.innerHTML = `
            <div class="leaderboard-empty">
                NO FLIGHTS RECORDED YET
            </div>
        `;

        return;
    }


    container.innerHTML =
        LEADERBOARD.entries
            .map((entry, index) => {

                const rank =
                    index + 1;


                const player =
                    escapeHTML(
                        entry.player_name
                    );


                const distance =
                    Number(
                        entry.distance
                    ).toLocaleString();


                let rankClass = "";


                if (rank === 1) {

                    rankClass =
                        "rank-first";

                } else if (rank === 2) {

                    rankClass =
                        "rank-second";

                } else if (rank === 3) {

                    rankClass =
                        "rank-third";
                }


                return `
                    <div class="leaderboard-row ${rankClass}">

                        <div class="leaderboard-rank">
                            #${rank}
                        </div>

                        <div class="leaderboard-player">
                            ${player}
                        </div>

                        <div class="leaderboard-distance">
                            ${distance}M
                        </div>

                    </div>
                `;

            })
            .join("");
}


// ============================================================
// ERROR STATE
// ============================================================

function renderLeaderboardError() {

    const container =
        document.getElementById(
            "leaderboardList"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="leaderboard-empty">

            <div
                style="
                    font-size:32px;
                    margin-bottom:10px;
                "
            >
                ⚠
            </div>

            <strong>
                CONNECTION ERROR
            </strong>

            <div
                style="
                    margin-top:8px;
                "
            >
                COULD NOT LOAD GLOBAL FLIGHT DATA
            </div>

            <button
                class="menu-btn secondary"
                onclick="fetchLeaderboard()"
                style="margin-top:18px;"
            >
                RETRY
            </button>

        </div>

    `;
}


// ============================================================
// LIVE INDICATOR
// ============================================================

function updateLiveIndicator() {

    const indicator =
        document.querySelector(
            ".live-indicator"
        );


    if (!indicator) return;


    if (LEADERBOARD.connected) {

        indicator.classList.add(
            "online"
        );


        indicator.innerHTML =
            `<span></span> LIVE`;

    } else {

        indicator.classList.remove(
            "online"
        );


        indicator.innerHTML =
            `<span></span> OFFLINE`;
    }
}


// ============================================================
// SECURITY
// ============================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// INITIALIZE
// ============================================================

async function initLeaderboard() {

    updateLiveIndicator();

    await fetchLeaderboard();
}


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(() => {

    if (
        document.visibilityState ===
        "visible"
    ) {

        fetchLeaderboard();
    }

}, 15000);