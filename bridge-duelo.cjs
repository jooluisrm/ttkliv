
const http = require("node:http");

const PORT = 3001;
const comandos = [];

const times = ["lula", "bolsonaro"];
const golpes = ["soco", "combo", "especial"];

const server = http.createServer((req, res) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:3000"
  );

  res.setHeader("Content-Type", "application/json");

  const url = new URL(req.url, "http://localhost");

  // O jogo consulta os golpes pendentes.
  if (url.pathname === "/comandos") {
    const pendentes = comandos.splice(0);

    res.end(JSON.stringify(pendentes));
    return;
  }

  // Simular um presente.
  const match = url.pathname.match(
    /^\/teste\/([^/]+)\/([^/]+)$/
  );

  if (match) {
    const [, time, golpe] = match;

    if (!times.includes(time) || !golpes.includes(golpe)) {
      res.writeHead(400);
      res.end(JSON.stringify({
        erro: "Personagem ou golpe inválido"
      }));
      return;
    }

    comandos.push({ name: time, type: golpe });

    console.log(`🎁 ${time} recebeu ${golpe}`);

    res.end(JSON.stringify({
      sucesso: true,
      time,
      golpe
    }));

    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ erro: "Rota não encontrada" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `🥊 Ponte do Duelo: http://localhost:${PORT}`
  );
});
