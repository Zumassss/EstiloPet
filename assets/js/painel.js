/* ═══════════════════════════════════════════════════════════
   EstiloPet — Painel interno
   Gráficos em SVG desenhado na mão, sem bibliotecas.
   Os dados vêm da camada compartilhada (assets/js/dados.js).
   ═══════════════════════════════════════════════════════════ */

const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const NS = "http://www.w3.org/2000/svg";

const PORTES = ["Pequeno", "Médio", "Grande"];
const COR_PORTE = { "Pequeno": "var(--serie-1)", "Médio": "var(--serie-2)", "Grande": "var(--serie-3)" };

const SITUACOES = {
  pendente:   { nome: "Pendente",   cor: "var(--st-pendente)" },
  confirmado: { nome: "Confirmado", cor: "var(--st-confirmado)" },
  concluido:  { nome: "Concluído",  cor: "var(--st-concluido)" },
  faltou:     { nome: "Não veio",   cor: "var(--st-faltou)" }
};
const CICLO = ["pendente", "confirmado", "concluido", "faltou"];

const VISTAS = {
  visao:   { titulo: "Visão geral",   sub: "O que passou e o que está marcado" },
  agenda:  { titulo: "Agendamentos",  sub: "Lista completa, com situação de cada um" },
  pets:    { titulo: "Pets e raças",  sub: "Quem a loja atende" },
  ajustes: { titulo: "Ajustes",       sub: "Conexão, backup e limpeza" }
};

const dinheiro = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dinheiroExato = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const dataBRCompleta = (iso) => { const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
const doIso = (iso) => { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d); };
const isoLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

const escapar = (s) => String(s ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ═══ ESTADO ══════════════════════════════════════════════ */
let dados = [];
let conexao = { estado: "desligado" };

const estado = {
  vista: "visao", dias: 30, busca: "", filtroStatus: null,
  col: "data", dir: "desc", pagina: 1, porPagina: 12
};

/* Janela do período.
   Agendamento é coisa de futuro: quem marca para semana que vem
   precisa aparecer. Então a janela vai de "N dias atrás" em diante,
   sem teto — os últimos N dias mais o que já está marcado. */
function noPeriodo(lista, dias) {
  if (!dias) return lista.slice();
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  ini.setDate(ini.getDate() - dias + 1);
  return lista.filter((a) => doIso(a.data) >= ini);
}

/* Já a comparação com o período anterior precisa de dois trechos
   fechados e do mesmo tamanho, os dois no passado. */
function noPeriodoFechado(lista, dias, deslocamento) {
  if (!dias) return [];
  const fim = new Date(); fim.setHours(23, 59, 59, 999);
  fim.setDate(fim.getDate() - dias * deslocamento);
  const ini = new Date(fim); ini.setDate(fim.getDate() - dias + 1); ini.setHours(0, 0, 0, 0);
  return lista.filter((a) => { const d = doIso(a.data); return d >= ini && d <= fim; });
}

/* ═══ MÉTRICAS ════════════════════════════════════════════ */
const chavePet = (a) => `${(a.pet || "").toLowerCase()}|${(a.tutor || "").toLowerCase()}`;

function metricas(lista) {
  const concluidos = lista.filter((a) => a.status === "concluido");
  const receita = concluidos.reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const porPet = new Map();
  lista.forEach((a) => porPet.set(chavePet(a), (porPet.get(chavePet(a)) || 0) + 1));
  return {
    total: lista.length,
    doSite: lista.filter((a) => a.origem === "site").length,
    concluidos: concluidos.length,
    receita,
    ticket: concluidos.length ? receita / concluidos.length : 0,
    pets: porPet.size,
    conversao: lista.length ? (concluidos.length / lista.length) * 100 : 0
  };
}

function contar(lista, obterChave) {
  const m = new Map();
  lista.forEach((a) => {
    const k = obterChave(a);
    (Array.isArray(k) ? k : [k]).forEach((v) => {
      if (v === undefined || v === null || v === "") return;
      m.set(v, (m.get(v) || 0) + 1);
    });
  });
  return m;
}
const ordenado = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

/* ═══ SVG ═════════════════════════════════════════════════ */
function el(tag, attrs = {}, pai) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
  if (pai) pai.appendChild(n);
  return n;
}

