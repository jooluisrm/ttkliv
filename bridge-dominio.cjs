const http = require("node:http");

const PORT = 3001;
const comandos = [];

const PRESENTES = {
  rose: {
    time: "lula",
    valor: 2,
    nome: "Rose"
  },

  diny: {
    time: "lula",
    valor: 20,
    nome: "Tiny Diny"
  },

  confetti: {
    time: "lula",
    valor: 200,
    nome: "Confetti"
  },

  gg: {
    time: "flavio",
    valor: 2,
    nome: "GG"
  },

  heart: {
    time: "flavio",
    valor: 20,
    nome: "Heart"
  },

  heartmyearth: {
    time: "flavio",
    valor: 200,
    nome: "Heart My Earth"
  }
};

const server = http.createServer((req, res) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:3000"
  );

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  const url = new URL(
    req.url,
    "http://localhost"
  );

  // O jogo busca comandos pendentes aqui
  if (url.pathname === "/comandos") {
    const pendentes = comandos.splice(0);

    res.end(
      JSON.stringify(pendentes)
    );

    return;
  }

  // Ex:
  // /teste/rose
  // /teste/confetti
  // /teste/heart

  const match =
    url.pathname.match(
      /^\/teste\/([^/]+)$/
    );

  if (match) {
    const chave =
      decodeURIComponent(match[1])
        .trim()
        .toLowerCase();

    const presente =
      PRESENTES[chave];

    if (!presente) {
      res.writeHead(400);

      res.end(
        JSON.stringify({
          erro: "Presente inválido",
          disponiveis:
            Object.keys(PRESENTES)
        })
      );

      return;
    }

    comandos.push({
      ...presente
    });

    console.log(
      `🎁 ${presente.nome} -> ${presente.time} +${presente.valor}`
    );

    res.end(
      JSON.stringify({
        sucesso: true,
        presente
      })
    );

    return;
  }

  res.writeHead(404);

  res.end(
    JSON.stringify({
      erro: "Rota não encontrada"
    })
  );
});

server.listen(
  PORT,
  "127.0.0.1",
  () => {
    console.log(
      `🇧🇷 Ponte Domínio: http://localhost:${PORT}`
    );
  }
);