// =====================================================
// DOMÍNIO DO BRASIL
// =====================================================

const META = 200;

let progressoLula = 0;
let progressoFlavio = 0;

let vitoriasLula = 0;
let vitoriasFlavio = 0;

let rodadaEncerrada = false;


// =====================================================
// FILA DE PRESENTES
// =====================================================

const filaPresentes = [];

let processandoFila = false;


// =====================================================
// ELEMENTOS
// =====================================================

const hudLula =
  document.getElementById(
    "progressoLula"
  );

const hudFlavio =
  document.getElementById(
    "progressoFlavio"
  );

const hudVitoriasLula =
  document.getElementById(
    "vitoriasLula"
  );

const hudVitoriasFlavio =
  document.getElementById(
    "vitoriasFlavio"
  );

const camadaLula =
  document.getElementById(
    "camadaLula"
  );

const camadaFlavio =
  document.getElementById(
    "camadaFlavio"
  );

const vitoriaOverlay =
  document.getElementById(
    "vitoriaOverlay"
  );

const vitoriaTexto =
  document.getElementById(
    "vitoriaTexto"
  );


// =====================================================
// HUD
// =====================================================

function atualizarHUD() {

  hudLula.textContent =
    `${progressoLula} / ${META}%`;

  hudFlavio.textContent =
    `${progressoFlavio} / ${META}%`;

  hudVitoriasLula.textContent =
    vitoriasLula;

  hudVitoriasFlavio.textContent =
    vitoriasFlavio;
}


// =====================================================
// MAPA
// =====================================================

function atualizarMapa() {

  const total =
    progressoLula +
    progressoFlavio;


  /*
    Ninguém recebeu presente:
    mapa totalmente branco.
  */

  if (total <= 0) {

    camadaLula.style.clipPath =
      "inset(0 0 0 100%)";

    camadaFlavio.style.clipPath =
      "inset(0 100% 0 0)";

    return;
  }


  /*
    Percentual visual baseado
    na proporção entre os lados.
  */

  const dominioLula =
    (
      progressoLula /
      total
    ) * 100;


  const dominioFlavio =
    (
      progressoFlavio /
      total
    ) * 100;


  /*
    FLÁVIO
    esquerda →
  */

  const esconderDireitaFlavio =
    100 - dominioFlavio;


  camadaFlavio.style.clipPath =
    `inset(
      0
      ${esconderDireitaFlavio}%
      0
      0
    )`;


  /*
    LULA
    direita ←
  */

  const esconderEsquerdaLula =
    100 - dominioLula;


  camadaLula.style.clipPath =
    `inset(
      0
      0
      0
      ${esconderEsquerdaLula}%
    )`;


  console.log(
    `[DOMÍNIO] Lula ${dominioLula.toFixed(1)}% | Flávio ${dominioFlavio.toFixed(1)}%`
  );
}


// =====================================================
// ADICIONAR PRESENTE
// =====================================================

function adicionarPresente(
  time,
  valor,
  nome
) {

  filaPresentes.push({
    time,
    valor,
    nome
  });


  console.log(
    `[FILA] ${nome} → ${time}`,
    "Fila:",
    filaPresentes.length
  );


  processarFila();
}


// =====================================================
// PROCESSAR FILA
// =====================================================

function processarFila() {

  if (
    processandoFila ||
    rodadaEncerrada
  ) {
    return;
  }


  const proximo =
    filaPresentes.shift();


  if (!proximo) {
    return;
  }


  processandoFila = true;


  if (proximo.time === "lula") {

    avancarLula(
      proximo.valor
    );

  } else {

    avancarFlavio(
      proximo.valor
    );
  }


  processandoFila = false;


  /*
    Se a rodada não acabou,
    continua a fila.
  */

  if (!rodadaEncerrada) {

    setTimeout(
      processarFila,
      50
    );
  }
}


// =====================================================
// AVANÇO DO LULA
// =====================================================

