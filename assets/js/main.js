/* ═══════════════════════════════════════════════════════════
   EstiloPet — interações do site
   ═══════════════════════════════════════════════════════════ */

/* A configuração do negócio fica em assets/js/config.js */

document.documentElement.classList.add("js");

const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

const waLink = (msg) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

/* ── links diretos de WhatsApp ─────────────────────────── */
$$("[data-wa]").forEach((el) => {
  el.href = waLink(el.dataset.waMsg || "Olá, EstiloPet! Vim pelo site de vocês 🐾");
  el.target = "_blank";
  el.rel = "noopener";
  if (el.hasAttribute("data-wa-text")) el.textContent = CONFIG.whatsappVisivel;
});

const mapa = $("#link-mapa");
if (mapa) {
  const endereco = $("#endereco")?.innerText.trim().replace(/\s+/g, " ") || CONFIG.endereco;
  mapa.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

$("#ano").textContent = new Date().getFullYear();

/* ── menu mobile ───────────────────────────────────────── */
const burger = $("#burger");
const menu = $("#menu-mobile");

const fecharMenu = () => {
  menu.hidden = true;
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Abrir menu");
};

burger.addEventListener("click", () => {
  const aberto = burger.getAttribute("aria-expanded") === "true";
  if (aberto) return fecharMenu();
  menu.hidden = false;
  burger.setAttribute("aria-expanded", "true");
  burger.setAttribute("aria-label", "Fechar menu");
});

$$("a", menu).forEach((a) => a.addEventListener("click", fecharMenu));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
    fecharMenu();
    burger.focus();
  }
});

/* ── barra fixa, progresso e botão flutuante ───────────── */
const nav = $("#nav");
const fab = $(".fab");
const progresso = $("#progresso");

// medir a página a cada evento de scroll trava a rolagem: mede uma vez e guarda
let alturaRolavel = 0;
const medir = () => {
  alturaRolavel = document.documentElement.scrollHeight - innerHeight;
};

let agendado = false;
const aoRolar = () => {
  const y = scrollY;
  nav.classList.toggle("is-stuck", y > 20);
  fab.classList.toggle("is-on", y > 620);
  progresso.style.transform =
    `scaleX(${alturaRolavel > 0 ? Math.min(y / alturaRolavel, 1) : 0})`;
  agendado = false;
};

// um quadro por vez, no ritmo da tela
addEventListener("scroll", () => {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(aoRolar);
}, { passive: true });

addEventListener("resize", () => { medir(); aoRolar(); }, { passive: true });
addEventListener("load", medir);
medir();
aoRolar();

/* ── revelação no scroll, com escadinha por grupo ──────── */
const reveals = $$(".reveal");
reveals.forEach((el) => {
  const irmaos = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  const i = irmaos.indexOf(el);
  if (irmaos.length > 1 && i > 0) el.style.setProperty("--d", `${Math.min(i, 5) * 95}ms`);
});

// o rodapé não é .reveal, mas precisa saber quando entrou (patinhas de fundo)
const observados = [...reveals, ...$$(".rodape")];

if ("IntersectionObserver" in window) {
  // avisa o navegador um pouco antes, para ele preparar a camada
  const prepara = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("vai-animar");
          prepara.unobserve(e.target);
        }
      });
    },
    { rootMargin: "300px 0px 300px 0px" }
  );

  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        obs.unobserve(e.target);
        // solta a camada assim que a animação termina
        setTimeout(() => e.target.classList.remove("vai-animar"), 1400);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );

  observados.forEach((el) => { prepara.observe(el); obs.observe(el); });
} else {
  observados.forEach((el) => el.classList.add("is-in"));
}

/* ── rolagem suave própria ─────────────────────────────
   O scroll-behavior nativo varia muito de navegador para navegador.
   Aqui a curva é sempre a mesma e já desconta a altura do cabeçalho.  */
const querMenosMovimento = matchMedia("(prefers-reduced-motion: reduce)");
let rolagemEmAndamento = null;

const suavizar = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rolarAte(destino, aoTerminar) {
  const alvo = Math.max(
    0,
    Math.min(destino, document.documentElement.scrollHeight - innerHeight)
  );

  if (querMenosMovimento.matches) {
    scrollTo({ top: alvo, behavior: "instant" });
    aoTerminar?.();
    return;
  }

  cancelAnimationFrame(rolagemEmAndamento);
  deslizando = false;
  posAtual = scrollY;
  const inicio = scrollY;
  const distancia = alvo - inicio;
  if (Math.abs(distancia) < 2) return aoTerminar?.();

  // percursos longos levam um pouco mais de tempo, mas com teto
  const duracao = Math.min(1100, 420 + Math.abs(distancia) * 0.35);
  const t0 = performance.now();

  const passo = (agora) => {
    const t = Math.min((agora - t0) / duracao, 1);
    scrollTo({ top: inicio + distancia * suavizar(t), behavior: "instant" });
    if (t < 1) rolagemEmAndamento = requestAnimationFrame(passo);
    else { alvoY = posAtual = scrollY; deslizando = false; aoTerminar?.(); }
  };
  rolagemEmAndamento = requestAnimationFrame(passo);
}

