/* ═══════════════════════════════════════════════════════════
   EstiloPet — atendimento rápido (/agendar)

   Uma pergunta por tela. No fim monta a mensagem e abre a
   conversa no WhatsApp, registrando o pedido para o painel
   exatamente como o formulário do site faz.
   ═══════════════════════════════════════════════════════════ */

const $  = (s, o = document) => o.querySelector(s);
const $$ = (s, o = document) => [...o.querySelectorAll(s)];

const menosMovimento = matchMedia("(prefers-reduced-motion: reduce)");

/* a ordem das telas é a ordem do fluxo; "inicio" e "resumo"
   ficam fora da contagem de perguntas */
const TELAS = ["inicio", "pet", "porte", "raca", "servicos", "quando", "tutor", "resumo"];
const PERGUNTAS = TELAS.filter((t) => t !== "inicio" && t !== "resumo");

const ICONES = {
  "Banho": "ico-banho",
  "Tosa na tesoura": "ico-tesoura",
  "Tosa higiênica": "ico-maquina",
  "Hidratação": "ico-gota",
  "Desembolo": "ico-escova",
  "Cuidados finais": "ico-laco"
};

const RACAS = ["Shih-tzu", "Poodle", "Lhasa Apso", "Yorkshire", "Maltês",
               "Pinscher", "Spitz Alemão", "Sem raça definida"];

const HORARIOS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
                  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
                  "15:00", "15:30", "16:00", "16:30", "17:00"];

const MEMORIA = "estilopet:ultimo-pedido";

const pedido = {
  pet: "", porte: "", raca: "", servicos: [],
  data: "", hora: "", tutor: "", obs: ""
};

let iTela = 0;

/* ── datas ─────────────────────────────────────────────── */
const iso = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

const dataBR = (s) => {
  if (!s) return "";
  const [a, m, d] = s.split("-");
  return `${d}/${m}/${a}`;
};

/* ── montagem das listas ───────────────────────────────── */
(function montarServicos() {
  $("#servicos").innerHTML = (window.CONFIG?.servicos || []).map((s) => `
    <button type="button" class="opcao opcao--servico" data-valor="${s}">
      <span class="opcao__ico" aria-hidden="true"><svg><use href="#${ICONES[s] || "ico-banho"}"/></svg></span>
      <b>${s}</b>
      <span class="opcao__marca" aria-hidden="true"><svg><use href="#ico-check"/></svg></span>
    </button>`).join("");
})();

(function montarRacas() {
  $("#racas").innerHTML = RACAS
    .map((r) => `<button type="button" class="sugestao" data-valor="${r}">${r}</button>`)
    .join("");
})();

/* No sábado a loja fecha às 14h, então os horários da tarde
   não aparecem: melhor não oferecer o que não existe. */
function montarHoras() {
  const sabado = pedido.data && new Date(pedido.data + "T12:00").getDay() === 6;
  const lista = sabado ? HORARIOS.filter((h) => h < "14:00") : HORARIOS;

  $("#horas").innerHTML =
    `<button type="button" class="hora${pedido.hora ? "" : " is-on"}" data-valor="">Tanto faz</button>` +
    lista.map((h) =>
      `<button type="button" class="hora${h === pedido.hora ? " is-on" : ""}" data-valor="${h}">${h}</button>`
    ).join("");

  // se o horário escolhido sumiu com a troca de dia, volta para o "tanto faz"
  if (pedido.hora && !lista.includes(pedido.hora)) pedido.hora = "";
}
montarHoras();

/* Os próximos sete dias. Domingo aparece fechado: é a única
   informação de horário que dá para afirmar sem inventar. */
(function montarDias() {
  const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun",
               "jul", "ago", "set", "out", "nov", "dez"];
  const agora = new Date();

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i);
    const domingo = d.getDay() === 0;
    const rotulo = i === 0 ? "Hoje" : i === 1 ? "Amanhã" : SEMANA[d.getDay()];
    return `
      <button type="button" class="dia${domingo ? " is-fechado" : ""}"
              data-valor="${iso(d)}"${domingo ? " disabled" : ""}>
        <small>${rotulo}</small>
        <b>${String(d.getDate()).padStart(2, "0")}</b>
        <i>${domingo ? "fechado" : MES[d.getMonth()]}</i>
      </button>`;
  });

  $("#dias").innerHTML = dias.join("");
})();