function novoSvg(caixa, altura, largMin = 260) {
  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 520, largMin);
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}`, role: "img" }, caixa);
  return { svg, largura, altura };
}

const semDados = (caixa, texto = "Sem dados neste período") =>
  (caixa.innerHTML = `<div class="viz__vazio">${texto}</div>`);

/* brilho reutilizável */
function defsBrilho(svg, id, cor, forca = 3) {
  const defs = el("defs", {}, svg);
  const f = el("filter", { id, x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: forca, result: "b" }, f);
  const merge = el("feMerge", {}, f);
  el("feMergeNode", { in: "b" }, merge);
  el("feMergeNode", { in: "SourceGraphic" }, merge);
  return defs;
}

/* escala com números redondos e folga mínima */
const PASSOS = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2500, 5000];
function escala(max) {
  const alvo = Math.max(max, 1);
  let melhor = null;
  for (const passo of PASSOS) {
    const linhas = Math.ceil(alvo / passo);
    if (linhas < 3 || linhas > 5) continue;
    const teto = passo * linhas;
    if (!melhor || teto < melhor.teto || (teto === melhor.teto && linhas > melhor.linhas))
      melhor = { teto, passo, linhas };
  }
  return melhor ?? { teto: alvo, linhas: 4 };
}

/* ═══ DICA ════════════════════════════════════════════════ */
const dica = $("#dica");
function mostrarDica(e, html) {
  dica.innerHTML = html;
  dica.hidden = false;
  const r = dica.getBoundingClientRect();
  let x = e.clientX + 14, y = e.clientY - r.height - 12;
  if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
  if (y < 8) y = e.clientY + 18;
  dica.style.left = `${Math.max(8, x)}px`;
  dica.style.top = `${y}px`;
}
const esconderDica = () => { dica.hidden = true; };

function ligarHover(caixa, marcas, conteudo) {
  marcas.forEach((m, i) => {
    m.classList.add("marca-viz");
    const mostrar = (e) => mostrarDica(e, conteudo(i));
    m.addEventListener("mouseenter", (e) => { caixa.classList.add("esmaece"); m.classList.add("ativo"); mostrar(e); });
    m.addEventListener("mousemove", mostrar);
    m.addEventListener("mouseleave", () => {
      caixa.classList.remove("esmaece"); m.classList.remove("ativo"); esconderDica();
    });
  });
}

/* ═══ GRÁFICO: MOVIMENTO ══════════════════════════════════ */
function graficoMovimento(caixa, lista) {
  if (!lista.length) return semDados(caixa);

  const porDia = contar(lista, (a) => a.data);
  const datas = [...porDia.keys()].sort();
  const serie = [];
  for (let d = doIso(datas[0]); d <= doIso(datas.at(-1)); d.setDate(d.getDate() + 1)) {
    const k = isoLocal(d);
    serie.push({ data: k, n: porDia.get(k) || 0 });
  }
  if (serie.length < 2) return semDados(caixa, "Poucos dias para desenhar o movimento");

  const { svg, largura, altura } = novoSvg(caixa, 258);
  const m = { t: 16, d: 14, b: 30, e: 34 };
  const L = largura - m.e - m.d, A = altura - m.t - m.b;
  const { teto, linhas } = escala(Math.max(...serie.map((p) => p.n)));
  const x = (i) => m.e + (L * i) / (serie.length - 1);
  const y = (v) => m.t + A - (A * v) / teto;

  defsBrilho(svg, "brilhoLinha", "var(--amarelo)", 2.4);
  const defs = svg.querySelector("defs");
  const grad = el("linearGradient", { id: "gradArea", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: "0%", "stop-color": "var(--amarelo)", "stop-opacity": ".34" }, grad);
  el("stop", { offset: "100%", "stop-color": "var(--amarelo)", "stop-opacity": "0" }, grad);

  for (let i = 0; i <= linhas; i++) {
    const v = (teto / linhas) * i;
    el("line", { x1: m.e, x2: m.e + L, y1: y(v), y2: y(v), class: "grade-linha" }, svg);
    el("text", { x: m.e - 8, y: y(v) + 4, "text-anchor": "end", class: "eixo" }, svg).textContent = Math.round(v);
  }

  const d = serie.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.n)}`).join("");
  el("path", { d: `${d}L${x(serie.length - 1)},${y(0)}L${x(0)},${y(0)}Z`, fill: "url(#gradArea)", class: "anima-o" }, svg);

  const linha = el("path", {
    d, fill: "none", stroke: "var(--amarelo)", "stroke-width": 2.2,
    "stroke-linejoin": "round", "stroke-linecap": "round",
    filter: "url(#brilhoLinha)", class: "linha-anim"
  }, svg);
  linha.style.setProperty("--comp", Math.ceil(linha.getTotalLength?.() || 2000));

  const larguraRotulo = 46;
  const salto = Math.max(1, Math.ceil(serie.length / Math.max(3, Math.floor(largura / 78))));
  let ultimo = -Infinity;
  serie.forEach((p, i) => {
    const fim = i === serie.length - 1;
    if (i % salto && !fim) return;
    if (x(i) - ultimo < larguraRotulo) {
      if (!fim) return;
      svg.querySelector(".eixo-x:last-of-type")?.remove();
    }
    el("text", { x: x(i), y: altura - 10, "text-anchor": "middle", class: "eixo eixo-x" }, svg).textContent = dataBR(p.data);
    ultimo = x(i);
  });

  // linha do "hoje", para separar o que já passou do que está marcado
  const hojeIso = isoLocal(new Date());
  const iHoje = serie.findIndex((p) => p.data === hojeIso);
  if (iHoje > 0 && iHoje < serie.length - 1) {
    el("line", {
      x1: x(iHoje), x2: x(iHoje), y1: m.t - 4, y2: m.t + A,
      stroke: "var(--txt-3)", "stroke-width": 1, "stroke-dasharray": "3 4", opacity: .7
    }, svg);
    el("text", {
      x: x(iHoje) + 5, y: m.t + 4, class: "eixo", style: "font-size:10px"
    }, svg).textContent = "hoje";
  }

  const guia = el("line", { y1: m.t, y2: m.t + A, stroke: "var(--borda-viva)", "stroke-width": 1, opacity: 0 }, svg);
  const ponto = el("circle", { r: 5.5, fill: "var(--amarelo)", stroke: "#0A1220", "stroke-width": 2, opacity: 0, filter: "url(#brilhoLinha)" }, svg);
  const captura = el("rect", { x: m.e, y: m.t, width: L, height: A, fill: "transparent", style: "cursor:crosshair" }, svg);

  captura.addEventListener("mousemove", (e) => {
    const cx = e.clientX - svg.getBoundingClientRect().left;
    const i = Math.max(0, Math.min(serie.length - 1, Math.round(((cx - m.e) / L) * (serie.length - 1))));
    const p = serie[i];
    guia.setAttribute("x1", x(i)); guia.setAttribute("x2", x(i)); guia.setAttribute("opacity", 1);
    ponto.setAttribute("cx", x(i)); ponto.setAttribute("cy", y(p.n)); ponto.setAttribute("opacity", 1);
    mostrarDica(e, `<b>${p.n} agendamento${p.n === 1 ? "" : "s"}</b><br><span class="dica__k">${dataBRCompleta(p.data)}</span>`);
  });
  captura.addEventListener("mouseleave", () => {
    guia.setAttribute("opacity", 0); ponto.setAttribute("opacity", 0); esconderDica();
  });

  $("#legenda-movimento").innerHTML =
    `<span class="legenda__i"><span class="legenda__c" style="background:var(--amarelo)"></span>${serie.length} dias</span>`;
}

/* ═══ FUNIL DE SITUAÇÃO ═══════════════════════════════════ */
function desenharFunil(caixa, lista) {
  if (!lista.length) return semDados(caixa);
  const total = lista.length;
  caixa.innerHTML = CICLO.map((chave) => {
    const n = lista.filter((a) => a.status === chave).length;
    const pct = total ? (n / total) * 100 : 0;
    return `
      <div class="funil__i" style="--tom:${SITUACOES[chave].cor};--fatia:${(pct / 100).toFixed(3)}">
        <span class="funil__ponto"></span>
        <span class="funil__nome">${SITUACOES[chave].nome}</span>
        <span class="funil__n">${n}<span class="funil__pct">${pct.toFixed(0)}%</span></span>
      </div>`;
  }).join("");
}

