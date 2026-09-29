/**
 * game.js
 * Corrida com fotos dos participantes
 */

(() => {
	// ==========================================
	// SETUP
	// ==========================================

	const config = window.RACE_CONFIG;
	const engine = new RaceEngine(config);

	// Deixa disponível no console para testes.
	window.engine = engine;

	const canvas = document.getElementById("raceCanvas");
	const ctx = canvas.getContext("2d");

	// ==========================================
	// ELEMENTOS DA INTERFACE
	// ==========================================

	const phaseBanner = document.getElementById("phaseBanner");
	const phaseText = document.getElementById("phaseText");
	const phaseTimer = document.getElementById("phaseTimer");

	const laneLabelsDiv = document.getElementById("laneLabels");
	const eventFeedDiv = document.getElementById("eventFeed");

	const winnerOverlay = document.getElementById("winnerOverlay");
	const winnerEmoji = document.getElementById("winnerEmoji");
	const winnerName = document.getElementById("winnerName");
	const winnerSupporters =
		document.getElementById("winnerSupporters");
		// ==========================================
// PLACAR DE VITÓRIAS
// ==========================================

const victoryList =
    document.getElementById("victoryList");

const VICTORY_STORAGE_KEY = "liveRaceVictories";

let victories = {};

try {
    victories =
        JSON.parse(
            localStorage.getItem(VICTORY_STORAGE_KEY)
        ) || {};
} catch (error) {
    victories = {};
}

// Garante que todos começam com contador
config.lanes.forEach((lane) => {
    if (typeof victories[lane.id] !== "number") {
        victories[lane.id] = 0;
    }
});

function saveVictories() {
    localStorage.setItem(
        VICTORY_STORAGE_KEY,
        JSON.stringify(victories)
    );
}

function renderVictoryBoard() {

    if (!victoryList) {
        return;
    }

    victoryList.innerHTML = "";

    config.lanes.forEach((lane) => {

        const item =
            document.createElement("div");

        item.className = "victory-item";

        item.style.borderLeft =
            "3px solid " + lane.color;


        const player =
            document.createElement("span");

        player.className =
            "victory-player";

        player.textContent =
            lane.name;


        const count =
            document.createElement("span");

        count.className =
            "victory-count";

        count.textContent =
            victories[lane.id] || 0;


        item.appendChild(player);

        item.appendChild(count);

        victoryList.appendChild(item);
    });
}


// Impede uma vitória de ser contada várias vezes
let countedWinner = false;


// Mostra o placar assim que o jogo carregar
renderVictoryBoard();

	// ==========================================
	// CARREGAR FOTOS
	// ==========================================

	const images = {};

	config.lanes.forEach((lane) => {
		if (!lane.image) {
			return;
		}

		const img = new Image();

		img.src = lane.image;

		img.onload = () => {
			images[lane.id] = img;
		};

		img.onerror = () => {
			console.warn(
				"Erro ao carregar imagem:",
				lane.name,
				lane.image
			);
		};
	});

	// ==========================================
	// TAMANHO DO CANVAS
	// ==========================================

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	window.addEventListener("resize", resize);

	resize();

	// ==========================================
	// TIKTOK
	// ==========================================

	TikTokBridge.on("gift", (data) => {

	console.log("🎁 PRESENTE RECEBIDO DO TIKTOK");
	console.log("Nome:", data.giftName);
	console.log("ID:", data.giftId);
	console.log("Valor:", data.giftValue);
	console.log("Usuário:", data.user);
	console.log("Dados completos:", data);

	engine.handleGift(data);
});

	TikTokBridge.on("chat", (data) => {
		engine.handleChat(data);
	});

	TikTokBridge.on("like", (data) => {
		engine.handleLike(data);
	});

	// ==========================================
	// NOMES DOS PARTICIPANTES
	// ==========================================

	function buildLaneLabels() {
	laneLabelsDiv.innerHTML = "";

	config.lanes.forEach((lane) => {
		const el = document.createElement("div");

		el.className = "lane-label";
		el.id = "lane-label-" + lane.id;
		el.style.borderLeftColor = lane.color;

		const giftEmojis = config
			.getLaneGiftEmojis(lane.id)
			.join(" ");

		// Procura automaticamente o alias numérico
		// configurado para esta raia.
		const voteNumber =
			lane.aliases.find((alias) =>
				/^\d+$/.test(String(alias).trim())
			) || "";

		el.innerHTML =
			'<div class="lane-top">' +

			'<span class="lane-name">' +
			lane.name +
			"</span>" +

			'<span class="lane-vote">' +
			"DIGITE " +
			voteNumber +
			"</span>" +

			'<span class="lane-dist">' +
			"0%" +
			"</span>" +

			"</div>" +

			'<div class="lane-gifts">' +
			giftEmojis +
			"</div>";

		laneLabelsDiv.appendChild(el);
	});
}

	buildLaneLabels();

	// ==========================================
	// MUDANÇA DE FASE
	// ==========================================

	let lastFeedCount = 0;

engine.on("phaseChange", ({ phase }) => {

	if (phase === "waiting") {

		buildLaneLabels();

		lastFeedCount = 0;

		// Libera o contador para a próxima corrida
		countedWinner = false;
	}

	// Quando alguém vence
	if (
		phase === "finished" &&
		engine.state.winner &&
		!countedWinner
	) {

		const winnerId =
			engine.state.winner.id;

		// Soma +1 vitória
		victories[winnerId] =
			(victories[winnerId] || 0) + 1;

		// Salva mesmo se atualizar a página
		saveVictories();

		// Atualiza o placar na tela
		renderVictoryBoard();

		// Impede contar duas vezes
		countedWinner = true;

		console.log(
			"[Placar] Vitória registrada:",
			engine.state.winner.name,
			"| Total:",
			victories[winnerId]
		);
	}
});

	// ==========================================
	// LOOP
	// ==========================================

	function frame() {
		const state = engine.tick();

		drawTrack(state);

		updateHUD(state);

		requestAnimationFrame(frame);
	}

	// ==========================================
	// DESENHAR FOTO
	// ==========================================

	function drawParticipantImage(
		img,
		x,
		y,
		size,
		color
	) {
		// ======================================
		// IMAGEM NÃO CARREGADA
		// ======================================

		if (
			!img ||
			!img.complete ||
			img.naturalWidth === 0
		) {
			ctx.save();

			ctx.beginPath();

			ctx.arc(
				x,
				y,
				size / 2,
				0,
				Math.PI * 2
			);

			ctx.fillStyle = color;

			ctx.fill();

			ctx.fillStyle = "#ffffff";

			ctx.font =
				"bold " +
				(size * 0.4) +
				"px Arial";

			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			ctx.fillText(
				"?",
				x,
				y
			);

			ctx.restore();

			return;
		}

		// ======================================
		// FOTO
		// ======================================

		ctx.save();

		// Sombra
		ctx.shadowColor = "rgba(0,0,0,0.7)";
		ctx.shadowBlur = 12;
		ctx.shadowOffsetY = 4;

		// Borda colorida
		ctx.beginPath();

		ctx.arc(
			x,
			y,
			size / 2 + 5,
			0,
			Math.PI * 2
		);

		ctx.fillStyle = color;
		ctx.fill();

		ctx.shadowColor = "transparent";

		// Recorte circular da foto
		ctx.beginPath();

		ctx.arc(
			x,
			y,
			size / 2,
			0,
			Math.PI * 2
		);

		ctx.clip();

		// Faz a imagem preencher o círculo
		const ratio = Math.max(
			size / img.naturalWidth,
			size / img.naturalHeight
		);

		const width =
			img.naturalWidth * ratio;

		const height =
			img.naturalHeight * ratio;

		ctx.drawImage(
			img,
			x - width / 2,
			y - height / 2,
			width,
			height
		);

		ctx.restore();

		// ======================================
		// BORDA BRANCA
		// ======================================

		ctx.beginPath();

		ctx.arc(
			x,
			y,
			size / 2 + 5,
			0,
			Math.PI * 2
		);

		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 3;

		ctx.stroke();
	}
		// ==========================================
	// DESENHAR PISTA
	// ==========================================

	function drawTrack(state) {
		const W = canvas.width;
		const H = canvas.height;
		const laneCount = state.lanes.length;

		ctx.clearRect(0, 0, W, H);

		// ======================================
		// FUNDO
		// ======================================

		const gradient =
			ctx.createLinearGradient(
				0,
				0,
				0,
				H
			);

		gradient.addColorStop(
			0,
			"#111827"
		);

		gradient.addColorStop(
			1,
			"#030712"
		);

		ctx.fillStyle = gradient;

		ctx.fillRect(
			0,
			0,
			W,
			H
		);

		// ======================================
		// DIMENSÕES DA PISTA
		// ======================================

		/*
		 * IMPORTANTE:
		 *
		 * A pista começa mais para dentro.
		 * Isso impede que a foto fique grudada
		 * ou cortada no começo da corrida.
		 */

		const trackLeft =
			Math.max(
				110,
				W * 0.10
			);

		const trackRight =
			W -
			Math.max(
				70,
				W * 0.06
			);

		const trackTop =
			Math.max(
				110,
				H * 0.19
			);

		const trackBottom =
			H * 0.88;

		const trackWidth =
			trackRight -
			trackLeft;

		const trackHeight =
			trackBottom -
			trackTop;

		const laneH =
			trackHeight /
			laneCount;

		// ======================================
		// FUNDO GERAL DA PISTA
		// ======================================

		ctx.fillStyle =
			"rgba(255,255,255,0.045)";

		ctx.beginPath();

		ctx.roundRect(
			trackLeft - 20,
			trackTop - 15,
			trackWidth + 40,
			trackHeight + 30,
			20
		);

		ctx.fill();

		// ======================================
		// LINHA DE CHEGADA
		// ======================================

		const finishX = trackRight;

		const checkerSize = 12;

		for (
			let y = trackTop;
			y < trackBottom;
			y += checkerSize
		) {
			for (
				let x = finishX - 24;
				x < finishX;
				x += checkerSize
			) {
				const col =
					Math.floor(
						(x - (finishX - 24)) /
						checkerSize
					);

				const row =
					Math.floor(
						(y - trackTop) /
						checkerSize
					);

				ctx.fillStyle =
					(col + row) % 2 === 0
						? "rgba(255,255,255,0.9)"
						: "rgba(20,20,20,0.9)";

				ctx.fillRect(
					x,
					y,
					checkerSize,
					checkerSize
				);
			}
		}

		// ======================================
		// PARTICIPANTES
		// ======================================

		state.lanes.forEach(
			(lane, i) => {

				const y =
					trackTop +
					i * laneH;

				const imageY =
					y +
					laneH / 2;

				const progress =
					Math.min(
						lane.distance /
							config.finishLine,
						1
					);

				/*
				 * Reservamos um pouco de espaço
				 * no final para a foto não
				 * ultrapassar a linha de chegada.
				 */

				const imageSize =
					Math.min(
						72,
						laneH * 0.60
					);

				const usableTrackWidth =
					trackWidth -
					imageSize / 2 -
					12;

				const barWidth =
					usableTrackWidth *
					progress;

				// ==================================
				// FUNDO DA FAIXA
				// ==================================

				ctx.fillStyle =
					i % 2 === 0
						? "rgba(255,255,255,0.035)"
						: "rgba(255,255,255,0.015)";

				ctx.fillRect(
					trackLeft,
					y,
					trackWidth,
					laneH
				);

				// ==================================
				// LINHA DIVISÓRIA
				// ==================================

				if (i > 0) {
					ctx.strokeStyle =
						"rgba(255,255,255,0.12)";

					ctx.lineWidth = 2;

					ctx.setLineDash(
						[10, 10]
					);

					ctx.beginPath();

					ctx.moveTo(
						trackLeft,
						y
					);

					ctx.lineTo(
						trackRight,
						y
					);

					ctx.stroke();

					ctx.setLineDash([]);
				}

				// ==================================
				// BARRA DE PROGRESSO
				// ==================================

				ctx.fillStyle =
					lane.color + "30";

				ctx.fillRect(
					trackLeft,
					y + 8,
					barWidth,
					laneH - 16
				);

				ctx.fillStyle =
					lane.color;

				ctx.fillRect(
					trackLeft,
					y + laneH - 6,
					barWidth,
					4
				);

				// ==================================
				// FOTO
				// ==================================

				const imageX =
					trackLeft +
					barWidth;

				drawParticipantImage(
					images[lane.id],
					imageX,
					imageY,
					imageSize,
					lane.color
				);

				// ==================================
				// NOME
				// ==================================

				ctx.font =
					"bold 13px Arial";

				ctx.fillStyle =
					"#ffffff";

				ctx.textBaseline =
					"middle";

				ctx.textAlign =
					"left";

				const nameX =
					imageX +
					imageSize / 2 +
					12;

				// Pega automaticamente o número configurado
const voteNumber =
	lane.aliases.find((alias) =>
		/^\d+$/.test(String(alias).trim())
	) || "";

ctx.fillText(
	lane.name + "  •  " + voteNumber,
	nameX,
	imageY - 8
);

				// ==================================
				// PORCENTAGEM
				// ==================================

				ctx.font =
					"bold 11px Arial";

				ctx.fillStyle =
					lane.color;

				ctx.textAlign =
					"left";

				ctx.textBaseline =
					"middle";

				ctx.fillText(
					Math.round(
						progress * 100
					) + "%",
					nameX,
					imageY + 12
				);
			}
		);

		/*
		 * Estes dois fechamentos estavam
		 * faltando/quebrados na versão anterior.
		 */
	}
		// ==========================================
	// HUD
	// ==========================================

	function updateHUD(state) {

		const phaseLabels = {
			waiting:
				"Aguardando comentários ou presentes...",

			countdown:
				"A corrida vai começar...",

			racing:
				"CORRIDA EM ANDAMENTO!",

			finished:
				"RODADA FINALIZADA!",

			cooldown:
				"Próxima rodada em breve..."
		};

		// ======================================
		// TEXTO DA FASE
		// ======================================

		phaseText.textContent =
			phaseLabels[state.phase] ||
			state.phase;

		// ======================================
		// TEMPO RESTANTE
		// ======================================

		const remaining =
			engine.phaseRemaining();

		if (
			remaining !== Infinity &&
			remaining > 0
		) {
			phaseTimer.textContent =
				Math.ceil(
					remaining / 1000
				) + "s";
		} else {
			phaseTimer.textContent = "";
		}

		// ======================================
		// ANIMAÇÃO DO COUNTDOWN
		// ======================================

		if (
			state.phase ===
			"countdown"
		) {
			phaseBanner.classList.add(
				"countdown"
			);
		} else {
			phaseBanner.classList.remove(
				"countdown"
			);
		}

		// ======================================
		// PORCENTAGENS
		// ======================================

		state.lanes.forEach(
			(lane) => {

				const el =
					document.getElementById(
						"lane-label-" +
						lane.id
					);

				if (!el) {
					return;
				}

				const pct =
					Math.round(
						(
							lane.distance /
							config.finishLine
						) * 100
					);

				const dist =
					el.querySelector(
						".lane-dist"
					);

				if (dist) {
					dist.textContent =
						pct + "%";
				}
			}
		);

		// ======================================
		// FEED DE EVENTOS
		// ======================================

		if (
			state.recentEvents.length !==
			lastFeedCount
		) {
			lastFeedCount =
				state.recentEvents.length;

			/*
			 * Antes eram 8 eventos.
			 * Agora mostramos somente 4.
			 */
			renderFeed(
				state.recentEvents.slice(
					0,
					4
				)
			);
		}

		// ======================================
		// VENCEDOR
		// ======================================

		if (
			state.phase === "finished" &&
			state.winner
		) {
			showWinner(
				state.winner
			);
		} else {
			winnerOverlay.classList.add(
				"hidden"
			);
		}
	}

	// ==========================================
	// FEED
	// ==========================================

	function renderFeed(events) {

		eventFeedDiv.innerHTML = "";

		events.forEach(
			(evt) => {

				const el =
					document.createElement(
						"div"
					);

				el.className =
					"feed-item " +
					evt.type;

				// PRESENTE
				if (
					evt.type === "gift"
				) {
					el.textContent =
						evt.nickname +
						" → " +
						(evt.laneName || "") +
						" (+" +
						evt.distance +
						")";

				// VOTO PELO CHAT
				} else if (
					evt.type === "vote"
				) {
					el.textContent =
						evt.nickname +
						" → " +
						(evt.laneName || "") +
						" (+" +
						evt.distance +
						")";

				// CHAT NORMAL
				} else if (
					evt.type === "chat"
				) {
					el.textContent =
						evt.nickname +
						": " +
						evt.text;

				// LIKE
				} else if (
					evt.type === "like"
				) {
					el.textContent =
						evt.nickname +
						" +" +
						evt.count;
				}

				eventFeedDiv.appendChild(
					el
				);
			}
		);
	}

	// ==========================================
	// VENCEDOR
	// ==========================================

	function showWinner(winner) {

		winnerOverlay.classList.remove(
			"hidden"
		);

		winnerEmoji.textContent = "🏆";

		winnerName.textContent =
			winner.name +
			" VENCEU A RODADA!";

		winnerName.style.color =
			winner.color;

		const supporters =
			Array.from(
				winner.supporters.values()
			)
				.sort(
					(a, b) =>
						b.totalContrib -
						a.totalContrib
				)
				.slice(
					0,
					3
				);

		if (
			supporters.length > 0
		) {
			winnerSupporters.textContent =
				"Quem mais contribuiu: " +
				supporters
					.map(
						(s) =>
							s.nickname +
							" (" +
							s.totalContrib +
							")"
					)
					.join(", ");
		} else {
			winnerSupporters.textContent =
				"";
		}
	}

	// ==========================================
	// INICIAR
	// ==========================================

	requestAnimationFrame(
		frame
	);

	console.log(
		"[LiveRace] Corrida carregada com fotos."
	);

})();