/* ── navegação ─────────────────────────────────────────── */
function irPara(nome, { voltando = false } = {}) {
  const destino = TELAS.indexOf(nome);
  if (destino < 0) return;

  const saindo = $(".tela.is-on");
  if (saindo) {
    saindo.classList.remove("is-on");
    saindo.classList.toggle("is-voltando", voltando);
  }

  iTela = destino;
  const entrando = $(`[data-tela="${nome}"]`);
  entrando.classList.remove("is-voltando");
  // o reflow força o navegador a enxergar o estado inicial,
  // senão ele junta as duas mudanças e a animação não roda
  void entrando.offsetWidth;
  entrando.classList.add("is-on");

  atualizarBarra();
  window.scrollTo({ top: 0, behavior: menosMovimento.matches ? "instant" : "smooth" });

  // o campo de texto já entra com o cursor dentro, menos no
  // celular: lá o teclado subindo tapa a pergunta
  const campo = $("input[type=text]", entrando);
  if (campo && !matchMedia("(max-width: 720px)").matches) {
    setTimeout(() => campo.focus({ preventScroll: true }), 380);
  }

  if (nome === "resumo") mostrarResumo();
}

function atualizarBarra() {
  const nome = TELAS[iTela];
  const n = PERGUNTAS.indexOf(nome);
  const daPergunta = n >= 0;

  $("#passo-conta").hidden = !daPergunta;
  $("#barra").hidden = !daPergunta;
  $("#voltar").disabled = iTela === 0;

  if (daPergunta) {
    $("#passo-num").textContent = n + 1;
    $("#passo-total").textContent = PERGUNTAS.length;
  }

  const feito = nome === "resumo" ? 1 : daPergunta ? n / PERGUNTAS.length : 0;
  $("#trilho").style.width = `${feito * 100}%`;
}

function seguir() {
  const nome = TELAS[iTela];
  if (!validar(nome)) return;
  irPara(TELAS[Math.min(iTela + 1, TELAS.length - 1)]);
}

function voltar() {
  irPara(TELAS[Math.max(iTela - 1, 0)], { voltando: true });
}

/* ── validação, uma tela de cada vez ───────────────────── */
function validar(nome) {
  if (nome === "pet") {
    pedido.pet = $("#pet").value.trim();
    return exigir("#erro-pet", pedido.pet, "Precisamos do nome do pet para começar.");
  }
  if (nome === "raca") {
    pedido.raca = $("#raca").value.trim();
    return true;                                  // raça é opcional
  }
  if (nome === "servicos") {
    return exigir("#erro-servicos", pedido.servicos.length, "Escolha pelo menos um serviço.");
  }
  if (nome === "tutor") {
    pedido.tutor = $("#tutor").value.trim();
    pedido.obs = $("#obs").value.trim();
    return exigir("#erro-tutor", pedido.tutor, "Como podemos te chamar?");
  }
  return true;
}

function exigir(alvo, valor, recado) {
  const caixa = $(alvo);
  if (valor) { if (caixa) caixa.textContent = ""; return true; }
  if (caixa) caixa.textContent = recado;
  return false;
}

/* ── escolhas ──────────────────────────────────────────── */
// porte: escolher já leva para a frente, sem precisar do botão
$("#portes").addEventListener("click", (e) => {
  const b = e.target.closest(".opcao");
  if (!b) return;
  $$(".opcao", $("#portes")).forEach((o) => o.classList.toggle("is-on", o === b));
  pedido.porte = b.dataset.valor;
  setTimeout(() => irPara("raca"), 320);
});

// serviços: liga e desliga, pode escolher vários
$("#servicos").addEventListener("click", (e) => {
  const b = e.target.closest(".opcao");
  if (!b) return;
  b.classList.toggle("is-on");
  pedido.servicos = $$(".opcao.is-on", $("#servicos")).map((o) => o.dataset.valor);
  if (pedido.servicos.length) $("#erro-servicos").textContent = "";
});