/* ═══ BARRAS HORIZONTAIS ══════════════════════════════════ */
function barrasH(caixa, itens, opcoes = {}) {
  if (!itens.length) return semDados(caixa);
  const { cor = "var(--amarelo)", rotuloLargura = 140 } = opcoes;

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 460, 260);
  const passo = 31, altura = itens.length * passo + 6;
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }, caixa);

  const rl = Math.min(rotuloLargura, largura * 0.4);
  const L = largura - rl - 46;
  const max = Math.max(...itens.map((i) => i.n));
  const marcas = [];

  itens.forEach((item, i) => {
    const g = el("g", { transform: `translate(0,${i * passo})` }, svg);
    const nome = el("text", { x: 0, y: 15, class: "rotulo" }, g);
    nome.textContent = item.nome.length > 20 ? item.nome.slice(0, 19) + "…" : item.nome;
    if (item.nome.length > 20) el("title", {}, nome).textContent = item.nome;

    el("rect", { x: rl, y: 4, width: L, height: 15, rx: 5, fill: "rgba(255,255,255,.05)" }, g);
    el("rect", {
      x: rl, y: 4, width: Math.max((item.n / max) * L, 3), height: 15, rx: 5,
      fill: cor, class: "anima-h",
      style: `animation-delay:${i * 55}ms;transform-origin:${rl}px 0`
    }, g);
    el("text", { x: largura, y: 16, "text-anchor": "end", class: "valor" }, g).textContent = item.n;
    marcas.push(g);
  });

  ligarHover(caixa, marcas, (i) =>
    `<b>${itens[i].nome}</b><br><span class="dica__k">${itens[i].dica || itens[i].n}</span>`);
}

/* ═══ BARRAS VERTICAIS ════════════════════════════════════ */
function barrasV(caixa, itens) {
  if (!itens.length || itens.every((i) => !i.n)) return semDados(caixa);

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 460, 260);
  const altura = 208;
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }, caixa);

  const m = { t: 16, d: 6, b: 28, e: 30 };
  const L = largura - m.e - m.d, A = altura - m.t - m.b;
  const { teto, linhas } = escala(Math.max(...itens.map((i) => i.n)));
  const passo = L / itens.length;
  const larg = Math.min(passo - 7, 38);
  const marcas = [];

  const defs = el("defs", {}, svg);
  const g1 = el("linearGradient", { id: "gradBarra", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: "0%", "stop-color": "var(--amarelo-2)" }, g1);
  el("stop", { offset: "100%", "stop-color": "var(--amarelo-3)" }, g1);

  for (let i = 0; i <= linhas; i++) {
    const v = (teto / linhas) * i;
    const yy = m.t + A - (A * v) / teto;
    el("line", { x1: m.e, x2: m.e + L, y1: yy, y2: yy, class: "grade-linha" }, svg);
    el("text", { x: m.e - 8, y: yy + 4, "text-anchor": "end", class: "eixo" }, svg).textContent = Math.round(v);
  }

  itens.forEach((item, i) => {
    const cx = m.e + passo * i + passo / 2;
    const h = teto ? (A * item.n) / teto : 0;
    const g = el("g", {}, svg);
    el("rect", {
      x: cx - larg / 2, y: m.t + A - h, width: larg,
      height: Math.max(h, item.n ? 3 : 0), rx: 5,
      fill: "url(#gradBarra)", class: "anima-v",
      style: `animation-delay:${i * 45}ms;transform-origin:0 ${m.t + A}px`
    }, g);
    el("text", { x: cx, y: altura - 9, "text-anchor": "middle", class: "eixo" }, svg).textContent = item.nome;
    marcas.push(g);
  });

  ligarHover(caixa, marcas, (i) =>
    `<b>${itens[i].n} agendamento${itens[i].n === 1 ? "" : "s"}</b><br><span class="dica__k">${itens[i].completo || itens[i].nome}</span>`);
}

/* ═══ ROSCA: PORTE ════════════════════════════════════════ */
function graficoPorte(caixa, lista) {
  if (!lista.length) return semDados(caixa);
  const cont = contar(lista, (a) => a.porte);
  const partes = PORTES.map((p) => ({ nome: p, n: cont.get(p) || 0 })).filter((p) => p.n);
  if (!partes.length) return semDados(caixa);
  const total = lista.length;

  caixa.textContent = "";
  const lado = Math.min(Math.max(caixa.clientWidth || 300, 230), 300);
  const svg = el("svg", { width: lado, height: lado + 52, viewBox: `0 0 ${lado} ${lado + 52}` }, caixa);

  const cx = lado / 2, cy = lado / 2, raio = lado * 0.36, grossura = lado * 0.13;
  const circ = 2 * Math.PI * raio;
  let deslocamento = 0;
  const marcas = [];

  el("circle", { cx, cy, r: raio, fill: "none", stroke: "rgba(255,255,255,.05)", "stroke-width": grossura }, svg);

  partes.forEach((p, i) => {
    const fatia = (p.n / total) * circ;
    const arco = el("circle", {
      cx, cy, r: raio, fill: "none",
      stroke: COR_PORTE[p.nome], "stroke-width": grossura,
      "stroke-dasharray": `${Math.max(fatia - 3, 1)} ${circ - Math.max(fatia - 3, 1)}`,
      "stroke-dashoffset": -deslocamento,
      "stroke-linecap": "round",
      transform: `rotate(-90 ${cx} ${cy})`,
      style: `animation:surgir .7s var(--ease) ${i * 130}ms both`
    }, svg);
    marcas.push(arco);
    deslocamento += fatia;
  });

  el("text", {
    x: cx, y: cy - 4, "text-anchor": "middle",
    style: "font-family:Archivo,system-ui;font-stretch:112%;font-size:1.9rem;font-weight:900;fill:var(--txt)"
  }, svg).textContent = total;
  el("text", {
    x: cx, y: cy + 18, "text-anchor": "middle",
    style: "font-size:.78rem;fill:var(--txt-3)"
  }, svg).textContent = "pets no período";

  // legenda com o número escrito — a cor nunca é a única pista
  let lx = 0;
  const larguras = partes.map((p) => 20 + `${p.nome} · ${p.n}`.length * 6.4);
  const totalLeg = larguras.reduce((a, b) => a + b, 0) + (partes.length - 1) * 10;
  lx = Math.max(0, (lado - totalLeg) / 2);
  partes.forEach((p, i) => {
    const g = el("g", { transform: `translate(${lx},${lado + 24})` }, svg);
    el("rect", { x: 0, y: -8, width: 9, height: 9, rx: 3, fill: COR_PORTE[p.nome] }, g);
    el("text", { x: 15, y: 0, class: "rotulo" }, g).textContent = `${p.nome} · ${p.n}`;
    lx += larguras[i] + 10;
  });

  ligarHover(caixa, marcas, (i) => {
    const p = partes[i];
    return `<b>${p.nome}</b><br><span class="dica__k">${p.n} de ${total} · ${Math.round((p.n / total) * 100)}%</span>`;
  });
}