function avancarLula(valor) {

  if (rodadaEncerrada) {
    return;
  }


  progressoLula =
    Math.min(
      progressoLula + valor,
      META
    );


  atualizarHUD();

  atualizarMapa();


  console.log(
    `[MAPA] Lula: ${progressoLula}/${META}`
  );


  verificarVitoria(
    "lula"
  );
}


// =====================================================
// AVANÇO DO FLÁVIO
// =====================================================

function avancarFlavio(valor) {

  if (rodadaEncerrada) {
    return;
  }


  progressoFlavio =
    Math.min(
      progressoFlavio + valor,
      META
    );


  atualizarHUD();

  atualizarMapa();


  console.log(
    `[MAPA] Flávio: ${progressoFlavio}/${META}`
  );


  verificarVitoria(
    "flavio"
  );
}


// =====================================================
// MOSTRAR VITÓRIA
// =====================================================

function mostrarVitoria(time) {

  vitoriaOverlay.classList.remove(
    "hidden",
    "lula",
    "flavio"
  );


  if (time === "lula") {

    vitoriaTexto.textContent =
      "O BRASIL É DO LULA!";

    vitoriaOverlay.classList.add(
      "lula"
    );

  } else {

    vitoriaTexto.textContent =
      "O BRASIL É DO FLÁVIO!";

    vitoriaOverlay.classList.add(
      "flavio"
    );
  }


  /*
    Reinicia a animação
    mesmo em vitórias seguidas.
  */

  vitoriaTexto.style.animation =
    "none";


  void vitoriaTexto.offsetWidth;


  vitoriaTexto.style.animation =
    "";
}


// =====================================================
// ESCONDER VITÓRIA
// =====================================================

function esconderVitoria() {

  vitoriaOverlay.classList.add(
    "hidden"
  );


  vitoriaOverlay.classList.remove(
    "lula",
    "flavio"
  );
}


// =====================================================
// VERIFICAR VITÓRIA
// =====================================================

function verificarVitoria(time) {

  if (rodadaEncerrada) {
    return;
  }


  const progresso =
    time === "lula"
      ? progressoLula
      : progressoFlavio;


  if (progresso < META) {
    return;
  }


  rodadaEncerrada = true;


  // =========================
  // LULA
  // =========================

  if (time === "lula") {

    progressoLula =
      META;

    vitoriasLula++;


    /*
      Domina visualmente
      o mapa inteiro.
    */

    camadaLula.style.clipPath =
      "inset(0 0 0 0)";

    camadaFlavio.style.clipPath =
      "inset(0 100% 0 0)";


    mostrarVitoria(
      "lula"
    );


    console.log(
      "[VITÓRIA] Lula conquistou o Brasil!"
    );

  }


  // =========================
  // FLÁVIO
  // =========================

  else {

    progressoFlavio =
      META;

    vitoriasFlavio++;


    /*
      Domina visualmente
      o mapa inteiro.
    */

    camadaFlavio.style.clipPath =
      "inset(0 0 0 0)";

    camadaLula.style.clipPath =
      "inset(0 0 0 100%)";


    mostrarVitoria(
      "flavio"
    );


    console.log(
      "[VITÓRIA] Flávio conquistou o Brasil!"
    );
  }


  atualizarHUD();


  console.log(
    "[FILA] Presentes guardados:",
    filaPresentes.length
  );


  /*
    Vitória permanece
    por 3 segundos.
  */

  setTimeout(
    resetarRodada,
    3000
  );
}


// =====================================================
// RESET DA RODADA
// =====================================================

function resetarRodada() {

  progressoLula = 0;

  progressoFlavio = 0;


  /*
    Esconde novamente
    os dois lados.
  */

  camadaLula.style.clipPath =
    "inset(0 0 0 100%)";


  camadaFlavio.style.clipPath =
    "inset(0 100% 0 0)";


  esconderVitoria();


  rodadaEncerrada = false;


  atualizarHUD();

  atualizarMapa();


  console.log(
    "[MAPA] Nova disputa começou!"
  );


  console.log(
    "[FILA] Presentes aguardando:",
    filaPresentes.length
  );


  /*
    Presentes que chegaram
    durante a vitória continuam.
  */

  setTimeout(
    processarFila,
    300
  );
}


