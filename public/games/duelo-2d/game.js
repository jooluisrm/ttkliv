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


// VOLUME DOS SONS
sounds.soco.volume = 0.65;
sounds.especial.volume = 0.8;
sounds.ko.volume = 0.3;


// Permite tocar o mesmo som várias vezes,
// importante para os golpes do combo.
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

      playAnimation(
        name,
        "parado"
      );

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
// CONTROLE DE ANIMAÇÕES
// ========================================

function stopAnimation(name) {

  clearInterval(
    animationTimers[name]
  );

  animationTimers[name] = null;

}


function playAnimation(
  name,
  action,
  duration = null
) {

  const fighter = fighters[name];


  if (
    !fighter.element.classList.contains(
      "has-sprite"
    )
  ) {

    return;

  }


  stopAnimation(name);


  const frameCount =
    animations[name][action];


  if (!frameCount) {

    return;

  }


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

      frame++;


      if (frame > frameCount) {

        if (action === "parado") {

          frame = 1;

        }

        else {

          stopAnimation(name);


          if (action === "ko") {

            fighter.sprite.src =
              spritePath(
                name,
                "ko",
                frameCount
              );

          }

          else {

            playAnimation(
              name,
              "parado"
            );

          }


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


  // VERDE
  if (hp >= 60) {

    barra.classList.add(
      "hp-alto"
    );

  }


  // AMARELO
  else if (hp >= 30) {

    barra.classList.add(
      "hp-medio"
    );

  }


  // VERMELHO
  else {

    barra.classList.add(
      "hp-baixo"
    );

  }


  // Reinicia animação
  void barra.offsetWidth;


  // Pisca ao perder vida
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


    // TAMANHO DA BARRA
    barraVida.style.width =
      fighter.hp + "%";


    // COR DA BARRA
    atualizarCorVida(
      barraVida,
      fighter.hp
    );


    // TEXTO DO HP
    document.getElementById(
      "text" + suffix
    ).textContent =
      fighter.hp + " HP";


    // VITÓRIAS
    document.getElementById(
      "wins" + suffix
    ).textContent =
      fighter.wins;

  }


  // RODADA
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
      .appendChild(
        energy
      );

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
        new Date()
          .toISOString()

    }

  );


  processQueue();

}


// ========================================
// FILA DE ATAQUES
// ========================================

async function processQueue() {

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

  }


  catch (error) {

    console.error(
      "[DUELO] Erro ao executar ataque:",
      error
    );

  }


  finally {

    busy = false;


    if (!roundEnding) {

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
    opponent.hp <= 0
  ) {

    return;

  }


  attacker.element.classList.add(
    "attacking",
    move.cssClass,
    move.movementClass
  );


  playAnimation(
    name,
    move.animation,
    move.duration
  );


  // ========================================
  // SOCO
  // ========================================

  if (type === "soco") {

    await sleep(250);


    opponent.hp =
      Math.max(
        0,
        opponent.hp - 5
      );


    // SOM DO SOCO
    playSound("soco");


    showHit(
      opponentName
    );


    showImpact(
      "-5",
      "soco"
    );


    updateHUD();


    await sleep(200);


    clearHit(
      opponentName
    );


    clearImpact();

  }


  // ========================================
  // COMBO
  // ========================================

  else if (
    type === "combo"
  ) {

    for (
      let i = 0;
      i < 4;
      i++
    ) {

      await sleep(250);


      opponent.hp =
        Math.max(
          0,
          opponent.hp - 5
        );


      // SOM EM CADA IMPACTO
      playSound("soco");


      showHit(
        opponentName
      );


      showImpact(
        "-5",
        "combo"
      );


      updateHUD();


      await sleep(75);


      clearHit(
        opponentName
      );


      clearImpact();


      if (
        opponent.hp === 0
      ) {

        break;

      }

    }

  }


  // ========================================
  // ESPECIAL
  // ========================================

  else if (
    type === "especial"
  ) {

    await sleep(1000);


    attacker.element
      .classList
      .add(
        "especial-energia"
      );


    await dispararEspecial(
      name
    );


    // SOM DO ESPECIAL
    playSound(
      "especial"
    );


    opponent.hp = 0;


    showHit(
      opponentName
    );


    showImpact(
      "💥 ESPECIAL!",
      "especial"
    );


    updateHUD();


    await sleep(500);


    clearHit(
      opponentName
    );


    clearImpact();

  }


  // ========================================
  // LIMPAR EFEITOS
  // ========================================

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


  playAnimation(
    name,
    "parado"
  );


  // ========================================
  // VERIFICAR VITÓRIA
  // ========================================

  if (
    opponent.hp === 0
  ) {

    await finishRound(
      name,
      opponentName
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

  if (
    roundEnding
  ) {

    return;

  }


  roundEnding = true;


  const winner =
    fighters[winnerName];


  const loser =
    fighters[loserName];


  stopAnimation(
    loserName
  );


  loser.element
    .classList
    .add(
      "defeated"
    );


  playAnimation(
    loserName,
    "ko",
    800
  );


  // SOM DE K.O.
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


  document.getElementById(
    "koOverlay"
  ).classList.add(
    "hidden"
  );


  clearImpact();


  roundEnding = false;


  updateHUD();


  console.log(
    "[DUELO] Nova rodada:",
    round,
    "Ataques aguardando:",
    attackQueue.length
  );


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

  if (
    consultandoPonte
  ) {

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

  }


  catch (erro) {

    // A ponte pode estar desligada.

  }


  finally {

    consultandoPonte = false;

  }

}


// IMPORTANTE:
// Deixe desativado até verificarmos se os eventos
// já estão sendo recebidos pelo TikTokService.js.
// Caso contrário, um presente pode gerar dois golpes.

// setInterval(consultarPresentes, 400);