/* ═══ RAÇA × PORTE ════════════════════════════════════════ */
function graficoRacaPorte(caixa, lista) {
  if (!lista.length) return semDados(caixa);
  const porRaca = new Map();
  lista.forEach((a) => {
    const r = a.raca?.trim() || "Não informada";
    if (!porRaca.has(r)) porRaca.set(r, { total: 0, Pequeno: 0, "Médio": 0, Grande: 0 });
    const o = porRaca.get(r);
    o.total++; o[a.porte] = (o[a.porte] || 0) + 1;
  });
  const itens = [...porRaca.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  if (!itens.length) return semDados(caixa);

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 640, 280);
  const passo = 34, altura = itens.length * passo + 6;
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }, caixa);

  const rl = Math.min(150, largura * 0.32);
  const L = largura - rl - 42;
  const max = Math.max(...itens.map(([, o]) => o.total));

  itens.forEach(([raca, o], i) => {
    const g = el("g", { transform: `translate(0,${i * passo})` }, svg);
    const nome = el("text", { x: 0, y: 17, class: "rotulo" }, g);
    nome.textContent = raca.length > 19 ? raca.slice(0, 18) + "…" : raca;
    if (raca.length > 19) el("title", {}, nome).textContent = raca;

    el("rect", { x: rl, y: 5, width: L, height: 17, rx: 5, fill: "rgba(255,255,255,.05)" }, g);

    let x = rl;
    const larguraTotal = (o.total / max) * L;
    PORTES.forEach((p, k) => {
      if (!o[p]) return;
      const w = (o[p] / o.total) * larguraTotal;
      const seg = el("rect", {
        x, y: 5, width: Math.max(w - 2, 2), height: 17, rx: 4,
        fill: COR_PORTE[p], class: "anima-h marca-viz",
        style: `animation-delay:${i * 50 + k * 30}ms;transform-origin:${x}px 0`
      }, g);
      const texto = `<b>${escapar(raca)} · ${p}</b><br><span class="dica__k">${o[p]} de ${o.total}</span>`;
      seg.addEventListener("mouseenter", (e) => { caixa.classList.add("esmaece"); seg.classList.add("ativo"); mostrarDica(e, texto); });
      seg.addEventListener("mousemove", (e) => mostrarDica(e, texto));
      seg.addEventListener("mouseleave", () => { caixa.classList.remove("esmaece"); seg.classList.remove("ativo"); esconderDica(); });
      x += w;
    });
    el("text", { x: largura, y: 18, "text-anchor": "end", class: "valor" }, g).textContent = o.total;
  });
}

