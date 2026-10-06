// ========================================
// DUELO DA LIVE — MOTOR DO JOGO
// ========================================

const fighters = {
  lula: {
    hp: 100,
    wins: 0,
    element: document.getElementById("lula"),
    sprite: document.getElementById("spriteLula")
  },

  bolsonaro: {
    hp: 100,
    wins: 0,
    element: document.getElementById("bolsonaro"),
    sprite: document.getElementById("spriteBolsonaro")
  }
};


// ========================================
// ATAQUES
// ========================================

const attacks = {
  soco: {
    damage: 5,
    duration: 450,
    animation: "soco",
    cssClass: "punch",
    movementClass: "soco-avancando"
  },

  combo: {
    damage: 20,
    duration: 1300,
    animation: "combo",
    cssClass: "combo",
    movementClass: "combo-avancando"
  },

  especial: {
    damage: 100,
    duration: 2200,
    animation: "soco",
    cssClass: "special",
    movementClass: "especial-avancando"
  }
};


// ========================================
// SONS
// ========================================

const sounds = {
  soco: new Audio("sons/soco.mp3"),
  especial: new Audio("sons/especial.mp3"),
  ko: new Audio("sons/ko.mp3")
};

sounds.soco.volume = 0.65;
sounds.especial.volume = 0.8;
sounds.ko.volume = 0.3;


function playSound(name) {

  const original = sounds[name];

  if (!original) {
    return;
  }

  const audio = original.cloneNode(true);

  audio.volume = original.volume;

  audio.play().catch(error => {
    console.warn(
      `[Duelo] Não foi possível tocar o som "${name}":`,
      error
    );
  });
}


// ========================================
// ANIMAÇÕES
// ========================================

const animations = {
  lula: {
    parado: 4,
    soco: 3,
    combo: 5,
    especial: 4,
    ko: 4
  },

  bolsonaro: {
    parado: 4,
    soco: 3,
    combo: 5,
    especial: 4,
    ko: 4
  }
};


const animationTimers = {};

const animationTokens = {
  lula: 0,
  bolsonaro: 0
};


// ========================================
// FILA DE ATAQUES
// ========================================

const attackQueue = [];

let busy = false;
let round = 1;
let roundEnding = false;


// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function getOpponent(name) {
  return name === "lula"
    ? "bolsonaro"
    : "lula";
}


function getDisplayName(name) {
  return name === "lula"
    ? "LULA"
    : "FLÁVIO BOLSONARO";
}


function spritePath(name, action, frame) {
  return `sprites/${name}/${action}-${frame}.png`;
}


// ========================================
// CARREGAMENTO DOS PERSONAGENS
// ========================================

function checkSprites() {

  for (const [name, fighter] of Object.entries(fighters)) {

    const img = new Image();

    img.onload = () => {

      fighter.element.classList.add("has-sprite");

      fighter.sprite.src = img.src;

      playAnimation(name, "parado");
    };


    img.onerror = () => {
      console.warn(
        `[Duelo] Sprite de ${name} não encontrado.`
      );
    };


    img.src = spritePath(
      name,
      "parado",
      1
    );
  }
}


// ========================================
// PARAR ANIMAÇÃO
// ========================================

function stopAnimation(name) {

  if (animationTimers[name]) {

    clearInterval(animationTimers[name]);

    animationTimers[name] = null;
  }

  // Invalida qualquer animação antiga.
  animationTokens[name]++;
}


// ========================================
// ANIMAÇÃO CONTÍNUA
// ========================================

