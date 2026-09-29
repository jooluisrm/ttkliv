const CONFIG = {
  // ==========================================
  // PARTICIPANTES
  // ==========================================

  lanes: [
    {
      id: 0,
      name: "RENAN SANTOS",
      flag: "🚂",
      color: "#3498db",
      image: "/games/imagens/renan.webp",

      // Número usado no chat: 14
      aliases: [
        "renan",
        "renan santos",
        "14"
      ]
    },

    {
      id: 1,
      name: "LULA",
      flag: "🚂",
      color: "#e74c3c",
      image: "/games/imagens/lula.webp",

      // Número usado no chat: 13
      aliases: [
        "lula",
        "13"
      ]
    },

    {
      id: 2,
      name: "FLÁVIO BOLSONARO",
      flag: "🚂",
      color: "#f1c40f",
      image: "/games/imagens/flavio.jpg",

      // Número usado no chat: 22
      aliases: [
        "flavio",
        "flávio",
        "flavio bolsonaro",
        "flávio bolsonaro",
        "22"
      ]
    },

    {
      id: 3,
      name: "CAIADO",
      flag: "🚂",
      color: "#2ecc71",
      image: "/games/imagens/caiado.webp",

      // Número usado no chat: 55
      aliases: [
        "caiado",
        "ronaldo caiado",
        "55"
      ]
    }
  ],

  // ==========================================
  // PRESENTES DO TIKTOK
  // ==========================================

  // posição 0 = Renan
  // posição 1 = Lula
  // posição 2 = Flávio
  // posição 3 = Caiado

  giftTiers: [
    {
      coins: 1,
      gifts: [
        {
          name: "Rose",
          emoji: "🌹"
        },
        {
          name: "GG",
          emoji: "🎉"
        },
        {
          name: "Finger Heart",
          emoji: "🫰"
        },
        {
          name: "Like",
          emoji: "❤️"
        }
      ]
    },

    {
      coins: 5,
      gifts: [
        {
          name: "Perfume",
          emoji: "🌹"
        },
        {
          name: "Cap",
          emoji: "🧢"
        },
        {
          name: "Doughnut",
          emoji: "🍩"
        },
        {
          name: "Cake",
          emoji: "🎂"
        }
      ]
    },

    {
      coins: 10,
      gifts: [
        {
          name: "Money Gun",
          emoji: "💰"
        },
        {
          name: "Perfume",
          emoji: "💎"
        },
        {
          name: "Heart",
          emoji: "💖"
        },
        {
          name: "Star",
          emoji: "⭐"
        }
      ]
    },

    {
      coins: 99,
      gifts: [
        {
          name: "Lion",
          emoji: "🦁"
        },
        {
          name: "Crown",
          emoji: "👑"
        },
        {
          name: "Galaxy",
          emoji: "🌌"
        },
        {
          name: "Dragon",
          emoji: "🐉"
        }
      ]
    }
  ],

  // ==========================================
  // FASES DA CORRIDA
  // ==========================================

  phases: {
    waiting: {
      duration: Infinity
    },

    countdown: {
      duration: 10000
    },

    // A corrida não possui limite de tempo.
    racing: {
      duration: Infinity
    },

    finished: {
      duration: 8000
    },

    cooldown: {
      duration: 5000
    }
  },

  // ==========================================
  // DISTÂNCIA DA CORRIDA
  // ==========================================

  finishLine: 1000,

  // Quanto um comentário válido movimenta
  chatDistance: 3,

  // ==========================================
  // PRESENTES → DISTÂNCIA
  // ==========================================

  giftToDistance(giftValue) {
    return Math.round(
      5 + 3 * Math.sqrt(giftValue)
    );
  },

  // ==========================================
  // PRESENTE → PARTICIPANTE
  // ==========================================

  giftToLane(giftName, giftId, laneCount) {
    const name = String(
      giftName || ""
    ).toLowerCase();

    for (let tier of this.giftTiers) {
      for (
        let i = 0;
        i < tier.gifts.length;
        i++
      ) {
        if (
          String(
            tier.gifts[i].name
          ).toLowerCase() === name
        ) {
          return i % laneCount;
        }
      }
    }

    // Caso o presente não seja encontrado,
    // usa o ID para escolher participante.
    if (
      giftId !== undefined &&
      giftId !== null
    ) {
      return (
        Math.abs(Number(giftId)) %
        laneCount
      );
    }

    return 0;
  },

  // ==========================================
  // EMOJI DO PRESENTE
  // ==========================================

  getGiftEmoji(giftName) {
    const name = String(
      giftName || ""
    ).toLowerCase();

    for (let tier of this.giftTiers) {
      for (let gift of tier.gifts) {
        if (
          String(
            gift.name
          ).toLowerCase() === name
        ) {
          return gift.emoji;
        }
      }
    }

    return "🎁";
  },

  // ==========================================
  // EMOJIS DOS PRESENTES DE CADA PARTICIPANTE
  // ==========================================

  getLaneGiftEmojis(laneIdx) {
    const emojis = [];

    for (let tier of this.giftTiers) {
      if (tier.gifts[laneIdx]) {
        emojis.push(
          tier.gifts[laneIdx].emoji
        );
      }
    }

    return emojis;
  },

  // ==========================================
  // CHAT → PARTICIPANTE
  // ==========================================

  chatToLane(comment) {
    if (!comment) {
      return null;
    }

    // Remove acentos e espaços extras
    const normalized = String(comment)
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .trim();

    for (
      let i = 0;
      i < this.lanes.length;
      i++
    ) {
      const lane =
        this.lanes[i];

      for (
        let alias of lane.aliases
      ) {
        const normalizedAlias =
          String(alias)
            .toLowerCase()
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .trim();

        if (
          normalized ===
          normalizedAlias
        ) {
          return i;
        }
      }
    }

    return null;
  }
};

// ==========================================
// EXPORTAÇÃO
// ==========================================

if (
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = CONFIG;
} else {
  window.RACE_CONFIG = CONFIG;
}