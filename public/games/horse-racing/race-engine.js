/**
 * race-engine.js
 * Pure state machine for Horse Racing.
 * NO DOM, NO Canvas — just data in, state out.
 * The renderer (game.js) reads state and draws.
 *
 * Phases: WAITING → COUNTDOWN → RACING → FINISHED → COOLDOWN → WAITING
 *
 * @module games/horse-racing/race-engine
 */

class RaceEngine {
	/**
	 * @param {Object} config - RACE_CONFIG from config.js
	 */
	constructor(config) {
		this.config = config;
		this.listeners = {};
		this.reset();
	}

	// ==========================================
	// STATE
	// ==========================================

	reset() {
		this.state = {
			phase: "waiting",
			phaseStartedAt: Date.now(),

			lanes: this.config.lanes.map((lane) => ({
				...lane,
				distance: 0,
				supporters: new Map(),
			})),

			winner: null,

			raceCount:
				this.state?.raceCount || 0,

			recentEvents: [],
		};

		this._emit("phaseChange", {
			phase: "waiting",
		});
	}

	// ==========================================
	// PHASE TRANSITIONS
	// ==========================================

	_setPhase(nextPhase) {
		this.state.phase = nextPhase;
		this.state.phaseStartedAt = Date.now();

		this._emit("phaseChange", {
			phase: nextPhase,
		});
	}

	/**
	 * Tempo passado na fase atual.
	 */
	phaseElapsed() {
		return (
			Date.now() -
			this.state.phaseStartedAt
		);
	}

	/**
	 * Tempo restante da fase atual.
	 */
	phaseRemaining() {
		const dur =
			this.config.phases[
				this.state.phase
			]?.duration ?? Infinity;

		if (dur === Infinity) {
			return Infinity;
		}

		return Math.max(
			0,
			dur - this.phaseElapsed()
		);
	}

	// ==========================================
	// TICK
	// ==========================================

	/**
	 * Atualização principal do jogo.
	 *
	 * IMPORTANTE:
	 * A corrida NÃO possui mais limite
	 * de tempo.
	 *
	 * Ela só termina quando alguém
	 * chegar na linha de chegada.
	 */
	tick() {
		const { phase } = this.state;
		const remaining =
			this.phaseRemaining();

		// COUNTDOWN terminou
		if (
			phase === "countdown" &&
			remaining <= 0
		) {
			this._setPhase("racing");
		}

		// Vencedor já foi definido.
		// Aguarda antes do cooldown.
		else if (
			phase === "finished" &&
			remaining <= 0
		) {
			this._setPhase("cooldown");
		}

		// Cooldown terminou.
		// Prepara uma nova corrida.
		else if (
			phase === "cooldown" &&
			remaining <= 0
		) {
			this.state.raceCount++;

			this.reset();
		}

		/*
		 * NÃO existe condição de tempo
		 * para a fase "racing".
		 *
		 * Portanto, mesmo que o tempo
		 * configurado chegue a zero,
		 * a corrida continua normalmente.
		 *
		 * Somente _checkFinish()
		 * pode finalizar a corrida.
		 */

		return this.state;
	}

	// ==========================================
	// EVENT HANDLERS
	// ==========================================

	/**
	 * Processa presentes.
	 */
	handleGift(data) {
		const { phase } = this.state;

		// Primeiro presente inicia countdown
		if (phase === "waiting") {
			this._setPhase("countdown");
		}

		// Durante countdown ou corrida
		if (
			phase === "countdown" ||
			phase === "racing"
		) {
			const laneCount =
				this.state.lanes.length;

			const laneIdx =
				this.config.giftToLane(
					data.giftName,
					data.giftId,
					laneCount
				);

			const distance =
				this.config.giftToDistance(
					data.giftValue
				);

			this._moveLane(
				laneIdx,
				distance,
				data.user,
				data
			);

			// Só pode vencer depois
			// que a corrida começou.
			if (phase === "racing") {
				this._checkFinish();
			}
		}
	}

