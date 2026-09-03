function showScreen(id) {

    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen =>
                screen.classList.remove(
                    "active"
                )
        );


    document
        .getElementById(id)
        .classList.add(
            "active"
        );
}


function showGameOver(
    distance,
    newRecord
) {

    const grade =
        getGrade(
            distance
        );


    document.getElementById(
        "runGrade"
    ).textContent =
        grade;


    document.getElementById(
        "finalDistance"
    ).textContent =
        distance + "m";


    document.getElementById(
        "finalSector"
    ).textContent =
        String(
            Math.min(
                10,
                Math.floor(
                    distance /
                    1000
                ) + 1
            )
        ).padStart(
            2,
            "0"
        );


    document.getElementById(
        "finalSpeed"
    ).textContent =
        Math.round(
            GAME.maxSpeed
        );


    document.getElementById(
        "finalBest"
    ).textContent =
        GAME.best + "m";


    document.getElementById(
        "finalRating"
    ).textContent =
        grade;


    document
        .getElementById(
            "newRecord"
        )
        .classList.toggle(
            "show",
            newRecord
        );


    showScreen(
        "gameOverScreen"
    );
}


function renderRecords() {

    const list =
        document.getElementById(
            "leaderboardList"
        );


    list.innerHTML = `

        <div class="record-row">

            <span>#01</span>

            <strong>
                YOU
            </strong>

            <b>
                ${GAME.best}m
            </b>

        </div>

    `;
}


function renderAchievements() {

    const list =
        document.getElementById(
            "achievementList"
        );


    const unlocked =
        getUnlocked();


    list.innerHTML = "";


    if (
        typeof GAME_DATA ===
        "undefined"
    ) {
        return;
    }


    GAME_DATA.achievements
        .forEach(
            achievement => {

                const done =
                    unlocked.includes(
                        achievement.id
                    );


                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "achievement-row" +
                    (
                        done
                            ? " unlocked"
                            : ""
                    );


                row.innerHTML = `

                    <div class="achievement-icon">
                        ${achievement.icon}
                    </div>

                    <div class="achievement-info">

                        <strong>
                            ${achievement.name}
                        </strong>

                        <small>
                            ${achievement.description}
                        </small>

                    </div>

                    <span>
                        ${done
                        ? "UNLOCKED"
                        : "LOCKED"
                    }
                    </span>
                `;


                list.appendChild(
                    row
                );
            }
        );
}


function renderMissions() {

    const list =
        document.getElementById(
            "missionList"
        );


    const best =
        Number(
            localStorage.getItem(
                "thrustMissionBest"
            ) || 0
        );


    const missions = [

        {
            name:
                "FIRST FLIGHT",

            description:
                "Reach 500m",

            target:
                500
        },

        {
            name:
                "PUSH DEEP",

            description:
                "Reach 2,500m",

            target:
                2500
        },

        {
            name:
                "NO FEAR",

            description:
                "Reach 5,000m",

            target:
                5000
        },

        {
            name:
                "VOID RUNNER",

            description:
                "Reach 10,000m",

            target:
                10000
        }
    ];


    list.innerHTML = "";


    missions.forEach(
        mission => {

            const percent =
                Math.min(
                    100,
                    (
                        best /
                        mission.target
                    ) * 100
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "mission-row";


            row.innerHTML = `

                <div>

                    <strong>
                        ${mission.name}
                    </strong>

                    <small>
                        ${mission.description}
                    </small>

                </div>

                <b>
                    ${Math.min(
                best,
                mission.target
            )} /
                    ${mission.target}m
                </b>

                <div class="mission-progress">

                    <i style="
                        width:${percent}%
                    "></i>

                </div>

            `;


            list.appendChild(
                row
            );
        }
    );
}


function renderGarage() {

    const list =
        document.getElementById(
            "garageList"
        );


    if (
        typeof GAME_DATA ===
        "undefined"
    ) {
        return;
    }


    list.innerHTML = "";


    Object.entries(
        GAME_DATA.rockets
    ).forEach(
        ([id, rocket]) => {

            const unlocked =
                GAME.best >=
                rocket.unlock;


            const selected =
                GAME.selectedRocket ===
                id;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "garage-row" +
                (
                    selected
                        ? " selected"
                        : ""
                );


            row.innerHTML = `

                <div
                    class="garage-preview"
                    style="
                        background:${rocket.color}
                    "
                ></div>

                <div class="garage-info">

                    <strong>
                        ${rocket.name}
                    </strong>

                    <small>
                        ${unlocked
                    ? "READY"
                    : `UNLOCK AT ${rocket.unlock}m`
                }
                    </small>

                </div>

                <button
                    ${unlocked
                    ? ""
                    : "disabled"
                }
                    class="garage-select"
                    data-rocket="${id}"
                >
                    ${selected
                    ? "SELECTED"
                    : unlocked
                        ? "SELECT"
                        : "LOCKED"
                }
                </button>

            `;


            list.appendChild(
                row
            );
        }
    );


    document
        .querySelectorAll(
            "[data-rocket]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        GAME.selectedRocket =
                            button.dataset.rocket;


                        localStorage.setItem(
                            "thrustRocket",
                            GAME.selectedRocket
                        );


                        renderGarage();
                    }
                );
            }
        );
}


function updateSettingsUI() {

    const music =
        document.getElementById(
            "musicToggle"
        );

    const sfx =
        document.getElementById(
            "sfxToggle"
        );


    music.textContent =
        AUDIO.enabled
            ? "ON"
            : "OFF";


    sfx.textContent =
        AUDIO.sfxEnabled
            ? "ON"
            : "OFF";


    music.classList.toggle(
        "off",
        !AUDIO.enabled
    );


    sfx.classList.toggle(
        "off",
        !AUDIO.sfxEnabled
    );
}