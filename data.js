const GAME_DATA = {
    rockets: {
        classic: { name: "CLASSIC", color: "#172033", unlock: 0 },
        blue: { name: "BLUE", color: "#2878ff", unlock: 500 },
        gold: { name: "GOLD", color: "#e0a900", unlock: 1500 },
        shadow: { name: "SHADOW", color: "#111111", unlock: 3000 },
        sky: { name: "SKY", color: "#36a9e1", unlock: 5000 },
        crimson: { name: "CRIMSON", color: "#d94b4b", unlock: 10000 }
    },

    achievements: [
        {
            id: "first",
            icon: "🚀",
            name: "FIRST FLIGHT",
            description: "Reach 100m",
            score: 100
        },

        {
            id: "speed",
            icon: "⚡",
            name: "SPEED DEMON",
            description: "Reach 500m",
            score: 500
        },

        {
            id: "survivor",
            icon: "🛡️",
            name: "SURVIVOR",
            description: "Reach 1,000m",
            score: 1000
        },

        {
            id: "master",
            icon: "🔥",
            name: "THRUST MASTER",
            description: "Reach 2,500m",
            score: 2500
        },

        {
            id: "legend",
            icon: "👑",
            name: "LEGEND",
            description: "Reach 5,000m",
            score: 5000
        },

        {
            id: "insane",
            icon: "☄️",
            name: "INSANE",
            description: "Reach 10,000m",
            score: 10000
        }
    ]
};