/* ═══ INDICADORES ═════════════════════════════════════════ */
function animarNumero(elemento, valor, formatar) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elemento.textContent = formatar(valor); return;
  }
  const dur = 850, t0 = performance.now();
  const passo = (agora) => {
    const t = Math.min((agora - t0) / dur, 1);
    const suave = 1 - Math.pow(1 - t, 3);
    elemento.textContent = formatar(valor * suave);
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function desenharKpis(atual, fechadoAtual, anterior) {
  const m = metricas(atual);
  const mf = metricas(fechadoAtual), ma = metricas(anterior);

  const cartoes = [
    { k: "Agendamentos", v: m.total, base: mf.total, ant: ma.total, tom: "var(--amarelo)",
      fmt: (v) => Math.round(v),
      extra: m.doSite ? `${m.doSite} vindo${m.doSite === 1 ? "" : "s"} do site` : "todos lançados à mão" },
    { k: "Concluídos", v: m.concluidos, base: mf.concluidos, ant: ma.concluidos, tom: "var(--st-concluido)",
      fmt: (v) => Math.round(v), fatia: m.total ? m.concluidos / m.total : 0 },
    { k: "Faturamento", v: m.receita, base: mf.receita, ant: ma.receita, tom: "var(--st-confirmado)",
      fmt: (v) => dinheiro(v), extra: "dos atendimentos concluídos" },
    { k: "Ticket médio", v: m.ticket, base: mf.ticket, ant: ma.ticket, tom: "var(--serie-3)", fmt: (v) => dinheiro(v) },
    { k: "Pets diferentes", v: m.pets, base: mf.pets, ant: ma.pets, tom: "var(--serie-2)", fmt: (v) => Math.round(v) }
  ];

  $("#kpis").innerHTML = cartoes.map((c) => `
    <article class="kpi vidro" style="--tom:${c.tom}">
      <span class="kpi__k">${c.k}</span>
      <strong class="kpi__v" data-valor="${c.v}">0</strong>
      <span class="kpi__d" data-delta></span>
      ${c.fatia !== undefined ? `<span class="kpi__faixa"><i style="width:${(c.fatia * 100).toFixed(0)}%"></i></span>` : ""}
    </article>`).join("");

  $$("#kpis .kpi").forEach((no, i) => {
    const c = cartoes[i];
    animarNumero($(".kpi__v", no), c.v, c.fmt);

    const d = $("[data-delta]", no);
    if (estado.dias === 0 || !c.ant) {
      d.textContent = c.extra || "";
      d.className = "kpi__d";
      return;
    }
    const dif = (c.base ?? c.v) - c.ant;
    const pct = Math.round(Math.abs((dif / c.ant) * 100));
    if (!pct) { d.textContent = "estável vs período anterior"; d.className = "kpi__d"; return; }
    d.textContent = `${dif > 0 ? "▲" : "▼"} ${pct}% vs período anterior`;
    d.className = "kpi__d " + (dif > 0 ? "kpi__d--sobe" : "kpi__d--desce");
  });
}

/* ═══ DESENHO GERAL ═══════════════════════════════════════ */
function desenhar() {
  const atual = noPeriodo(dados, estado.dias);
  // o delta compara só trechos fechados no passado, para ser justo
  const fechadoAtual = noPeriodoFechado(dados, estado.dias, 0);
  const anterior = noPeriodoFechado(dados, estado.dias, 1);

  const pendentes = dados.filter((a) => a.status === "pendente").length;
  const selo = $("#selo-pendentes");
  selo.hidden = !pendentes;
  selo.textContent = pendentes;

  if (estado.vista === "visao") {
    desenharKpis(atual, fechadoAtual, anterior);
    graficoMovimento($("#viz-movimento"), atual);
    desenharFunil($("#funil"), atual);

    const porHora = new Map();
    for (let h = 8; h <= 18; h++) porHora.set(h, 0);
    atual.forEach((a) => {
      const h = parseInt((a.hora || "").slice(0, 2), 10);
      if (!isNaN(h) && porHora.has(h)) porHora.set(h, porHora.get(h) + 1);
    });
    barrasV($("#viz-horas"), [...porHora.entries()].map(([h, n]) => ({ nome: `${h}h`, n, completo: `Entre ${h}h e ${h + 1}h` })));

    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const completos = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const porSemana = new Array(7).fill(0);
    atual.forEach((a) => porSemana[doIso(a.data).getDay()]++);
    barrasV($("#viz-semana"), porSemana.map((n, i) => ({ nome: dias[i], n, completo: completos[i] })));

    barrasH($("#viz-servicos"), ordenado(contar(atual, (a) => a.servicos)).map(([nome, n]) => ({
      nome, n, dica: `${n} vez${n === 1 ? "" : "es"} no período`
    })));
  }

  if (estado.vista === "pets") {
    graficoPorte($("#viz-porte"), atual);
    barrasH($("#viz-racas"), ordenado(contar(atual, (a) => a.raca?.trim() || "Não informada")).slice(0, 10)
      .map(([nome, n]) => ({ nome, n, dica: `${n} agendamento${n === 1 ? "" : "s"} · ${((n / atual.length) * 100).toFixed(0)}% do período` })));
    graficoRacaPorte($("#viz-raca-porte"), atual);

    const porPet = new Map();
    atual.forEach((a) => {
      const k = chavePet(a);
      if (!porPet.has(k)) porPet.set(k, { nome: a.pet, raca: a.raca, tutor: a.tutor, n: 0 });
      porPet.get(k).n++;
    });
    const fieis = [...porPet.values()].filter((p) => p.n > 1).sort((a, b) => b.n - a.n).slice(0, 8);
    barrasH($("#viz-fieis"), fieis.map((p) => ({
      nome: p.nome, n: p.n,
      dica: `${p.raca || "raça não informada"}${p.tutor ? ` · tutor: ${p.tutor}` : ""} · ${p.n} visitas`
    })), { rotuloLargura: 120 });
    if (!fieis.length) semDados($("#viz-fieis"), "Nenhum pet voltou mais de uma vez neste período");
  }

  if (estado.vista === "agenda") desenharFiltros(atual), desenharTabela();
  if (estado.vista === "ajustes") desenharConexao();
}

/* ═══ FILTROS DE SITUAÇÃO ═════════════════════════════════ */
function desenharFiltros(lista) {
  const cont = contar(lista, (a) => a.status);
  $("#filtros-status").innerHTML =
    `<button class="filtro ${!estado.filtroStatus ? "is-on" : ""}" data-status="">
       Todos <span class="filtro__n">${lista.length}</span>
     </button>` +
    CICLO.map((k) => `
      <button class="filtro ${estado.filtroStatus === k ? "is-on" : ""}" data-status="${k}" style="--tom:${SITUACOES[k].cor}">
        <span class="filtro__p"></span>${SITUACOES[k].nome}
        <span class="filtro__n">${cont.get(k) || 0}</span>
      </button>`).join("");
}

/* ═══ TABELA ══════════════════════════════════════════════ */
function listaFiltrada() {
  let lista = noPeriodo(dados, estado.dias);
  if (estado.filtroStatus) lista = lista.filter((a) => a.status === estado.filtroStatus);
  const q = estado.busca.trim().toLowerCase();
  if (q) lista = lista.filter((a) =>
    [a.pet, a.tutor, a.raca, a.porte, (a.servicos || []).join(" ")].join(" ").toLowerCase().includes(q));

  const s = estado.dir === "asc" ? 1 : -1;
  return lista.sort((a, b) => {
    const c = estado.col;
    if (c === "valor") return ((Number(a.valor) || 0) - (Number(b.valor) || 0)) * s;
    if (c === "data") return ((a.data + (a.hora || "")) > (b.data + (b.hora || "")) ? 1 : -1) * s;
    return String(a[c] || "").localeCompare(String(b[c] || ""), "pt-BR") * s;
  });
}

function desenharTabela() {
  const lista = listaFiltrada();
  const paginas = Math.max(1, Math.ceil(lista.length / estado.porPagina));
  estado.pagina = Math.min(estado.pagina, paginas);
  const pagina = lista.slice((estado.pagina - 1) * estado.porPagina, estado.pagina * estado.porPagina);

  const soma = lista.filter((a) => a.status === "concluido").reduce((s, a) => s + (Number(a.valor) || 0), 0);
  $("#tabela-contagem").textContent =
    `${lista.length} agendamento${lista.length === 1 ? "" : "s"} · ${dinheiroExato(soma)} concluído${lista.length === 1 ? "" : "s"}`;

  const inicial = { "Pequeno": "p", "Médio": "m", "Grande": "g" };

  $("#corpo-tabela").innerHTML = pagina.map((a) => `
    <tr>
      <td class="tabela__quando">
        <b>${dataBRCompleta(a.data)}</b>${a.hora ? ` <span>${a.hora}</span>` : ""}
        ${a.origem === "site" ? '<span class="origem origem--site">site</span>' : ""}
      </td>
      <td class="tabela__pet">${escapar(a.pet)}</td>
      <td>${escapar(a.raca || "—")}</td>
      <td><span class="marcador marcador--${inicial[a.porte] || "p"}">${escapar(a.porte)}</span></td>
      <td class="tabela__servicos">${escapar((a.servicos || []).join(", ") || "—")}</td>
      <td>${escapar(a.tutor || "—")}</td>
      <td>
        <button class="situacao" data-ciclo="${a.id}" style="--tom:${SITUACOES[a.status].cor}"
                title="Clique para avançar a situação">${SITUACOES[a.status].nome}</button>
      </td>
      <td class="num">${a.valor ? dinheiroExato(Number(a.valor)) : "—"}</td>
      <td>
        <div class="acoes">
          <button class="acao" data-editar="${a.id}" aria-label="Editar ${escapar(a.pet)}" title="Editar">
            <svg><use href="#i-lapis"/></svg>
          </button>
          <button class="acao acao--apagar" data-apagar="${a.id}" aria-label="Apagar ${escapar(a.pet)}" title="Apagar">
            <svg><use href="#i-lixo"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join("") ||
    `<tr><td colspan="9" style="text-align:center;color:var(--txt-3);padding:2.5rem">Nenhum agendamento encontrado</td></tr>`;

  const p = $("#paginacao");
  if (paginas <= 1) { p.innerHTML = ""; return; }
  const b = [`<button class="pag" data-pag="${estado.pagina - 1}" ${estado.pagina === 1 ? "disabled" : ""}>←</button>`];
  for (let i = 1; i <= paginas; i++) {
    if (i === 1 || i === paginas || Math.abs(i - estado.pagina) <= 1)
      b.push(`<button class="pag ${i === estado.pagina ? "is-on" : ""}" data-pag="${i}">${i}</button>`);
    else if (Math.abs(i - estado.pagina) === 2) b.push(`<span style="color:var(--txt-3)">…</span>`);
  }
  b.push(`<button class="pag" data-pag="${estado.pagina + 1}" ${estado.pagina === paginas ? "disabled" : ""}>→</button>`);
  p.innerHTML = b.join("");
}

/* ═══ CONEXÃO ═════════════════════════════════════════════ */
function desenharConexao() {
  const url = window.CONFIG?.endpoint;
  const mapa = {
    desligado: {
      cor: "var(--amarelo)", titulo: "Só este aparelho",
      txt: "Nenhuma planilha ligada ainda. Os agendamentos feitos no site ficam salvos no navegador de quem preencheu, então este painel só enxerga o que foi lançado aqui. Para receber os pedidos de qualquer celular, siga a seção “Ligando o site ao painel” do README e cole a URL em <code>assets/js/config.js</code>."
    },
    ok: {
      cor: "var(--ok)", titulo: "Ligado à planilha",
      txt: `Os agendamentos feitos no site chegam aqui sozinhos.<br><code>${escapar(url || "")}</code>`
    },
    erro: {
      cor: "var(--ruim)", titulo: "Não consegui falar com a planilha",
      txt: `Confira se a URL está certa e se o app foi publicado com acesso para “qualquer pessoa”.<br><code>${escapar(url || "")}</code>`
    }
  };
  const e = mapa[conexao.estado] || mapa.desligado;
  $("#estado-conexao").innerHTML = `
    <div class="estado-linha">
      <span class="bolinha" style="background:${e.cor};box-shadow:0 0 12px 0 ${e.cor}"></span>
      <div><b>${e.titulo}</b><span>${e.txt}</span></div>
    </div>
    <div class="estado-linha">
      <span class="bolinha" style="background:var(--txt-3)"></span>
      <div><b>${dados.length} agendamento${dados.length === 1 ? "" : "s"} guardados</b>
      <span>${dados.filter((a) => a.origem === "site").length} vieram do formulário do site.</span></div>
    </div>`;
}

function atualizarSeloConexao() {
  const no = $("#conexao");
  const txt = $(".conexao__txt", no);
  no.className = "conexao";
  if (conexao.estado === "ok") { no.classList.add("is-ok"); txt.textContent = "Ligado ao site"; }
  else if (conexao.estado === "erro") { no.classList.add("is-erro"); txt.textContent = "Planilha fora do ar"; }
  else { no.classList.add("is-local"); txt.textContent = "Só neste aparelho"; }
}

/* ═══ MODAL ═══════════════════════════════════════════════ */
const modal = $("#modal");

$("#fichas-servicos").innerHTML = (window.CONFIG?.servicos || []).map((s) =>
  `<label class="ficha"><input type="checkbox" value="${escapar(s)}"><span>${escapar(s)}</span></label>`).join("");

$("#fichas-status").innerHTML = CICLO.map((k, i) =>
  `<label class="ficha ficha--status" style="--tom:${SITUACOES[k].cor}">
     <input type="radio" name="status" value="${k}" ${i === 0 ? "checked" : ""}><span>${SITUACOES[k].nome}</span>
   </label>`).join("");

function abrirModal(id) {
  const a = id ? dados.find((x) => x.id === id) : null;
  $("#modal-titulo").textContent = a ? "Editar agendamento" : "Novo agendamento";
  $("#modal-erro").textContent = "";
  $("#f-id").value = a?.id || "";
  $("#f-data").value = a?.data || Dados.hoje();
  $("#f-hora").value = a?.hora || "";
  $("#f-pet").value = a?.pet || "";
  $("#f-raca").value = a?.raca || "";
  $("#f-porte").value = a?.porte || "Pequeno";
  $("#f-tutor").value = a?.tutor || "";
  $("#f-valor").value = a?.valor || "";
  $("#f-obs").value = a?.obs || "";
  $$("#fichas-servicos input").forEach((i) => { i.checked = !!a?.servicos?.includes(i.value); });
  $$('#fichas-status input').forEach((i) => { i.checked = i.value === (a?.status || "pendente"); });
  atualizarListaRacas();
  modal.showModal();
  $("#f-pet").focus();
}

$("#btn-sugerir").addEventListener("click", () => {
  const servicos = $$("#fichas-servicos input:checked").map((i) => i.value);
  $("#f-valor").value = Dados.estimarValor($("#f-porte").value, servicos.length ? servicos : ["Banho"]);
});

$("#form-atendimento").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pet = $("#f-pet").value.trim();
  const data = $("#f-data").value;
  if (!pet) return ($("#modal-erro").textContent = "Escreva o nome do pet.", $("#f-pet").focus());
  if (!data) return ($("#modal-erro").textContent = "Escolha a data.", $("#f-data").focus());

  const anterior = dados.find((x) => x.id === $("#f-id").value);
  await Dados.registrar({
    id: $("#f-id").value || undefined,
    criadoEm: anterior?.criadoEm,
    origem: anterior?.origem || "manual",
    status: $('#fichas-status input:checked')?.value || "pendente",
    data, hora: $("#f-hora").value,
    pet, raca: $("#f-raca").value.trim(),
    porte: $("#f-porte").value,
    tutor: $("#f-tutor").value.trim(),
    valor: $("#f-valor").value === "" ? 0 : Number($("#f-valor").value),
    servicos: $$("#fichas-servicos input:checked").map((i) => i.value),
    obs: $("#f-obs").value.trim()
  });

  modal.close();
  dados = Dados.lerLocal();
  desenhar();
  avisar(anterior ? "Agendamento atualizado" : "Agendamento registrado");
});

$("#fechar-modal").addEventListener("click", () => modal.close());
$("#cancelar").addEventListener("click", () => modal.close());

function atualizarListaRacas() {
  const vistas = [...new Set(dados.map((a) => a.raca).filter(Boolean))].sort();
  const padrao = ["Shih-tzu","Poodle","Yorkshire","Sem raça definida","Lulu da Pomerânia","Maltês",
    "Pinscher","Lhasa Apso","Pug","Bulldog Francês","Schnauzer","Beagle","Cocker Spaniel",
    "Border Collie","Golden Retriever","Labrador","Pastor Alemão","Gato"];
  $("#lista-racas").innerHTML = [...new Set([...vistas, ...padrao])]
    .map((r) => `<option value="${escapar(r)}">`).join("");
}

/* ═══ AVISO ═══════════════════════════════════════════════ */
let tAviso;
function avisar(texto) {
  const a = $("#aviso");
  a.innerHTML = `<svg class="ico"><use href="#i-ok"/></svg>${escapar(texto)}`;
  a.hidden = false;
  clearTimeout(tAviso);
  tAviso = setTimeout(() => { a.hidden = true; }, 2800);
}

/* ═══ EXPORTAR / IMPORTAR ═════════════════════════════════ */
function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportarCsv() {
  const lista = listaFiltrada();
  if (!lista.length) return avisar("Nada para exportar");
  const cab = ["Data","Hora","Pet","Raça","Porte","Tutor","Serviços","Situação","Valor","Origem","Observações"];
  const c = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = lista.map((a) => [
    a.data, a.hora, a.pet, a.raca, a.porte, a.tutor,
    (a.servicos || []).join(" + "), SITUACOES[a.status].nome,
    String(a.valor ?? "").replace(".", ","), a.origem, a.obs
  ].map(c).join(";"));
  baixar(`estilopet-agendamentos-${Dados.hoje()}.csv`,
    "﻿" + [cab.map(c).join(";"), ...linhas].join("\r\n"), "text/csv;charset=utf-8");
  avisar(`${lista.length} registros exportados`);
}

function fazerBackup() {
  if (!dados.length) return avisar("Nada para salvar ainda");
  baixar(`estilopet-backup-${Dados.hoje()}.json`,
    JSON.stringify({ versao: 2, geradoEm: new Date().toISOString(), agendamentos: dados }, null, 2),
    "application/json");
  avisar("Backup baixado");
}

$("#arquivo").addEventListener("change", (e) => {
  const arq = e.target.files[0];
  if (!arq) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const lido = JSON.parse(leitor.result);
      const lista = Array.isArray(lido) ? lido : (lido.agendamentos || lido.atendimentos);
      if (!Array.isArray(lista)) throw new Error("formato");
      const existentes = new Set(dados.map((a) => a.id));
      const novos = lista.map((a) => Dados.normalizar(a)).filter((a) => a && !existentes.has(a.id));
      dados = Dados.substituirTudo([...novos, ...dados]);
      desenhar();
      avisar(`${novos.length} registros importados`);
    } catch { avisar("Arquivo inválido. Use um backup deste painel."); }
    e.target.value = "";
  };
  leitor.readAsText(arq);
});

/* ═══ DADOS DE EXEMPLO ════════════════════════════════════ */
const RACAS_EX = [
  ["Shih-tzu","Pequeno",14],["Poodle","Pequeno",12],["Yorkshire","Pequeno",10],
  ["Sem raça definida","Pequeno",8],["Sem raça definida","Médio",5],
  ["Lulu da Pomerânia","Pequeno",8],["Maltês","Pequeno",7],["Pinscher","Pequeno",6],
  ["Lhasa Apso","Pequeno",5],["Pug","Pequeno",5],["Bulldog Francês","Médio",4],
  ["Schnauzer","Médio",4],["Beagle","Médio",3],["Cocker Spaniel","Médio",3],
  ["Border Collie","Médio",3],["Golden Retriever","Grande",4],["Labrador","Grande",3],
  ["Pastor Alemão","Grande",2]
];
const NOMES = ["Mel","Thor","Nina","Bento","Luna","Simba","Amora","Zeus","Cacau","Bidu","Lola",
  "Fred","Pipoca","Max","Maya","Toby","Jade","Bob","Nala","Rex","Frida","Otto","Mimi","Duque","Bartô"];
const TUTORES = ["Maria","João","Ana","Carlos","Juliana","Pedro","Fernanda","Rafael","Camila",
  "Lucas","Patrícia","Bruno","Aline","Diego","Renata","Thiago"];

const sorteia = (a) => a[Math.floor(Math.random() * a.length)];
function sorteiaPeso(l) {
  const total = l.reduce((s, x) => s + x[2], 0);
  let r = Math.random() * total;
  for (const i of l) { r -= i[2]; if (r <= 0) return i; }
  return l[0];
}

function gerarExemplo() {
  const saida = [];
  const hoje = new Date();
  const carteira = Array.from({ length: 46 }, () => {
    const [raca, porte] = sorteiaPeso(RACAS_EX);
    return { pet: sorteia(NOMES), tutor: sorteia(TUTORES), raca, porte };
  });

  for (let volta = 95; volta >= 0; volta--) {
    const dia = new Date(hoje); dia.setDate(hoje.getDate() - volta);
    const s = dia.getDay();
    if (s === 0) continue;
    let qtd = s === 6 ? 5 + Math.floor(Math.random() * 4)
            : s === 1 ? 1 + Math.floor(Math.random() * 3)
            : 2 + Math.floor(Math.random() * 4);
    if (volta < 40 && Math.random() < 0.28) qtd++;

    for (let i = 0; i < qtd; i++) {
      const c = sorteia(carteira);
      const servicos = ["Banho"];
      if (Math.random() < 0.52) servicos.push(Math.random() < 0.6 ? "Tosa na tesoura" : "Tosa higiênica");
      if (Math.random() < 0.27) servicos.push("Hidratação");
      if (Math.random() < 0.12) servicos.push("Desembolo");
      if (Math.random() < 0.38) servicos.push("Cuidados finais");

      // quanto mais recente, maior a chance de ainda estar em aberto
      let status = "concluido";
      if (volta <= 1) status = Math.random() < 0.7 ? "pendente" : "confirmado";
      else if (volta <= 4) status = Math.random() < 0.45 ? "confirmado" : "concluido";
      else if (Math.random() < 0.06) status = "faltou";

      const manha = Math.random() < 0.55;
      const h = manha ? 8 + Math.floor(Math.random() * 4) : 13 + Math.floor(Math.random() * 5);

      saida.push(Dados.normalizar({
        data: isoLocal(dia), hora: `${String(h).padStart(2, "0")}:${sorteia(["00", "30"])}`,
        tutor: c.tutor, pet: c.pet, raca: c.raca, porte: c.porte,
        servicos, status,
        origem: Math.random() < 0.62 ? "site" : "manual",
        valor: status === "faltou" ? 0 : Dados.estimarValor(c.porte, servicos)
      }));
    }
  }
  return saida;
}

/* ═══ NAVEGAÇÃO ═══════════════════════════════════════════ */
function irPara(vista) {
  estado.vista = vista;
  $$(".menu__b").forEach((b) => b.classList.toggle("is-on", b.dataset.vista === vista));
  $$(".vista").forEach((s) => { s.hidden = s.dataset.vista !== vista || !dados.length; });
  $("#titulo-vista").textContent = VISTAS[vista].titulo;
  $("#sub-vista").textContent = VISTAS[vista].sub;
  fecharLateral();
  if (dados.length) desenhar();
}

const abrirLateral = () => { $("#lateral").classList.add("is-aberta"); $("#lateral-fundo").hidden = false; };
const fecharLateral = () => { $("#lateral").classList.remove("is-aberta"); $("#lateral-fundo").hidden = true; };

$("#abrir-menu").addEventListener("click", abrirLateral);
$("#lateral-fundo").addEventListener("click", fecharLateral);
$$(".menu__b").forEach((b) => b.addEventListener("click", () => irPara(b.dataset.vista)));

/* marcador deslizante do período */
function moverBrilhoPeriodo() {
  const ativo = $(".periodo__b.is-on");
  const brilho = $("#periodo-brilho");
  if (!ativo || !brilho) return;
  brilho.style.width = `${ativo.offsetWidth}px`;
  brilho.style.transform = `translateX(${ativo.offsetLeft - 3}px)`;
}

$$(".periodo__b").forEach((b) => b.addEventListener("click", () => {
  $$(".periodo__b").forEach((x) => x.classList.remove("is-on"));
  b.classList.add("is-on");
  estado.dias = Number(b.dataset.dias);
  estado.pagina = 1;
  moverBrilhoPeriodo();
  desenhar();
}));

/* ═══ EVENTOS ═════════════════════════════════════════════ */
let tBusca;
$("#busca").addEventListener("input", (e) => {
  clearTimeout(tBusca);
  tBusca = setTimeout(() => {
    estado.busca = e.target.value; estado.pagina = 1; desenharTabela();
  }, 180);
});

$("#filtros-status").addEventListener("click", (e) => {
  const b = e.target.closest("[data-status]");
  if (!b) return;
  estado.filtroStatus = b.dataset.status || null;
  estado.pagina = 1;
  desenharFiltros(noPeriodo(dados, estado.dias));
  desenharTabela();
});

$$(".ordenar").forEach((b) => b.addEventListener("click", () => {
  const col = b.dataset.col;
  if (estado.col === col) estado.dir = estado.dir === "asc" ? "desc" : "asc";
  else { estado.col = col; estado.dir = ["data", "valor"].includes(col) ? "desc" : "asc"; }
  $$(".ordenar").forEach((x) => x.removeAttribute("data-dir"));
  b.setAttribute("data-dir", estado.dir);
  desenharTabela();
}));

$("#corpo-tabela").addEventListener("click", async (e) => {
  const ciclo = e.target.closest("[data-ciclo]");
  const editar = e.target.closest("[data-editar]");
  const apagar = e.target.closest("[data-apagar]");

  if (ciclo) {
    const a = dados.find((x) => x.id === ciclo.dataset.ciclo);
    if (!a) return;
    const proximo = CICLO[(CICLO.indexOf(a.status) + 1) % CICLO.length];
    // ao concluir sem valor lançado, sugere pela tabela de preços
    const valor = proximo === "concluido" && !a.valor
      ? Dados.estimarValor(a.porte, a.servicos) : a.valor;
    await Dados.registrar({ ...a, status: proximo, valor });
    dados = Dados.lerLocal();
    desenharFiltros(noPeriodo(dados, estado.dias));
    desenharTabela();
    if (estado.vista === "visao") desenhar();
    avisar(`${a.pet}: ${SITUACOES[proximo].nome.toLowerCase()}`);
    return;
  }
  if (editar) return abrirModal(editar.dataset.editar);
  if (apagar) {
    const a = dados.find((x) => x.id === apagar.dataset.apagar);
    if (!a || !confirm(`Apagar o agendamento de ${a.pet} em ${dataBRCompleta(a.data)}?`)) return;
    dados = Dados.remover(a.id);
    desenhar();
    avisar("Agendamento apagado");
  }
});

$("#paginacao").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pag]");
  if (!b || b.disabled) return;
  estado.pagina = Number(b.dataset.pag);
  desenharTabela();
});

$("#btn-novo").addEventListener("click", () => abrirModal());
$("#btn-novo-2").addEventListener("click", () => abrirModal());
$("#btn-csv").addEventListener("click", exportarCsv);
$("#btn-backup").addEventListener("click", fazerBackup);
$("#btn-backup-2").addEventListener("click", fazerBackup);
$("#btn-importar").addEventListener("click", () => $("#arquivo").click());

$("#btn-exemplo").addEventListener("click", () => {
  dados = Dados.substituirTudo(gerarExemplo());
  mostrarTudo();
  avisar("Dados de exemplo carregados");
});

$("#btn-limpar").addEventListener("click", () => {
  if (!confirm("Apagar TODOS os agendamentos deste navegador?\n\nNão dá para desfazer. Faça um backup antes se quiser guardar.")) return;
  Dados.limpar();
  dados = [];
  mostrarTudo();
  avisar("Tudo apagado");
});

$("#btn-sinc").addEventListener("click", async () => {
  const b = $("#btn-sinc");
  b.classList.add("girando");
  const antes = dados.length;
  await sincronizar();
  b.classList.remove("girando");
  const novos = dados.length - antes;
  avisar(novos > 0 ? `${novos} novo${novos === 1 ? "" : "s"} agendamento${novos === 1 ? "" : "s"}`
       : conexao.estado === "desligado" ? "Nenhuma planilha ligada ainda" : "Nada novo por aqui");
});

let tTamanho;
addEventListener("resize", () => {
  clearTimeout(tTamanho);
  tTamanho = setTimeout(() => { moverBrilhoPeriodo(); if (dados.length) desenhar(); }, 220);
});

/* ═══ INÍCIO ══════════════════════════════════════════════ */
function mostrarTudo() {
  const tem = dados.length > 0;
  $("#vazio").hidden = tem;
  $$(".vista").forEach((s) => { s.hidden = !tem || s.dataset.vista !== estado.vista; });
  $("#vazio-nota").textContent = window.CONFIG?.endpoint
    ? "O painel está ligado à planilha e busca novos pedidos sozinho."
    : "Enquanto a planilha não estiver ligada (veja Ajustes), o painel só mostra o que for lançado neste aparelho.";
  atualizarListaRacas();
  atualizarSeloConexao();
  if (tem) desenhar();
  else if (estado.vista === "ajustes") desenharConexao();
}

async function sincronizar() {
  const r = await Dados.listar();
  dados = r.lista;
  conexao = { estado: r.remoto };
  atualizarSeloConexao();
  mostrarTudo();
}

async function iniciar() {
  $("#app").hidden = false;
  dados = Dados.lerLocal();
  mostrarTudo();
  moverBrilhoPeriodo();
  await sincronizar();
  // busca novos pedidos de tempos em tempos, quando há planilha ligada
  if (window.CONFIG?.endpoint) setInterval(sincronizar, 120000);
}

const DESTRAVADO = "estilopet:painel-aberto";
const senhaConfig = window.CONFIG?.senha;

if (!senhaConfig || sessionStorage.getItem(DESTRAVADO) === "1") {
  iniciar();
} else {
  $("#trava").hidden = false;
  $("#senha").focus();
  $("#form-trava").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#senha").value === senhaConfig) {
      try { sessionStorage.setItem(DESTRAVADO, "1"); } catch {}
      $("#trava").hidden = true;
      iniciar();
    } else {
      $("#trava-erro").textContent = "Senha incorreta.";
      $("#senha").select();
    }
  });
}