function playAnimation(
  name,
  action,
  duration = null
) {

  const fighter = fighters[name];

  if (
    !fighter ||
    !fighter.element.classList.contains("has-sprite")
  ) {
    return;
  }


  stopAnimation(name);


  const frameCount =
    animations[name][action];


  if (!frameCount) {
    return;
  }


  const token =
    animationTokens[name];


  const frameDelay =
    duration
      ? duration / frameCount
      : 150;


  let frame = 1;


  fighter.sprite.src =
    spritePath(
      name,
      action,
      frame
    );


  animationTimers[name] =
    setInterval(() => {

      if (
        token !== animationTokens[name]
      ) {

        clearInterval(
          animationTimers[name]
        );

        animationTimers[name] = null;

        return;
      }


      frame++;


      if (frame > frameCount) {

        if (action === "parado") {

          frame = 1;

        } else {

          clearInterval(
            animationTimers[name]
          );

          animationTimers[name] = null;

          return;
        }
      }


      fighter.sprite.src =
        spritePath(
          name,
          action,
          frame
        );

    }, frameDelay);
}


// ========================================
// ANIMAÇÃO DE ATAQUE SINCRONIZADA
// ========================================

async function playAttackAnimation(
  name,
  action,
  duration
) {

  const fighter = fighters[name];


  if (
    !fighter ||
    !fighter.element.classList.contains("has-sprite")
  ) {

    await sleep(duration);
    return;
  }


  stopAnimation(name);


  const token =
    animationTokens[name];


  const frameCount =
    animations[name][action];


  if (!frameCount) {

    await sleep(duration);
    return;
  }


  const frameDelay =
    duration / frameCount;


  for (
    let frame = 1;
    frame <= frameCount;
    frame++
  ) {

    if (
      token !== animationTokens[name]
    ) {
      return;
    }


    fighter.sprite.src =
      spritePath(
        name,
        action,
        frame
      );


    await sleep(frameDelay);
  }
}


// ========================================
// VOLTAR PARA PARADO
// ========================================

function voltarParaParado(name) {

  const fighter = fighters[name];

  if (!fighter) {
    return;
  }

  if (fighter.hp <= 0) {
    return;
  }

  playAnimation(
    name,
    "parado"
  );
}


// ========================================
// BARRAS DE VIDA
// ========================================

function atualizarCorVida(
  barra,
  hp
) {

  barra.classList.remove(
    "hp-alto",
    "hp-medio",
    "hp-baixo",
    "hp-dano"
  );


  if (hp >= 60) {

    barra.classList.add(
      "hp-alto"
    );

  } else if (hp >= 30) {

    barra.classList.add(
      "hp-medio"
    );

  } else {

    barra.classList.add(
      "hp-baixo"
    );
  }


  void barra.offsetWidth;


  barra.classList.add(
    "hp-dano"
  );


  setTimeout(() => {

    barra.classList.remove(
      "hp-dano"
    );

  }, 180);
}


// ========================================
// ATUALIZAR HUD
// ========================================

function updateHUD() {

  for (
    const [name, fighter]
    of Object.entries(fighters)
  ) {

    const suffix =
      name === "lula"
        ? "Lula"
        : "Bolsonaro";


    const barraVida =
      document.getElementById(
        "hp" + suffix
      );


    barraVida.style.width =
      fighter.hp + "%";


    atualizarCorVida(
      barraVida,
      fighter.hp
    );


    document.getElementById(
      "text" + suffix
    ).textContent =
      fighter.hp + " HP";


    document.getElementById(
      "wins" + suffix
    ).textContent =
      fighter.wins;
  }


  document.getElementById(
    "roundNumber"
  ).textContent =
    round;
}


// ========================================
// EFEITO VISUAL DO IMPACTO
// ========================================

function showImpact(
  text,
  type = "soco"
) {

  const impact =
    document.getElementById(
      "impact"
    );


  impact.classList.remove(
    "soco-impacto",
    "combo-impacto",
    "especial-impacto"
  );


  void impact.offsetWidth;


  impact.textContent =
    text;


  impact.classList.add(
    type + "-impacto"
  );
}


function clearImpact() {

  const impact =
    document.getElementById(
      "impact"
    );


  impact.textContent = "";


  impact.classList.remove(
    "soco-impacto",
    "combo-impacto",
    "especial-impacto"
  );
}


// ========================================
// REAÇÃO AO GOLPE
// ========================================

function showHit(name) {

  fighters[name]
    .element
    .classList
    .add(
      "hit",
      "recebendo-soco"
    );
}