	/**
	 * Processa comentários.
	 */
	handleChat(data) {
		const { phase } = this.state;

		const comment =
			(data.comment || "").trim();

		const laneIdx =
			this.config.chatToLane(
				comment
			);

		if (laneIdx >= 0) {
			// Primeiro voto inicia countdown
			if (phase === "waiting") {
				this._setPhase(
					"countdown"
				);
			}

			if (
				phase === "countdown" ||
				phase === "racing"
			) {
				const distance =
					this.config
						.chatDistance || 3;

				const lane =
					this.state.lanes[
						laneIdx
					];

				this._moveLane(
					laneIdx,
					distance,
					data.user,
					{
						giftName: null,
						_isChat: true,
						_comment: comment,
						_laneFlag:
							lane?.flag || "",
					}
				);

				// Só verifica vencedor
				// durante a corrida.
				if (
					phase === "racing"
				) {
					this._checkFinish();
				}
			}
		} else {
			this._addRecentEvent({
				type: "chat",
				nickname:
					data.user.nickname,
				text: comment,
			});
		}
	}

	/**
	 * Processa likes.
	 */
	handleLike(data) {
		this._addRecentEvent({
			type: "like",
			nickname:
				data.user.nickname,
			count: data.likeCount,
		});
	}

	// ==========================================
	// MOVIMENTO
	// ==========================================

	_moveLane(
		laneIdx,
		distance,
		user,
		rawData
	) {
		const lane =
			this.state.lanes[laneIdx];

		if (!lane) {
			return;
		}

		// Move sem ultrapassar
		// a linha de chegada.
		lane.distance = Math.min(
			lane.distance + distance,
			this.config.finishLine
		);

		// ======================================
		// APOIADORES
		// ======================================

		const existing =
			lane.supporters.get(
				user.uniqueId
			);

		if (existing) {
			existing.totalContrib +=
				distance;
		} else {
			lane.supporters.set(
				user.uniqueId,
				{
					nickname:
						user.nickname,
					totalContrib:
						distance,
				}
			);
		}

		// ======================================
		// EVENTO DE CHAT
		// ======================================

		if (rawData._isChat) {
			this._addRecentEvent({
				type: "vote",

				nickname:
					user.nickname,

				laneFlag:
					lane.flag,

				laneName:
					lane.name,

				distance,

				comment:
					rawData._comment,
			});
		}

		// ======================================
		// EVENTO DE PRESENTE
		// ======================================

		else {
			this._addRecentEvent({
				type: "gift",

				nickname:
					user.nickname,

				laneFlag:
					lane.flag,

				laneName:
					lane.name,

				distance,

				giftName:
					rawData.giftName ||
					"",

				giftEmoji:
					this.config
						.getGiftEmoji(
							rawData.giftName
						),
			});
		}

		this._emit("laneMove", {
			laneIdx,
			distance,
			lane,
			user,
		});
	}

	// ==========================================
	// LINHA DE CHEGADA
	// ==========================================

	_checkFinish() {
		// Segurança: só pode haver
		// vencedor durante a corrida.
		if (
			this.state.phase !==
			"racing"
		) {
			return;
		}

		for (
			const lane of
			this.state.lanes
		) {
			if (
				lane.distance >=
				this.config.finishLine
			) {
				this.state.winner =
					lane;

				this._setPhase(
					"finished"
				);

				this._emit(
					"raceFinished",
					{
						winner:
							lane,
					}
				);

				return;
			}
		}
	}

	// ==========================================
	// EVENT FEED
	// ==========================================

	_addRecentEvent(evt) {
		evt.timestamp =
			Date.now();

		this.state.recentEvents.unshift(
			evt
		);

		if (
			this.state.recentEvents
				.length > 20
		) {
			this.state.recentEvents.length =
				20;
		}
	}

	// ==========================================
	// EVENT EMITTER
	// ==========================================

	on(event, fn) {
		(
			this.listeners[event] ??=
				[]
		).push(fn);
	}

	_emit(event, data) {
		(
			this.listeners[event] ||
			[]
		).forEach((fn) => {
			try {
				fn(data);
			} catch (e) {
				console.error(
					`[RaceEngine] Error in ${event} listener:`,
					e
				);
			}
		});
	}
}

// ==========================================
// EXPORT
// ==========================================

if (
	typeof module !== "undefined" &&
	module.exports
) {
	module.exports =
		RaceEngine;
} else {
	window.RaceEngine =
		RaceEngine;
}