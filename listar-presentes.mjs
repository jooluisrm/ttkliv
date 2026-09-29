
import { WebcastPushConnection } from "tiktok-live-connector";

const conexao = new WebcastPushConnection("anny.fofinha4");

async function listarPresentes() {
  try {
    if (typeof conexao.getAvailableGifts !== "function") {
      console.log(
        "Sua versão do conector não possui getAvailableGifts."
      );
      return;
    }

    console.log("🎁 Buscando presentes disponíveis...");

    const presentes = await conexao.getAvailableGifts();

    const lista = presentes
      .map(presente => ({
        ID: presente.id,
        Nome: presente.name,
        Moedas: presente.diamond_count
      }))
      .sort((a, b) => a.Moedas - b.Moedas);

    const encontrados = lista.filter(presente =>
  /super\s*gg|game\s*controller|controle|joystick/i
    .test(presente.Nome)
);

console.table(encontrados);

if (encontrados.length === 0) {
  console.log("Presentes não encontrados nesta consulta.");

  console.log("Outros presentes de 100 moedas:");
  console.table(
    lista.filter(presente => presente.Moedas === 100)
  );
}

    console.log(
      `Encontrados ${lista.length} presentes no total.`
    );
  } catch (erro) {
    console.error(
      "Não foi possível consultar os presentes:",
      erro.message
    );
  }
}

listarPresentes();