function clearHit(name) {

  fighters[name]
    .element
    .classList
    .remove(
      "hit",
      "recebendo-soco"
    );
}


// ========================================
// APLICAR IMPACTO
// ========================================

function aplicarImpacto(
  opponentName,
  damage,
  type
) {

  const opponent =
    fighters[opponentName];


  opponent.hp =
    Math.max(
      0,
      opponent.hp - damage
    );


  playSound("soco");


  showHit(
    opponentName
  );


  showImpact(
    "-" + damage,
    type
  );


  updateHUD();
}
// ========================================
// ENERGIA DO ESPECIAL
// ========================================

function getSpecialEnergy() {

  let energy =
    document.getElementById(
      "energiaEspecial"
    );


  if (!energy) {

    energy =
      document.createElement(
        "div"
      );

    energy.id =
      "energiaEspecial";

    energy.className =
      "energia-especial";

    document
      .querySelector(".arena")
      .appendChild(energy);
  }


  return energy;
}


// ========================================
// DISPARAR ESPECIAL
// ========================================

async function dispararEspecial(name) {

  const energy =
    getSpecialEnergy();

  const arena =
    document.querySelector(
      ".arena"
    );

  const source =
    fighters[name].element;

  const target =
    fighters[
      getOpponent(name)
    ].element;


  const arenaRect =
    arena.getBoundingClientRect();

  const sourceRect =
    source.getBoundingClientRect();

  const targetRect =
    target.getBoundingClientRect();


  const start =
    sourceRect.left +
    sourceRect.width / 2 -
    arenaRect.left;


  const end =
    targetRect.left +
    targetRect.width / 2 -
    arenaRect.left;


  const top =
    sourceRect.top +
    sourceRect.height * 0.48 -
    arenaRect.top;


  energy.className =
    "energia-especial " +
    name;


  energy.style.transition =
    "none";


  energy.style.left =
    start + "px";

  energy.style.top =
    top + "px";


  void energy.offsetWidth;


  energy.classList.add(
    "disparando"
  );


  energy.style.transition =
    "left 450ms linear";


  energy.style.left =
    end + "px";


  await sleep(450);


  arena.classList.add(
    "tremendo"
  );


  energy.className =
    "energia-especial";


  energy.style.transition =
    "none";


  await sleep(400);


  arena.classList.remove(
    "tremendo"
  );
}


// ========================================
// RECEBER ATAQUE
// ========================================

function attack(
  name,
  type,
  origem = "desconhecida"
) {

  if (
    !fighters[name] ||
    !attacks[type]
  ) {

    console.warn(
      "[DUELO] Ataque inválido:",
      name,
      type
    );

    return;
  }


  // Cada presente vira UMA entrada independente
  // na fila. Não executamos vários golpes juntos.
  attackQueue.push({
    name,
    type,
    origem
  });


  console.log(
    "[DUELO] Ataque recebido:",
    {
      personagem: name,
      golpe: type,
      origem: origem,
      rodada: round,
      ataquesNaFila:
        attackQueue.length,
      horario:
        new Date().toISOString()
    }
  );


  processQueue();
}


// ========================================
// PROCESSAR FILA
// ========================================

async function processQueue() {

  // Se já existe um golpe acontecendo,
  // o novo presente simplesmente aguarda.
  if (
    busy ||
    roundEnding
  ) {
    return;
  }


  const next =
    attackQueue.shift();


  if (!next) {
    return;
  }


  busy = true;


  try {

    await executeAttack(
      next.name,
      next.type
    );

  } catch (error) {

    console.error(
      "[DUELO] Erro ao executar ataque:",
      error
    );

  } finally {

    busy = false;


    if (!roundEnding) {

      // Libera um ciclo do navegador antes
      // de executar o próximo presente.
      await sleep(0);

      processQueue();
    }
  }
}


// ========================================
// EXECUTAR ATAQUE
// ========================================