/* ── rolagem da roda com inércia ───────────────────────
   O navegador rola de um jeito "picado", em saltos. Aqui a
   roda só move um alvo, e a página persegue esse alvo quadro
   a quadro — o que dá o deslize contínuo.

   Fica de fora: quem pediu menos movimento, telas de toque
   (que já têm inércia própria), o zoom com Ctrl e qualquer
   área que tenha barra de rolagem própria.               */
const ehTelaDeToque = matchMedia("(pointer: coarse)").matches;
let alvoY = scrollY;
let posAtual = scrollY;   // posição contínua nossa: o scrollY do navegador é arredondado
let deslizando = false;

const limiteY = () => document.documentElement.scrollHeight - innerHeight;

function temRolagemPropria(no) {
  while (no && no !== document.body && no !== document.documentElement) {
    if (no.nodeType === 1) {
      const s = getComputedStyle(no);
      const rolaY = /auto|scroll/.test(s.overflowY) && no.scrollHeight > no.clientHeight + 1;
      const rolaX = /auto|scroll/.test(s.overflowX) && no.scrollWidth > no.clientWidth + 1;
      if (rolaY || rolaX) return true;
    }
    no = no.parentNode;
  }
  return false;
}

function deslizar() {
  posAtual += (alvoY - posAtual) * 0.14;
  if (Math.abs(alvoY - posAtual) < 0.5) { posAtual = alvoY; deslizando = false; }
  scrollTo({ top: posAtual, behavior: "instant" });
  if (deslizando) requestAnimationFrame(deslizar);
}

if (!ehTelaDeToque) {
  addEventListener("wheel", (e) => {
    if (querMenosMovimento.matches || e.ctrlKey) return;
    if (temRolagemPropria(e.target)) return;

    e.preventDefault();
    cancelAnimationFrame(rolagemEmAndamento);   // um clique em âncora perde a vez

    // o Firefox manda o movimento em linhas, não em pixels
    const passo = e.deltaMode === 1 ? e.deltaY * 16
                : e.deltaMode === 2 ? e.deltaY * innerHeight
                : e.deltaY;

    // parado: reencontra a posição real antes de começar
    if (!deslizando) { posAtual = scrollY; alvoY = scrollY; }

    alvoY = Math.max(0, Math.min(alvoY + passo, limiteY()));
    if (!deslizando) { deslizando = true; requestAnimationFrame(deslizar); }
  }, { passive: false });

  // teclado, barra de rolagem e âncoras continuam mandando: só acompanhamos
  addEventListener("scroll", () => {
    if (!deslizando) { alvoY = scrollY; posAtual = scrollY; }
  }, { passive: true });
}

// intercepta todo link de âncora da página
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const id = link.getAttribute("href");
  if (id === "#" || id.length < 2) return;

  const destino = document.querySelector(id);
  if (!destino) return;

  e.preventDefault();
  const recuo = nav.offsetHeight + 18;
  const y = destino.getBoundingClientRect().top + scrollY - recuo;

  rolarAte(y, () => {
    history.replaceState(null, "", id);
    // ao chegar no formulário, deixa o cursor pronto no primeiro campo
    if (id === "#agendar") $("#tutor")?.focus({ preventScroll: true });
    // devolve o foco ao teclado sem roubar a rolagem
    if (!destino.hasAttribute("tabindex")) destino.setAttribute("tabindex", "-1");
    destino.focus({ preventScroll: true });
  });
});

/* ── agendamento ───────────────────────────────────────── */
const form = $("#form-agendamento");
const preview = $("#preview");
const inputDia = $("#dia");

// não deixa escolher um dia que já passou
if (inputDia) {
  const hoje = new Date();
  inputDia.min = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 6e4)
    .toISOString()
    .slice(0, 10);
}