// =====================================================
// PRESENTES DO LULA
// =====================================================

function presenteRose() {

  adicionarPresente(
    "lula",
    2,
    "Rose"
  );
}


function presenteDiny() {

  adicionarPresente(
    "lula",
    20,
    "Tiny Diny"
  );
}


function presenteConfetti() {

  adicionarPresente(
    "lula",
    200,
    "Confetti"
  );
}


// =====================================================
// PRESENTES DO FLÁVIO
// =====================================================

function presenteGG() {

  adicionarPresente(
    "flavio",
    2,
    "GG"
  );
}


function presenteHeart() {

  adicionarPresente(
    "flavio",
    20,
    "Heart"
  );
}


function presenteHeartMyEarth() {

  adicionarPresente(
    "flavio",
    200,
    "Heart My Earth"
  );
}


// =====================================================
// TESTES PELO CONSOLE
// =====================================================

window.avancarLula =
  avancarLula;

window.avancarFlavio =
  avancarFlavio;

window.presenteRose =
  presenteRose;

window.presenteDiny =
  presenteDiny;

window.presenteConfetti =
  presenteConfetti;

window.presenteGG =
  presenteGG;

window.presenteHeart =
  presenteHeart;

window.presenteHeartMyEarth =
  presenteHeartMyEarth;


// =====================================================
// VER FILA
// =====================================================

window.verFila = function () {

  console.table(
    filaPresentes
  );

  return filaPresentes;
};


// =====================================================
// INICIAR
// =====================================================

atualizarHUD();

atualizarMapa();

esconderVitoria();


console.log(
  "[MAPA] Domínio do Brasil carregado!"
);
// =====================================================
// PONTE DE TESTE
// =====================================================

const URL_PONTE_DOMINIO =
  "http://localhost:3001/comandos";

let consultandoPonte = false;
let ponteOnline = false;


// =====================================================
// CONSULTAR PONTE
// =====================================================

async function consultarPonteDominio() {

  // Evita duas consultas ao mesmo tempo.
  if (consultandoPonte) {
    return;
  }

  consultandoPonte = true;

  try {

    const resposta =
      await fetch(
        URL_PONTE_DOMINIO,
        {
          cache: "no-store"
        }
      );


    if (!resposta.ok) {
      throw new Error(
        `HTTP ${resposta.status}`
      );
    }


    const comandos =
      await resposta.json();


    // Mostra apenas quando a ponte
    // acabou de conectar.
    if (!ponteOnline) {

      ponteOnline = true;

      console.log(
        "[PONTE] Domínio conectada!"
      );
    }


    if (
      !Array.isArray(comandos)
    ) {
      return;
    }


    // =====================================
    // PROCESSAR COMANDOS
    // =====================================

    for (
      const comando
      of comandos
    ) {

      if (
        !comando ||
        !comando.time ||
        !Number.isFinite(
          Number(comando.valor)
        )
      ) {
        continue;
      }


      console.log(
        `[PONTE] ${comando.nome} → ` +
        `${comando.time} +${comando.valor}`
      );


      adicionarPresente(
        comando.time,
        Number(comando.valor),
        comando.nome ||
          "Presente de teste"
      );
    }

  }

  catch (erro) {

    // Não fica enchendo o console
    // de erro enquanto a ponte estiver fechada.

    if (ponteOnline) {

      console.warn(
        "[PONTE] Domínio desconectada."
      );
    }

    ponteOnline = false;

  }

  finally {

    consultandoPonte = false;

  }
}


// =====================================================
// CONSULTAR A CADA 300ms
// =====================================================

setInterval(
  consultarPonteDominio,
  300
);


// Primeira consulta imediata.
consultarPonteDominio();