async function executeAttack(
  name,
  type
) {

  const attacker =
    fighters[name];

  const opponentName =
    getOpponent(name);

  const opponent =
    fighters[opponentName];

  const move =
    attacks[type];


  if (
    attacker.hp <= 0 ||
    opponent.hp <= 0 ||
    roundEnding
  ) {
    return;
  }


  // Limpa resíduos do golpe anterior.
  clearHit(opponentName);
  clearImpact();


  attacker.element
    .classList
    .remove(
      "punch",
      "combo",
      "special",
      "soco-avancando",
      "combo-avancando",
      "especial-avancando",
      "especial-energia"
    );


  // Força o navegador a registrar a remoção
  // antes de adicionar a animação novamente.
  void attacker.element.offsetWidth;


  attacker.element
    .classList
    .add(
      "attacking",
      move.cssClass,
      move.movementClass
    );


  // ========================================
  // SOCO
  // ========================================

  if (type === "soco") {

    const animationPromise =
      playAttackAnimation(
        name,
        "soco",
        move.duration
      );


    // 3 frames em 450ms.
    // O dano acontece junto do frame final.
    await sleep(300);


    if (
      !roundEnding &&
      attacker.hp > 0 &&
      opponent.hp > 0
    ) {

      aplicarImpacto(
        opponentName,
        move.damage,
        "soco"
      );
    }


    await sleep(150);


    clearHit(
      opponentName
    );

    clearImpact();


    // Não libera o próximo presente
    // até a animação terminar.
    await animationPromise;
  }


  // ========================================
  // COMBO
  // ========================================

  else if (type === "combo") {

    const animationPromise =
      playAttackAnimation(
        name,
        "combo",
        move.duration
      );


    // 20 de dano total:
    // 4 impactos de 5.
    const danoPorImpacto =
      move.damage / 4;


    for (
      let i = 0;
      i < 4;
      i++
    ) {

      await sleep(250);


      if (
        roundEnding ||
        attacker.hp <= 0 ||
        opponent.hp <= 0
      ) {
        break;
      }


      aplicarImpacto(
        opponentName,
        danoPorImpacto,
        "combo"
      );


      await sleep(75);


      clearHit(
        opponentName
      );

      clearImpact();


      if (
        opponent.hp <= 0
      ) {
        break;
      }
    }


    // Mesmo que os quatro impactos já tenham
    // ocorrido, espera a animação visual acabar.
    await animationPromise;
  }


  // ========================================
  // ESPECIAL
  // ========================================

  else if (type === "especial") {

    const animationPromise =
      playAttackAnimation(
        name,
        move.animation,
        1000
      );


    // Primeiro termina a preparação visual.
    await animationPromise;


    if (
      roundEnding ||
      attacker.hp <= 0 ||
      opponent.hp <= 0
    ) {

      limparAtaque(
        name,
        opponentName,
        move
      );

      return;
    }


    attacker.element
      .classList
      .add(
        "especial-energia"
      );


    await dispararEspecial(
      name
    );


    if (
      !roundEnding &&
      attacker.hp > 0 &&
      opponent.hp > 0
    ) {

      playSound(
        "especial"
      );


      opponent.hp =
        Math.max(
          0,
          opponent.hp - move.damage
        );


      showHit(
        opponentName
      );


      showImpact(
        "💥 ESPECIAL!",
        "especial"
      );


      updateHUD();
    }


    await sleep(500);


    clearHit(
      opponentName
    );

    clearImpact();
  }


  // ========================================
  // FINALIZAR O ATAQUE
  // ========================================

  limparAtaque(
    name,
    opponentName,
    move
  );


  // ========================================
  // VERIFICAR VITÓRIA
  // ========================================

  if (
    opponent.hp <= 0 &&
    !roundEnding
  ) {

    await finishRound(
      name,
      opponentName
    );
  }
}


// ========================================
// LIMPAR ATAQUE
// ========================================

function limparAtaque(
  name,
  opponentName,
  move
) {

  const attacker =
    fighters[name];


  attacker.element
    .classList
    .remove(
      "attacking",
      move.cssClass,
      move.movementClass,
      "especial-energia"
    );


  clearHit(
    opponentName
  );

  clearImpact();


  if (
    attacker.hp > 0 &&
    !roundEnding
  ) {

    voltarParaParado(
      name
    );
  }
}
// ========================================
// FINAL DA RODADA
// ========================================