const dataBR = (iso) => {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

const lerFormulario = () => {
  const dados = new FormData(form);
  return {
    tutor: (dados.get("tutor") || "").trim(),
    pet: (dados.get("pet") || "").trim(),
    raca: (dados.get("raca") || "").trim(),
    porte: dados.get("porte") || "",
    servicos: dados.getAll("servico"),
    dia: dataBR(dados.get("dia")),
    hora: dados.get("hora") || "",
    obs: (dados.get("obs") || "").trim()
  };
};

const montarMensagem = (d) => {
  const linhas = ["Olá, EstiloPet! Vim pelo site e quero agendar um horário 🐾", ""];
  if (d.tutor) linhas.push(`Tutor: ${d.tutor}`);
  if (d.pet) {
    const detalhes = [d.raca, d.porte && `porte ${d.porte.toLowerCase()}`].filter(Boolean);
    linhas.push(`Pet: ${d.pet}${detalhes.length ? ` (${detalhes.join(", ")})` : ""}`);
  }
  if (d.servicos.length) linhas.push(`Serviços: ${d.servicos.join(", ")}`);
  if (d.dia || d.hora) {
    const quando = [d.dia, d.hora && `às ${d.hora}`].filter(Boolean).join(" ");
    linhas.push(`Quando: ${quando}`);
  }
  if (d.obs) linhas.push(`Observações: ${d.obs}`);
  return linhas.join("\n");
};

const VAZIO = "Preencha o formulário para ver a mensagem.";
const horaPreview = $("#preview-hora");

const atualizarPreview = () => {
  const d = lerFormulario();
  const preenchido = d.tutor || d.pet || d.raca || d.servicos.length || d.dia || d.hora || d.obs;
  preview.textContent = preenchido ? montarMensagem(d) : VAZIO;
  if (horaPreview) {
    // a hora do balão é a de agora: a mensagem sai neste instante
    horaPreview.textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
};

const erro = (campo, texto) => {
  const alvo = $(`[data-err="${campo}"]`, form);
  if (alvo) alvo.textContent = texto || "";
};

form.addEventListener("input", () => {
  atualizarPreview();
  ["tutor", "pet"].forEach((c) => {
    if (form.elements[c].value.trim()) erro(c, "");
  });
});

form.addEventListener("change", () => {
  atualizarPreview();
  if (new FormData(form).getAll("servico").length) erro("servico", "");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = lerFormulario();

  let primeiroErro = null;
  if (!d.tutor) { erro("tutor", "Diz seu nome pra gente."); primeiroErro ||= form.elements.tutor; }
  if (!d.pet) { erro("pet", "Qual é o nome do pet?"); primeiroErro ||= form.elements.pet; }
  if (!d.servicos.length) {
    erro("servico", "Escolha pelo menos um serviço.");
    primeiroErro ||= $('input[name="servico"]', form);
  }

  if (primeiroErro) {
    primeiroErro.focus();
    primeiroErro.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  // abre o WhatsApp primeiro: se demorar, o navegador bloqueia a aba
  window.open(waLink(montarMensagem(d)), "_blank", "noopener");

  // e registra o pedido para o painel da loja
  const iso = form.elements.dia.value;
  window.Dados?.registrar({
    origem: "site",
    data: iso || window.Dados.hoje(),
    hora: d.hora,
    tutor: d.tutor,
    pet: d.pet,
    raca: d.raca,
    porte: d.porte,
    servicos: d.servicos,
    obs: d.obs
  });

  form.reset();
  atualizarPreview();
  $(".form__note").textContent = "Pedido enviado. Se o WhatsApp não abrir, verifique o bloqueio de pop-ups.";
});

// tenta reenviar o que ficou preso por falta de conexão
window.Dados?.esvaziarFila();

atualizarPreview();


/* ── filme ao fundo do topo ────────────────────────────────
   Nada é baixado pelo HTML: o <video> nasce com preload="none"
   e sem fonte, mostrando só o pôster. O arquivo só entra em
   cena se valer a pena, e o menor deles em tela pequena.     */
(() => {
  const filme = document.getElementById("filme");
  if (!filme) return;
  const fundo = filme.parentElement;

  const rede = navigator.connection || {};
  const economia = rede.saveData === true;
  const redeLenta = /(^|-)2g$/.test(rede.effectiveType || "");
  const menosMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const telaPequena = matchMedia("(max-width: 720px)").matches;

  // o pôster também é o fundo da camada: enquanto o vídeo não
  // chega (ou quando nem vai chegar) a imagem já segura a cena
  const poster = telaPequena ? "assets/img/bgposter-sm.jpg" : "assets/img/bgposter.jpg";
  fundo.style.backgroundImage = `url("${poster}")`;
  filme.poster = poster;

  // em qualquer um desses casos o pôster já conta a história
  if (economia || redeLenta || menosMovimento) return;

  // MP4 primeiro: é o menor e o que roda em todo navegador de verdade.
  // O WebM existe para builds sem H.264 (Chromium e Firefox de algumas
  // distribuições Linux), que senão ficariam só no pôster.
  const base = telaPequena ? "assets/video/bg-sm" : "assets/video/bg";
  [["mp4", "video/mp4"], ["webm", "video/webm"]].forEach(([ext, tipo]) => {
    const fonte = document.createElement("source");
    fonte.src = `${base}.${ext}`;
    fonte.type = tipo;
    filme.appendChild(fonte);
  });
  filme.preload = "auto";

  const tocar = () => filme.play().catch(() => {});   // se o navegador barrar, fica o pôster
  filme.addEventListener("canplay", () => { filme.classList.add("is-pronto"); tocar(); }, { once: true });
  filme.load();

  // fora da tela, não gasta bateria
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entradas) => entradas.forEach((e) => (e.isIntersecting ? tocar() : filme.pause())),
      { threshold: 0.05 }
    ).observe(filme);
  }
})();
