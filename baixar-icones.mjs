// Execute na RAIZ de tiktok-live-games: node baixar-icones.mjs
// Consulta o catálogo que você já acessou e salva os ÍCONES REAIS dos seis presentes.
import { WebcastPushConnection } from "tiktok-live-connector";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const alvos = [
  { id: 5655,   arquivo: "rose" },
  { id: 6560,   arquivo: "tiny-diny" },
  { id: 5585,   arquivo: "confetti" },
  { id: 6064,   arquivo: "gg" },
  { id: 5327,   arquivo: "heart" },
  { id: 544015, arquivo: "heart-my-earthling" }
];

const destino = resolve("public", "games", "duelo-2d", "icones");
await mkdir(destino, { recursive: true });

const conexao = new WebcastPushConnection("anny.fofinha4");

try {
  const lista = await conexao.getAvailableGifts();
  if (!Array.isArray(lista)) throw new Error("Catálogo retornou formato inesperado.");

  for (const alvo of alvos) {
    const presente = lista.find(p => Number(p.id) === alvo.id);
    if (!presente) {
      console.warn(`[AVISO] ID ${alvo.id} não está no catálogo atual.`);
      continue;
    }

    // As versões do conector podem expor imagem ou ícone em campos distintos.
    const possiveis = [
      ...(presente.image?.url_list ?? []),
      ...(presente.icon?.url_list ?? []),
      ...(presente.image?.urlList ?? []),
      ...(presente.icon?.urlList ?? []),
      presente.image_url,
      presente.imageUrl,
      presente.icon_url,
      presente.iconUrl
    ].filter(url => typeof url === "string" && /^https?:\/\//.test(url));

    if (!possiveis.length) {
      console.warn(`[AVISO] Sem URL da imagem para ${presente.name} (ID ${alvo.id}).`);
      console.log("Campos disponíveis:", Object.keys(presente));
      continue;
    }

    let salvo = false;
    for (const url of possiveis) {
      try {
        const resposta = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(15000)
        });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const tipo = resposta.headers.get("content-type") || "";
        const ext = /webp/i.test(tipo) ? "webp"
          : /png/i.test(tipo) ? "png"
          : /jpe?g/i.test(tipo) ? "jpg"
          : /\.webp(?:\?|$)/i.test(url) ? "webp"
          : /\.jpe?g(?:\?|$)/i.test(url) ? "jpg" : "png";

        const arquivo = join(destino, `${alvo.arquivo}.${ext}`);
        await writeFile(arquivo, Buffer.from(await resposta.arrayBuffer()));
        console.log(`✅ ${presente.name} (${presente.diamond_count} moedas): ${arquivo}`);
        salvo = true;
        break;
      } catch (erro) {
        console.warn(`Tentativa de imagem falhou para ${presente.name}: ${erro.message}`);
      }
    }
    if (!salvo) console.warn(`[AVISO] Não foi possível salvar ${presente.name}.`);
  }
  console.log("Concluído. Abra http://localhost:3000/games/duelo-2d/painel.html");
} catch (erro) {
  console.error("Erro ao consultar o catálogo:", erro.message);
  process.exitCode = 1;
}