async function finishRound(
  winnerName,
  loserName
) {

  // Evita dois KOs/reset ao mesmo tempo.
  if (roundEnding) {
    return;
  }


  // Trava imediatamente o processamento
  // da fila durante o encerramento.
  roundEnding = true;


  const winner =
    fighters[winnerName];

  const loser =
    fighters[loserName];


  // Para qualquer animação anterior.
  stopAnimation(
    winnerName
  );

  stopAnimation(
    loserName
  );


  loser.element
    .classList
    .add(
      "defeated"
    );


  // Animação de KO.
  playAnimation(
    loserName,
    "ko",
    800
  );


  // Som do KO.
  playSound(
    "ko"
  );


  winner.wins++;


  updateHUD();


  document.getElementById(
    "winnerText"
  ).textContent =
    getDisplayName(
      winnerName
    ) +
    " VENCEU!";


  document.getElementById(
    "koOverlay"
  ).classList.remove(
    "hidden"
  );


  console.log(
    "[DUELO] Rodada encerrada.",
    "Ataques aguardando:",
    attackQueue.length
  );


  // Mantém a tela de vitória por 2 segundos.
  await sleep(2000);


  resetRound();
}


// ========================================
// RESET DA RODADA
// ========================================

function resetRound() {

  round++;


  for (
    const [name, fighter]
    of Object.entries(fighters)
  ) {

    fighter.hp = 100;


    stopAnimation(
      name
    );


    fighter.element
      .classList
      .remove(
        "attacking",
        "punch",
        "combo",
        "special",
        "hit",
        "recebendo-soco",
        "soco-avancando",
        "combo-avancando",
        "especial-avancando",
        "especial-energia",
        "defeated"
      );


    playAnimation(
      name,
      "parado"
    );
  }


  // Limpa possível energia do especial
  // que tenha ficado na tela.
  const energy =
    document.getElementById(
      "energiaEspecial"
    );


  if (energy) {

    energy.className =
      "energia-especial";

    energy.style.transition =
      "none";
  }


  // Esconde a tela de KO.
  document.getElementById(
    "koOverlay"
  ).classList.add(
    "hidden"
  );


  clearImpact();

  clearHit("lula");
  clearHit("bolsonaro");


  // Libera a nova rodada.
  roundEnding = false;


  updateHUD();


  console.log(
    "[DUELO] Nova rodada:",
    round,
    "Ataques aguardando:",
    attackQueue.length
  );


  // Se chegaram presentes enquanto aparecia
  // o KO, eles continuam aguardando na fila.
  processQueue();
}


// ========================================
// INICIAR O JOGO
// ========================================

checkSprites();

updateHUD();


console.log(
  "[DUELO] Jogo carregado! Teste com attack('lula', 'especial')"
);


// ========================================
// PONTE NODE.JS → DUELO DA LIVE
// ========================================

const URL_PONTE =
  "http://localhost:3001";


let consultandoPonte = false;


async function consultarPresentes() {

  if (consultandoPonte) {
    return;
  }


  consultandoPonte = true;


  try {

    const resposta =
      await fetch(
        URL_PONTE +
        "/comandos"
      );


    if (!resposta.ok) {

      throw new Error(
        "Ponte indisponível"
      );
    }


    const comandos =
      await resposta.json();


    for (
      const comando
      of comandos
    ) {

      attack(
        comando.name,
        comando.type,
        "ponte"
      );
    }

  } catch (erro) {

    // A ponte pode estar desligada.
    // Não interrompe o funcionamento do jogo.

  } finally {

    consultandoPonte = false;
  }
}


// ========================================
// IMPORTANTE
// ========================================

// DEIXE ESTA LINHA DESATIVADA.
//
// Se os presentes já estiverem chegando pelo
// TikTokService.js, ativar isso também pode
// fazer UM presente gerar DOIS golpes.
//
// setInterval(consultarPresentes, 400);