// ========================================
// DOMÍNIO DO BRASIL — PRESENTES DO TIKTOK
// ========================================

// Usuário da LIVE
const TIKTOK_USERNAME = "ougusto9";


// ========================================
// PRESENTES DO DOMÍNIO
// ========================================

const PRESENTES_DOMINIO = {

  // ======================================
  // LULA
  // ======================================

  5655: {
    time: "lula",
    valor: 2,
    presente: "Rose"
  },

  6560: {
    time: "lula",
    valor: 20,
    presente: "Tiny Diny"
  },

  5585: {
    time: "lula",
    valor: 200,
    presente: "Confetti"
  },


  // ======================================
  // FLÁVIO
  // ======================================

  6064: {
    time: "flavio",
    valor: 2,
    presente: "GG"
  },

  5327: {
    time: "flavio",
    valor: 20,
    presente: "Heart"
  },

  544015: {
    time: "flavio",
    valor: 200,
    presente: "Heart My Earthling"
  }

};


// ========================================
// IDENTIFICAÇÃO DOS PRESENTES
// ========================================

function normalizarNomePresente(nome) {

  return String(nome || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}


// ========================================
// PRESENTES POR NOME
// ========================================

const PRESENTES_POR_NOME =
  Object.create(null);


for (
  const presente
  of Object.values(PRESENTES_DOMINIO)
) {

  PRESENTES_POR_NOME[
    normalizarNomePresente(
      presente.presente
    )
  ] = presente;

}


// Compatibilidade caso o TikTok retorne
// "Heart My Earth" em vez de
// "Heart My Earthling".

PRESENTES_POR_NOME[
  "heart my earth"
] = PRESENTES_DOMINIO[544015];


// ========================================
// CONTROLE DAS SEQUÊNCIAS
// ========================================

// Impede que atualizações de um presente
// em sequência sejam contabilizadas
// várias vezes.

const sequencias =
  new Map();


// Impede eventos individuais duplicados.

const eventosRecebidos =
  new Map();


let ultimaLimpeza = 0;


// ========================================
// LIMPAR REGISTROS ANTIGOS
// ========================================

function limparRegistrosAntigos() {

  const agora =
    Date.now();


  // Executa limpeza no máximo
  // uma vez por minuto.

  if (
    agora - ultimaLimpeza <
    60000
  ) {
    return;
  }


  ultimaLimpeza =
    agora;


  // Remove sequências antigas.

  for (
    const [chave, estado]
    of sequencias
  ) {

    if (
      agora -
      estado.atualizadoEm >
      300000
    ) {

      sequencias.delete(
        chave
      );
    }
  }


  // Remove IDs de eventos antigos.

  for (
    const [chave, horario]
    of eventosRecebidos
  ) {

    if (
      agora - horario >
      300000
    ) {

      eventosRecebidos.delete(
        chave
      );
    }
  }
}


// ========================================
// EXECUTAR PRESENTE
// ========================================

function executarPresente(
  acao,
  quantidade
) {

  if (
    quantidade <= 0
  ) {
    return;
  }


  console.log(
    `[DOMÍNIO] ${acao.presente} ` +
    `x${quantidade} → ` +
    `${acao.time} +${acao.valor}`
  );


  /*
    Cada presente é enviado individualmente
    para a fila do game.js.

    Isso é importante porque, se alguém
    ganhar no meio de uma sequência,
    os presentes restantes continuam
    guardados para a próxima rodada.
  */

  for (
    let i = 0;
    i < quantidade;
    i++
  ) {

    if (
      typeof adicionarPresente !==
      "function"
    ) {

      console.error(
        "[DOMÍNIO] adicionarPresente() não encontrada!"
      );

      return;
    }


    adicionarPresente(
      acao.time,
      acao.valor,
      acao.presente
    );
  }
}


// ========================================
// RECEBER PRESENTE
// ========================================

function receberPresente(gift) {

  limparRegistrosAntigos();


  // ======================================
  // ID DO PRESENTE
  // ======================================

  const id =
    Number(
      gift.giftId ??
      gift.id ??
      gift.gift?.id
    );


  // ======================================
  // NOME DO PRESENTE
  // ======================================

  const nome =
    normalizarNomePresente(
      gift.giftName ??
      gift.gift?.name
    );


  // Primeiro procura pelo ID.
  // Se não encontrar, tenta pelo nome.

  const acao =
    PRESENTES_DOMINIO[id] ??
    PRESENTES_POR_NOME[nome];


  // ======================================
  // PRESENTE NÃO CONFIGURADO
  // ======================================

  if (!acao) {

    console.log(
      "[DOMÍNIO] Presente não configurado:",
      {
        id,
        nome
      }
    );

    return;
  }


  // ======================================
  // QUANTIDADE
  // ======================================

  const quantidade =
    Number(
      gift.repeatCount ??
      1
    );


  if (
    !Number.isSafeInteger(
      quantidade
    ) ||
    quantidade < 1 ||
    quantidade > 10000
  ) {

    console.error(
      "[DOMÍNIO] Quantidade inválida:",
      gift
    );

    return;
  }


  // ======================================
  // TIPO DO PRESENTE
  // ======================================

  const valorTipo =
    gift.rawGiftType ??
    gift.gift?.gift_type ??
    gift.giftType;


  const tipo =
    valorTipo != null &&
    Number.isFinite(
      Number(valorTipo)
    )
      ? Number(valorTipo)
      : null;


  // ======================================
  // ESTADO DA SEQUÊNCIA
  // ======================================

  const terminou =
    gift.repeatEnd === true ||
    gift.repeatEnd === 1 ||
    gift.repeatEnd === "1";


  const emAndamento =
    gift.repeatEnd === false ||
    gift.repeatEnd === 0 ||
    gift.repeatEnd === "0";


  // ======================================
  // USUÁRIO
  // ======================================

  const usuario =
    String(
      gift.user?.uniqueId ||
      gift.user?.userId ||
      gift.uniqueId ||
      gift.userId ||
      gift.user?.nickname ||
      "desconhecido"
    );


  // ======================================
  // GROUP ID
  // ======================================

  const grupo =
    gift.groupId ??
    gift.gift?.group_id;


  const temGrupo =
    grupo !== undefined &&
    grupo !== null &&
    String(grupo) !== "";


  // ======================================
  // CHAVE DA SEQUÊNCIA
  // ======================================

  const chave =
    temGrupo

      ? `grupo:${usuario}:${id}:${grupo}`

      : `alternativa:${usuario}:${id}`;


  let estado =
    sequencias.get(
      chave
    );


  // ======================================
  // É PRESENTE EM SEQUÊNCIA?
  // ======================================

  const ehSequencia =
    tipo === 1 ||
    (
      tipo === null &&
      (
        emAndamento ||
        Boolean(estado)
      )
    );


  // ========================================
  // PRESENTES EM SEQUÊNCIA
  // ========================================

  if (ehSequencia) {

    /*
      Sem groupId, uma nova atualização
      depois do fim representa uma nova
      sequência.
    */

    if (
      estado?.terminou &&
      !temGrupo &&
      emAndamento
    ) {

      sequencias.delete(
        chave
      );

      estado =
        undefined;
    }


    // ======================================
    // CRIAR SEQUÊNCIA
    // ======================================

    if (!estado) {

      estado = {

        contabilizados: 0,

        terminou: false,

        atualizadoEm:
          Date.now()

      };


      sequencias.set(
        chave,
        estado
      );
    }


    // ======================================
    // EVENTO FINAL DUPLICADO
    // ======================================

    if (
      estado.terminou
    ) {

      console.log(
        "[DOMÍNIO] Evento final repetido ignorado:",
        acao.presente
      );

      return;
    }


    // ======================================
    // EVENTO FORA DE ORDEM
    // ======================================

    if (
      quantidade <
      estado.contabilizados
    ) {

      console.warn(
        "[DOMÍNIO] Contagem fora de ordem:",
        quantidade
      );

      return;
    }


    // ======================================
    // CALCULAR SOMENTE NOVOS PRESENTES
    // ======================================

    const novos =
      quantidade -
      estado.contabilizados;


    estado.contabilizados =
      quantidade;


    estado.terminou =
      terminou;


    estado.atualizadoEm =
      Date.now();


    executarPresente(
      acao,
      novos
    );


    return;
  }


  // ========================================
  // PRESENTES NÃO SEQUENCIAIS
  // ========================================

  const eventId =
    gift.eventId ??
    gift.msgId;


  if (
    eventId !== undefined &&
    eventId !== null
  ) {

    const chaveEvento =
      `${usuario}:${id}:${eventId}`;


    // Evento já recebido.

    if (
      eventosRecebidos.has(
        chaveEvento
      )
    ) {

      console.log(
        "[DOMÍNIO] Evento duplicado ignorado:",
        chaveEvento
      );

      return;
    }


    eventosRecebidos.set(
      chaveEvento,
      Date.now()
    );
  }


  executarPresente(
    acao,
    quantidade
  );
}


// ========================================
// CONEXÃO COM O SERVIDOR
// ========================================

if (
  typeof io !== "function"
) {

  console.error(
    "[DOMÍNIO] Socket.IO não carregado!"
  );

}

else if (
  window.__socketDominioIniciado
) {

  console.warn(
    "[DOMÍNIO] Conexão duplicada evitada."
  );

}

else {

  window.__socketDominioIniciado =
    true;


  const socketDominio =
    io();


  // ======================================
  // SERVIDOR CONECTADO
  // ======================================

  socketDominio.on(
    "connect",
    () => {

      console.log(
        "[DOMÍNIO] Conectado ao servidor!"
      );


      socketDominio.emit(
        "join-room",
        TIKTOK_USERNAME
      );
    }
  );


  // ======================================
  // SALA
  // ======================================

  socketDominio.on(
    "room-joined",
    data => {

      console.log(
        "[DOMÍNIO] Sala:",
        data.room
      );
    }
  );


  // ======================================
  // LIVE CONECTADA
  // ======================================

  socketDominio.on(
    "tiktok_connected",
    () => {

      console.log(
        "[DOMÍNIO] LIVE conectada!"
      );
    }
  );


  // ======================================
  // PRESENTE RECEBIDO
  // ======================================

  socketDominio.on(
    "tiktok_gift",
    receberPresente
  );


  // ======================================
  // ERRO DE CONEXÃO
  // ======================================

  socketDominio.on(
    "connection-error",
    erro => {

      console.warn(
        "[DOMÍNIO] LIVE indisponível:",
        erro?.message ||
        erro
      );
    }
  );


  // ======================================
  // ERRO DO TIKTOK
  // ======================================

  socketDominio.on(
    "tiktok_error",
    erro => {

      console.warn(
        "[DOMÍNIO] TikTok:",
        erro?.message ||
        erro
      );
    }
  );


  // ======================================
  // DESCONECTADO
  // ======================================

  socketDominio.on(
    "disconnect",
    () => {

      console.log(
        "[DOMÍNIO] Servidor desconectado."
      );
    }
  );
}


// ========================================
// CARREGADO
// ========================================

console.log(
  "[DOMÍNIO] Seis presentes configurados!"
);


console.log(
  "[DOMÍNIO] Lula: Rose +2 | Tiny Diny +20 | Confetti +200"
);


console.log(
  "[DOMÍNIO] Flávio: GG +2 | Heart +20 | Heart My Earth +200"
);