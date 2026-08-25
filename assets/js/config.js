/* ═══════════════════════════════════════════════════════════
   EstiloPet — configuração única do site e do painel
   É o único arquivo que você precisa editar.
   ═══════════════════════════════════════════════════════════ */

window.CONFIG = {

  /* ── WhatsApp ──────────────────────────────────────────
     Código do país + DDD + número, só dígitos.            */
  whatsapp: "5527998923963",
  whatsappVisivel: "(27) 99892-3963",

  /* ── Endereço (usado no link do Google Maps) ───────── */
  endereco: "EstiloPet Estética Animal",

  /* ── Link de atendimento ───────────────────────────────
     A página /agendar é o formulário em forma de quiz, feita
     para mandar por WhatsApp ou pôr na bio do Instagram. Ela
     usa os mesmos serviços e o mesmo número daqui.          */

  /* ── Painel ────────────────────────────────────────────
     Senha do /painel.html. Deixe "" para entrar direto.
     Atenção: isto é só um obstáculo simples, NÃO é
     segurança de verdade. Veja o README.                  */
  senha: "estilopet",

  /* ── Ponte de dados entre o site e o painel ────────────
     ENQUANTO ESTIVER VAZIO: cada agendamento feito no site
     fica salvo apenas no navegador de quem preencheu. O
     painel só enxerga o que foi preenchido no próprio
     aparelho dele.

     COM UMA URL AQUI: todo agendamento feito no site é
     enviado para essa planilha, e o painel lê de lá — aí
     funciona de qualquer celular para o computador da loja.

     O passo a passo para criar essa URL de graça, com o
     Google Sheets, está no README (seção "Ligando o site ao
     painel"). Leva uns 5 minutos.                          */
  endpoint: "",

  /* ── Serviços oferecidos ───────────────────────────────
     Vale para o formulário do site e para o painel.       */
  servicos: [
    "Banho",
    "Tosa na tesoura",
    "Tosa higiênica",
    "Hidratação",
    "Desembolo",
    "Cuidados finais"
  ],

  /* ── Tabela de preços sugeridos, por porte ─────────────
     Usada para estimar o valor de um agendamento que
     chegou pelo site. Você pode corrigir o valor depois,
     no painel.                                             */
  precos: {
    "Pequeno": { base: 55,  servicoExtra: 18 },
    "Médio":   { base: 85,  servicoExtra: 22 },
    "Grande":  { base: 125, servicoExtra: 28 }
  }
};