$("#racas").addEventListener("click", (e) => {
  const b = e.target.closest(".sugestao");
  if (!b) return;
  $("#raca").value = b.dataset.valor;
  $$(".sugestao", $("#racas")).forEach((s) => s.classList.toggle("is-on", s === b));
});
// digitar à mão desmarca a sugestão
$("#raca").addEventListener("input", () =>
  $$(".sugestao", $("#racas")).forEach((s) =>
    s.classList.toggle("is-on", s.dataset.valor === $("#raca").value.trim())));

$("#dias").addEventListener("click", (e) => {
  const b = e.target.closest(".dia");
  if (!b || b.disabled) return;
  const jaEra = b.classList.contains("is-on");
  $$(".dia", $("#dias")).forEach((d) => d.classList.remove("is-on"));
  if (jaEra) { pedido.data = ""; montarHoras(); return; }   // clicar de novo desmarca
  b.classList.add("is-on");
  pedido.data = b.dataset.valor;
  montarHoras();
});

$("#horas").addEventListener("click", (e) => {
  const b = e.target.closest(".hora");
  if (!b) return;
  $$(".hora", $("#horas")).forEach((h) => h.classList.toggle("is-on", h === b));
  pedido.hora = b.dataset.valor;
});

/* ── resumo ────────────────────────────────────────────── */
function mostrarResumo() {
  $("#resumo-tutor").textContent = pedido.tutor || "tudo certo";

  const linhas = [
    ["Pet", [pedido.pet, pedido.raca].filter(Boolean).join(" · "), "pet"],
    ["Porte", pedido.porte || "não informado", "porte"],
    ["Serviços", pedido.servicos.join(", "), "servicos"],
    ["Quando", quandoEscrito() || "a combinar", "quando"],
    ["Tutor", pedido.tutor, "tutor"]
  ];
  if (pedido.obs) linhas.push(["Observação", pedido.obs, "tutor"]);

  $("#ficha").innerHTML = linhas.map(([k, v, tela]) => `
    <li>
      <span class="ficha__k">${k}</span>
      <span class="ficha__v">${escapar(v)}</span>
      <button type="button" class="ficha__editar" data-editar="${tela}">mudar</button>
    </li>`).join("");

  soltarPatas();
}

const quandoEscrito = () =>
  [dataBR(pedido.data), pedido.hora && `às ${pedido.hora}`].filter(Boolean).join(" ");

const escapar = (t) => String(t).replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("#ficha").addEventListener("click", (e) => {
  const b = e.target.closest("[data-editar]");
  if (b) irPara(b.dataset.editar, { voltando: true });
});

/* patinhas saltando do selo verde, uma vez só */
function soltarPatas() {
  if (menosMovimento.matches) return;
  const caixa = $(".pronto__patas");
  caixa.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
    const dist = 62 + Math.random() * 34;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = '<use href="#paw"/>';
    svg.style.setProperty("--x", `${Math.cos(ang) * dist}px`);
    svg.style.setProperty("--y", `${Math.sin(ang) * dist}px`);
    svg.style.setProperty("--r", `${Math.random() * 120 - 60}deg`);
    svg.style.animationDelay = `${0.18 + i * 0.035}s`;
    caixa.appendChild(svg);
  }
}

/* ── mensagem e envio ──────────────────────────────────── */
function montarMensagem() {
  const linhas = ["Olá, EstiloPet! Quero agendar um horário 🐾", ""];
  if (pedido.tutor) linhas.push(`Tutor: ${pedido.tutor}`);

  const detalhes = [pedido.raca, pedido.porte && `porte ${pedido.porte.toLowerCase()}`].filter(Boolean);
  linhas.push(`Pet: ${pedido.pet}${detalhes.length ? ` (${detalhes.join(", ")})` : ""}`);

  if (pedido.servicos.length) linhas.push(`Serviços: ${pedido.servicos.join(", ")}`);
  const quando = quandoEscrito();
  if (quando) linhas.push(`Quando: ${quando}`);
  if (pedido.obs) linhas.push(`Observações: ${pedido.obs}`);

  return linhas.join("\n");
}

$("#enviar").addEventListener("click", async () => {
  const texto = montarMensagem();

  // o WhatsApp abre primeiro: se demorar, o navegador entende
  // que a aba não veio de um clique e bloqueia
  window.open(
    `https://wa.me/${window.CONFIG?.whatsapp}?text=${encodeURIComponent(texto)}`,
    "_blank", "noopener"
  );

  guardarUltimo();

  await window.Dados?.registrar({
    origem: "site",
    data: pedido.data || window.Dados.hoje(),
    hora: pedido.hora,
    tutor: pedido.tutor,
    pet: pedido.pet,
    raca: pedido.raca,
    porte: pedido.porte,
    servicos: pedido.servicos,
    obs: pedido.obs
  });
});

/* ── o atalho de quem já veio ──────────────────────────── */
function guardarUltimo() {
  try {
    localStorage.setItem(MEMORIA, JSON.stringify({
      pet: pedido.pet, porte: pedido.porte, raca: pedido.raca,
      servicos: pedido.servicos, tutor: pedido.tutor
    }));
  } catch {}
}

(function oferecerUltimo() {
  let u;
  try { u = JSON.parse(localStorage.getItem(MEMORIA) || "null"); } catch { return; }
  if (!u || !u.pet) return;

  $("#atalho-pet").textContent = u.pet;
  $("#atalho-det").textContent =
    [u.raca, (u.servicos || []).join(", ")].filter(Boolean).join(" · ") || "mesmo de sempre";
  $("#atalho").hidden = false;

  $("#atalho-btn").addEventListener("click", () => {
    Object.assign(pedido, {
      pet: u.pet, porte: u.porte || "", raca: u.raca || "",
      servicos: [...(u.servicos || [])], tutor: u.tutor || ""
    });

    $("#pet").value = pedido.pet;
    $("#raca").value = pedido.raca;
    $("#tutor").value = pedido.tutor;
    $$(".opcao", $("#portes")).forEach((o) =>
      o.classList.toggle("is-on", o.dataset.valor === pedido.porte));
    $$(".opcao", $("#servicos")).forEach((o) =>
      o.classList.toggle("is-on", pedido.servicos.includes(o.dataset.valor)));
    $$(".sugestao", $("#racas")).forEach((s) =>
      s.classList.toggle("is-on", s.dataset.valor === pedido.raca));

    // falta só escolher o dia: é o que muda de uma vez para a outra
    irPara("quando");
  });
})();

/* ── botões gerais ─────────────────────────────────────── */
$$("[data-vai]").forEach((b) => b.addEventListener("click", () => irPara(b.dataset.vai)));

// "não sei a raça" segue em frente sem raça nenhuma
$("#sem-raca").addEventListener("click", () => {
  pedido.raca = "";
  $("#raca").value = "";
  $$(".sugestao", $("#racas")).forEach((s) => s.classList.remove("is-on"));
  irPara("servicos");
});

$("#seguir").addEventListener("click", seguir);
$("#voltar").addEventListener("click", voltar);

$("#recomecar").addEventListener("click", () => {
  Object.assign(pedido, { pet: "", porte: "", raca: "", servicos: [], data: "", hora: "", tutor: "", obs: "" });
  $$("input, textarea").forEach((c) => (c.value = ""));
  $$(".opcao.is-on, .sugestao.is-on, .dia.is-on").forEach((o) => o.classList.remove("is-on"));
  montarHoras();
  irPara("inicio", { voltando: true });
});

// Enter avança; nas caixas de texto ele vale como "continuar"
addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.target.tagName === "TEXTAREA") return;
  const nome = TELAS[iTela];
  if (nome === "inicio") { irPara("pet"); return; }
  if (nome === "resumo") return;
  e.preventDefault();
  seguir();
});

window.Dados?.esvaziarFila();
atualizarBarra();
