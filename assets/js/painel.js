/* ═══════════════════════════════════════════════════════════
   EstiloPet — Painel interno
   Sem bibliotecas: os gráficos são SVG desenhado na mão.
   Os dados ficam no navegador (localStorage) deste aparelho.
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  // Senha do painel. Deixe "" para entrar direto, sem trava.
  // Atenção: isto NÃO é segurança de verdade — veja o README.
  senha: "estilopet",

  // Serviços que aparecem no formulário.
  servicos: ["Banho", "Tosa na tesoura", "Tosa higiênica", "Hidratação", "Desembolo", "Cuidados finais"],

  chave: "estilopet:atendimentos"
};

const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const NS = "http://www.w3.org/2000/svg";

const PORTES = ["Pequeno", "Médio", "Grande"];
const COR_PORTE = { "Pequeno": "var(--serie-1)", "Médio": "var(--serie-2)", "Grande": "var(--serie-3)" };

const dinheiro = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dinheiroExato = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isoLocal = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const dataBR = (iso) => { const [a,m,d] = iso.split("-"); return `${d}/${m}`; };
const dataBRCompleta = (iso) => { const [a,m,d] = iso.split("-"); return `${d}/${m}/${a}`; };
// parse sem fuso: "2026-08-20" vira 20/08 local, não 19/08
const doIso = (iso) => { const [a,m,d] = iso.split("-").map(Number); return new Date(a, m-1, d); };

/* ═══ ARMAZENAMENTO ═══════════════════════════════════════ */
let dados = [];

function carregar() {
  try {
    const bruto = localStorage.getItem(CONFIG.chave);
    dados = bruto ? JSON.parse(bruto) : [];
    if (!Array.isArray(dados)) dados = [];
  } catch { dados = []; }
}

function salvar() {
  try {
    localStorage.setItem(CONFIG.chave, JSON.stringify(dados));
  } catch {
    avisar("Não foi possível salvar. O armazenamento do navegador pode estar cheio ou bloqueado.");
  }
}

const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ═══ DADOS DE EXEMPLO ════════════════════════════════════ */
const RACAS_EXEMPLO = [
  ["Shih-tzu","Pequeno",14], ["Poodle","Pequeno",12], ["Yorkshire","Pequeno",10],
  ["Sem raça definida","Pequeno",8], ["Sem raça definida","Médio",5],
  ["Lulu da Pomerânia","Pequeno",8], ["Maltês","Pequeno",7], ["Pinscher","Pequeno",6],
  ["Lhasa Apso","Pequeno",5], ["Pug","Pequeno",5], ["Bulldog Francês","Médio",4],
  ["Schnauzer","Médio",4], ["Beagle","Médio",3], ["Cocker Spaniel","Médio",3],
  ["Border Collie","Médio",3], ["Golden Retriever","Grande",4], ["Labrador","Grande",3],
  ["Pastor Alemão","Grande",2]
];
const NOMES = ["Mel","Thor","Nina","Bento","Luna","Simba","Amora","Zeus","Cacau","Bidu",
  "Lola","Fred","Pipoca","Max","Maya","Toby","Jade","Bob","Nala","Rex","Frida","Otto",
  "Mimi","Duque","Sofia","Bartô","Lili","Apolo"];
const TUTORES = ["Maria","João","Ana","Carlos","Juliana","Pedro","Fernanda","Rafael",
  "Camila","Lucas","Patrícia","Bruno","Aline","Diego","Renata","Thiago"];

const sorteia = (a) => a[Math.floor(Math.random() * a.length)];
function sorteiaPeso(lista) {
  const total = lista.reduce((s, x) => s + x[2], 0);
  let r = Math.random() * total;
  for (const item of lista) { r -= item[2]; if (r <= 0) return item; }
  return lista[0];
}

function gerarExemplo() {
  const saida = [];
  const hoje = new Date();
  // uma carteira fixa de pets, para a taxa de retorno fazer sentido
  const carteira = Array.from({ length: 46 }, () => {
    const [raca, porte] = sorteiaPeso(RACAS_EXEMPLO);
    return { pet: sorteia(NOMES), tutor: sorteia(TUTORES), raca, porte };
  });

  for (let volta = 95; volta >= 0; volta--) {
    const dia = new Date(hoje); dia.setDate(hoje.getDate() - volta);
    const semana = dia.getDay();
    if (semana === 0) continue;                            // domingo fechado
    let qtd = semana === 6 ? 5 + Math.floor(Math.random() * 4)   // sábado cheio
            : semana === 1 ? 1 + Math.floor(Math.random() * 3)   // segunda fraca
            : 2 + Math.floor(Math.random() * 4);
    // um leve crescimento ao longo dos meses
    if (volta < 40 && Math.random() < 0.28) qtd++;

    for (let i = 0; i < qtd; i++) {
      const c = sorteia(carteira);
      const servicos = ["Banho"];
      if (Math.random() < 0.52) servicos.push(Math.random() < 0.6 ? "Tosa na tesoura" : "Tosa higiênica");
      if (Math.random() < 0.27) servicos.push("Hidratação");
      if (Math.random() < 0.12) servicos.push("Desembolo");
      if (Math.random() < 0.38) servicos.push("Cuidados finais");

      const base = c.porte === "Pequeno" ? 55 : c.porte === "Médio" ? 85 : 125;
      const extra = (servicos.length - 1) * (c.porte === "Grande" ? 28 : 18);
      const valor = Math.round((base + extra + Math.random() * 18) / 5) * 5;

      const manha = Math.random() < 0.55;
      const h = manha ? 8 + Math.floor(Math.random() * 4) : 13 + Math.floor(Math.random() * 5);
      const min = sorteia(["00", "30"]);

      saida.push({
        id: novoId(), data: isoLocal(dia), hora: `${String(h).padStart(2,"0")}:${min}`,
        tutor: c.tutor, pet: c.pet, raca: c.raca, porte: c.porte,
        servicos, valor, obs: ""
      });
    }
  }
  return saida;
}

/* ═══ ESTADO ══════════════════════════════════════════════ */
const estado = { dias: 30, busca: "", col: "data", dir: "desc", pagina: 1, porPagina: 12 };

function noPeriodo(lista, dias, deslocamento = 0) {
  if (!dias) return deslocamento ? [] : lista.slice();
  const fim = new Date(); fim.setHours(23, 59, 59, 999);
  fim.setDate(fim.getDate() - dias * deslocamento);
  const ini = new Date(fim); ini.setDate(fim.getDate() - dias + 1); ini.setHours(0, 0, 0, 0);
  return lista.filter((a) => { const d = doIso(a.data); return d >= ini && d <= fim; });
}

/* ═══ MÉTRICAS ════════════════════════════════════════════ */
const chavePet = (a) => `${(a.pet||"").toLowerCase()}|${(a.tutor||"").toLowerCase()}`;

function metricas(lista) {
  const total = lista.length;
  const receita = lista.reduce((s, a) => s + (Number(a.valor) || 0), 0);
  const porPet = new Map();
  lista.forEach((a) => porPet.set(chavePet(a), (porPet.get(chavePet(a)) || 0) + 1));
  const pets = porPet.size;
  const voltaram = [...porPet.values()].filter((n) => n >= 2).length;
  return {
    total, receita,
    ticket: total ? receita / total : 0,
    pets,
    retorno: pets ? (voltaram / pets) * 100 : 0
  };
}

function contar(lista, obterChave) {
  const m = new Map();
  lista.forEach((a) => {
    const chaves = obterChave(a);
    (Array.isArray(chaves) ? chaves : [chaves]).forEach((k) => {
      if (k === undefined || k === null || k === "") return;
      m.set(k, (m.get(k) || 0) + 1);
    });
  });
  return m;
}

const ordenado = (mapa) => [...mapa.entries()].sort((a, b) => b[1] - a[1]);

/* ═══ SVG: AJUDANTES ══════════════════════════════════════ */
function el(tag, attrs = {}, pai) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
  if (pai) pai.appendChild(n);
  return n;
}

function novoSvg(caixa, altura) {
  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 560, 260);
  const svg = el("svg", {
    width: largura, height: altura,
    viewBox: `0 0 ${largura} ${altura}`, role: "img"
  }, caixa);
  return { svg, largura, altura };
}

function semDados(caixa, texto = "Sem dados neste período") {
  caixa.innerHTML = `<div class="viz__vazio">${texto}</div>`;
}

/* dica que segue o cursor */
const dica = $("#dica");
function mostrarDica(evento, html) {
  dica.innerHTML = html;
  dica.hidden = false;
  const r = dica.getBoundingClientRect();
  let x = evento.clientX + 14;
  let y = evento.clientY - r.height - 12;
  if (x + r.width > innerWidth - 8) x = evento.clientX - r.width - 14;
  if (y < 8) y = evento.clientY + 18;
  dica.style.left = `${Math.max(8, x)}px`;
  dica.style.top = `${y}px`;
}
const esconderDica = () => { dica.hidden = true; };

/* ligar hover num conjunto de marcas */
function ligarHover(caixa, marcas, conteudo) {
  marcas.forEach((m, i) => {
    m.classList.add("marca-viz");
    m.addEventListener("mouseenter", (e) => {
      caixa.classList.add("esmaece"); m.classList.add("ativo");
      mostrarDica(e, conteudo(i));
    });
    m.addEventListener("mousemove", (e) => mostrarDica(e, conteudo(i)));
    m.addEventListener("mouseleave", () => {
      caixa.classList.remove("esmaece"); m.classList.remove("ativo");
      esconderDica();
    });
  });
}

/* Escala do eixo: procura o passo "redondo" que cobre o máximo com a menor
   folga, usando entre 3 e 5 linhas. Evita tanto "25, 17, 8" quanto um teto
   de 30 para um máximo de 21. */
const PASSOS_BONITOS = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2500, 5000];
function escala(max) {
  const alvo = Math.max(max, 1);
  let melhor = null;
  for (const passo of PASSOS_BONITOS) {
    const linhas = Math.ceil(alvo / passo);
    if (linhas < 3 || linhas > 5) continue;
    const teto = passo * linhas;
    // menor folga vence; empate vai para o que tem mais linhas
    if (!melhor || teto < melhor.teto || (teto === melhor.teto && linhas > melhor.linhas)) {
      melhor = { teto, passo, linhas };
    }
  }
  return melhor ?? { teto: alvo, passo: alvo / 4, linhas: 4 };
}

/* ═══ GRÁFICO: MOVIMENTO (área + linha) ═══════════════════ */
function graficoMovimento(caixa, lista) {
  if (!lista.length) return semDados(caixa);

  // série contínua, incluindo dias sem atendimento
  const porDia = contar(lista, (a) => a.data);
  const datas = [...porDia.keys()].sort();
  const ini = doIso(datas[0]);
  const fim = doIso(datas[datas.length - 1]);
  const serie = [];
  for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) {
    const k = isoLocal(d);
    serie.push({ data: k, n: porDia.get(k) || 0 });
  }
  if (serie.length < 2) return semDados(caixa, "Poucos dias para desenhar o movimento");

  const { svg, largura, altura } = novoSvg(caixa, 250);
  const m = { t: 14, d: 14, b: 30, e: 34 };
  const L = largura - m.e - m.d;
  const A = altura - m.t - m.b;
  const { teto, linhas } = escala(Math.max(...serie.map((p) => p.n)));

  const x = (i) => m.e + (L * i) / (serie.length - 1);
  const y = (v) => m.t + A - (A * v) / teto;

  // grade e eixo Y
  for (let i = 0; i <= linhas; i++) {
    const v = (teto / linhas) * i;
    el("line", { x1: m.e, x2: m.e + L, y1: y(v), y2: y(v), class: "grade-linha" }, svg);
    el("text", { x: m.e - 8, y: y(v) + 4, "text-anchor": "end", class: "eixo" }, svg)
      .textContent = Math.round(v);
  }

  // área
  const linha = serie.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.n)}`).join("");
  const grad = el("linearGradient", { id: "gradMov", x1: 0, y1: 0, x2: 0, y2: 1 }, el("defs", {}, svg));
  el("stop", { offset: "0%", "stop-color": "var(--magnitude)", "stop-opacity": ".38" }, grad);
  el("stop", { offset: "100%", "stop-color": "var(--magnitude)", "stop-opacity": "0" }, grad);
  el("path", {
    d: `${linha}L${x(serie.length - 1)},${y(0)}L${x(0)},${y(0)}Z`,
    fill: "url(#gradMov)", class: "anima-o"
  }, svg);
  el("path", {
    d: linha, fill: "none", stroke: "var(--magnitude)", "stroke-width": 2,
    "stroke-linejoin": "round", "stroke-linecap": "round", class: "anima-o"
  }, svg);

  // rótulos do eixo X: só desenha se houver espaço desde o anterior
  const salto = Math.max(1, Math.ceil(serie.length / Math.max(3, Math.floor(largura / 78))));
  const larguraRotulo = 44;
  let ultimoX = -Infinity;
  serie.forEach((p, i) => {
    const ehUltimo = i === serie.length - 1;
    if (i % salto && !ehUltimo) return;
    if (x(i) - ultimoX < larguraRotulo) {
      // o último rótulo tem prioridade: remove o anterior em vez de sobrepor
      if (!ehUltimo) return;
      svg.querySelector(".eixo-x:last-of-type")?.remove();
    }
    el("text", {
      x: x(i), y: altura - 10, "text-anchor": "middle", class: "eixo eixo-x"
    }, svg).textContent = dataBR(p.data);
    ultimoX = x(i);
  });

  // camada de leitura: linha-guia + ponto + dica
  const guia = el("line", {
    y1: m.t, y2: m.t + A, stroke: "var(--linha-forte)", "stroke-width": 1, opacity: 0
  }, svg);
  const ponto = el("circle", {
    r: 5, fill: "var(--magnitude)", stroke: "var(--cartao)", "stroke-width": 2, opacity: 0
  }, svg);

  const captura = el("rect", {
    x: m.e, y: m.t, width: L, height: A, fill: "transparent", style: "cursor:crosshair"
  }, svg);

  captura.addEventListener("mousemove", (e) => {
    const cx = e.clientX - svg.getBoundingClientRect().left;
    const i = Math.max(0, Math.min(serie.length - 1,
      Math.round(((cx - m.e) / L) * (serie.length - 1))));
    const p = serie[i];
    guia.setAttribute("x1", x(i)); guia.setAttribute("x2", x(i)); guia.setAttribute("opacity", 1);
    ponto.setAttribute("cx", x(i)); ponto.setAttribute("cy", y(p.n)); ponto.setAttribute("opacity", 1);
    mostrarDica(e, `<b>${p.n} atendimento${p.n === 1 ? "" : "s"}</b><br><span class="dica__k">${dataBRCompleta(p.data)}</span>`);
  });
  captura.addEventListener("mouseleave", () => {
    guia.setAttribute("opacity", 0); ponto.setAttribute("opacity", 0); esconderDica();
  });

  svg.setAttribute("aria-label", `Atendimentos por dia, de ${dataBRCompleta(serie[0].data)} a ${dataBRCompleta(serie[serie.length-1].data)}`);
}

/* ═══ GRÁFICO: PORTE (barra 100% + legenda) ═══════════════ */
function graficoPorte(caixa, lista) {
  if (!lista.length) return semDados(caixa);
  const cont = contar(lista, (a) => a.porte || "Pequeno");
  const total = lista.length;
  const partes = PORTES.map((p) => ({ nome: p, n: cont.get(p) || 0 })).filter((p) => p.n);
  if (!partes.length) return semDados(caixa);

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 320, 240);
  const svg = el("svg", { width: largura, height: 74, viewBox: `0 0 ${largura} 74` }, caixa);

  const alturaBarra = 40;
  let x = 0;
  const vao = 2;                                   // respiro entre segmentos
  const util = largura - vao * (partes.length - 1);
  const marcas = [];

  partes.forEach((p, i) => {
    const w = (p.n / total) * util;
    const g = el("g", {}, svg);
    el("rect", {
      x, y: 0, width: Math.max(w, 2), height: alturaBarra,
      fill: COR_PORTE[p.nome], rx: 5, class: "anima-h",
      style: `animation-delay:${i * 90}ms`
    }, g);
    // rótulo direto dentro do segmento, quando couber
    const pct = Math.round((p.n / total) * 100);
    if (w > 46) {
      el("text", {
        x: x + w / 2, y: alturaBarra / 2 + 4, "text-anchor": "middle",
        style: "font-size:12.5px;font-weight:800;fill:#06182B"
      }, g).textContent = `${pct}%`;
    }
    marcas.push(g);
    x += w + vao;
  });

  // legenda com valor absoluto — identidade nunca só pela cor
  let lx = 0;
  partes.forEach((p) => {
    const g = el("g", { transform: `translate(${lx},${alturaBarra + 20})` }, svg);
    el("rect", { x: 0, y: -8, width: 10, height: 10, rx: 3, fill: COR_PORTE[p.nome] }, g);
    const t = el("text", { x: 16, y: 1, class: "rotulo" }, g);
    t.textContent = `${p.nome} · ${p.n}`;
    lx += 18 + t.textContent.length * 6.6;
  });

  ligarHover(caixa, marcas, (i) => {
    const p = partes[i];
    return `<b>${p.nome}</b><br><span class="dica__k">${p.n} de ${total} · ${Math.round((p.n/total)*100)}%</span>`;
  });

  svg.setAttribute("aria-label",
    "Porte dos pets: " + partes.map((p) => `${p.nome} ${p.n}`).join(", "));
}

/* ═══ GRÁFICO: BARRAS HORIZONTAIS ════════════════════════ */
function barrasH(caixa, itens, opcoes = {}) {
  if (!itens.length) return semDados(caixa);
  const { sufixo = "", cor = "var(--magnitude)", rotuloLargura = 138 } = opcoes;

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 460, 260);
  const passo = 30;
  const altura = itens.length * passo + 6;
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }, caixa);

  const rl = Math.min(rotuloLargura, largura * 0.42);
  const fimValor = 46;
  const L = largura - rl - fimValor;
  const max = Math.max(...itens.map((i) => i.n));
  const marcas = [];

  itens.forEach((item, i) => {
    const y = i * passo;
    const g = el("g", { transform: `translate(0,${y})` }, svg);

    const nome = el("text", { x: 0, y: 14, class: "rotulo" }, g);
    nome.textContent = item.nome.length > 20 ? item.nome.slice(0, 19) + "…" : item.nome;
    if (item.nome.length > 20) el("title", {}, nome).textContent = item.nome;

    // trilho, para dar noção da escala
    el("rect", { x: rl, y: 3, width: L, height: 15, rx: 4, fill: "rgba(255,255,255,.045)" }, g);
    el("rect", {
      x: rl, y: 3, width: Math.max((item.n / max) * L, 3), height: 15, rx: 4,
      fill: cor, class: "anima-h", style: `animation-delay:${i * 45}ms;transform-origin:${rl}px 0`
    }, g);

    el("text", { x: largura, y: 15, "text-anchor": "end", class: "valor" }, g)
      .textContent = item.n + sufixo;

    marcas.push(g);
  });

  ligarHover(caixa, marcas, (i) => {
    const it = itens[i];
    return `<b>${it.nome}</b><br><span class="dica__k">${it.dica || `${it.n}${sufixo}`}</span>`;
  });
}

/* ═══ GRÁFICO: BARRAS VERTICAIS ══════════════════════════ */
function barrasV(caixa, itens, opcoes = {}) {
  if (!itens.length || itens.every((i) => !i.n)) return semDados(caixa);
  const { cor = "var(--magnitude)" } = opcoes;

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 460, 260);
  const altura = 200;
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }, caixa);

  const m = { t: 16, d: 6, b: 28, e: 30 };
  const L = largura - m.e - m.d;
  const A = altura - m.t - m.b;
  const { teto, linhas } = escala(Math.max(...itens.map((i) => i.n)));
  const passo = L / itens.length;
  const larguraBarra = Math.min(passo - 6, 40);
  const marcas = [];

  for (let i = 0; i <= linhas; i++) {
    const v = (teto / linhas) * i;
    const y = m.t + A - (A * v) / teto;
    el("line", { x1: m.e, x2: m.e + L, y1: y, y2: y, class: "grade-linha" }, svg);
    el("text", { x: m.e - 8, y: y + 4, "text-anchor": "end", class: "eixo" }, svg)
      .textContent = Math.round(v);
  }

  itens.forEach((item, i) => {
    const cx = m.e + passo * i + passo / 2;
    const h = teto ? (A * item.n) / teto : 0;
    const g = el("g", {}, svg);
    el("rect", {
      x: cx - larguraBarra / 2, y: m.t + A - h,
      width: larguraBarra, height: Math.max(h, item.n ? 2 : 0), rx: 4,
      fill: cor, class: "anima-v",
      style: `animation-delay:${i * 40}ms;transform-origin:0 ${m.t + A}px`
    }, g);
    el("text", { x: cx, y: altura - 9, "text-anchor": "middle", class: "eixo" }, svg)
      .textContent = item.nome;
    marcas.push(g);
  });

  ligarHover(caixa, marcas, (i) =>
    `<b>${itens[i].n} atendimento${itens[i].n === 1 ? "" : "s"}</b><br><span class="dica__k">${itens[i].completo || itens[i].nome}</span>`);
}

/* ═══ GRÁFICO: RAÇA × PORTE (barras empilhadas) ══════════ */
function graficoRacaPorte(caixa, lista) {
  if (!lista.length) return semDados(caixa);

  const porRaca = new Map();
  lista.forEach((a) => {
    const r = a.raca?.trim() || "Não informada";
    if (!porRaca.has(r)) porRaca.set(r, { total: 0, Pequeno: 0, "Médio": 0, Grande: 0 });
    const o = porRaca.get(r);
    o.total++;
    o[a.porte || "Pequeno"] = (o[a.porte || "Pequeno"] || 0) + 1;
  });

  const itens = [...porRaca.entries()]
    .sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  if (!itens.length) return semDados(caixa);

  caixa.textContent = "";
  const largura = Math.max(caixa.clientWidth || 640, 280);
  const passo = 34;
  const altura = itens.length * passo + 6;
  const svg = el("svg", { width: largura, height: altura, viewBox: `0 0 ${largura} ${altura}` }, caixa);

  const rl = Math.min(150, largura * 0.34);
  const fimValor = 40;
  const L = largura - rl - fimValor;
  const max = Math.max(...itens.map(([, o]) => o.total));

  itens.forEach(([raca, o], i) => {
    const y = i * passo;
    const g = el("g", { transform: `translate(0,${y})` }, svg);

    const nome = el("text", { x: 0, y: 16, class: "rotulo" }, g);
    nome.textContent = raca.length > 19 ? raca.slice(0, 18) + "…" : raca;
    if (raca.length > 19) el("title", {}, nome).textContent = raca;

    el("rect", { x: rl, y: 4, width: L, height: 17, rx: 4, fill: "rgba(255,255,255,.045)" }, g);

    let x = rl;
    const larguraTotal = (o.total / max) * L;
    PORTES.forEach((p, k) => {
      if (!o[p]) return;
      const w = (o[p] / o.total) * larguraTotal;
      const seg = el("rect", {
        x, y: 4, width: Math.max(w - 2, 2), height: 17, rx: 3,
        fill: COR_PORTE[p], class: "anima-h marca-viz",
        style: `animation-delay:${i * 45 + k * 30}ms;transform-origin:${x}px 0`
      }, g);
      seg.addEventListener("mouseenter", (e) => {
        caixa.classList.add("esmaece"); seg.classList.add("ativo");
        mostrarDica(e, `<b>${raca} · ${p}</b><br><span class="dica__k">${o[p]} de ${o.total} atendimentos</span>`);
      });
      seg.addEventListener("mousemove", (e) =>
        mostrarDica(e, `<b>${raca} · ${p}</b><br><span class="dica__k">${o[p]} de ${o.total} atendimentos</span>`));
      seg.addEventListener("mouseleave", () => {
        caixa.classList.remove("esmaece"); seg.classList.remove("ativo"); esconderDica();
      });
      x += w;
    });

    el("text", { x: largura, y: 17, "text-anchor": "end", class: "valor" }, g)
      .textContent = o.total;
  });
}

/* ═══ RENDERIZAÇÃO ════════════════════════════════════════ */
function delta(atual, anterior, elemento, formatar = (v) => v) {
  if (!anterior || estado.dias === 0) { elemento.textContent = ""; elemento.className = "kpi__d"; return; }
  const dif = atual - anterior;
  const pct = anterior ? (dif / anterior) * 100 : 0;
  const arredondado = Math.round(Math.abs(pct));
  // abaixo de 1% arredondado, tratar como estável — seta para baixo em "0%" confunde
  if (arredondado === 0) {
    elemento.textContent = "estável vs período anterior";
    elemento.className = "kpi__d kpi__d--calmo";
    return;
  }
  elemento.textContent = `${dif > 0 ? "▲" : "▼"} ${arredondado}% vs período anterior`;
  elemento.className = "kpi__d " + (dif > 0 ? "kpi__d--sobe" : "kpi__d--desce");
}

function desenhar() {
  const atual = noPeriodo(dados, estado.dias);
  const anterior = noPeriodo(dados, estado.dias, 1);
  const m = metricas(atual);
  const ma = metricas(anterior);

  $("#kpi-atend").textContent = m.total;
  $("#kpi-receita").textContent = dinheiro(m.receita);
  $("#kpi-ticket").textContent = dinheiro(m.ticket);
  $("#kpi-pets").textContent = m.pets;
  $("#kpi-retorno").textContent = `${m.retorno.toFixed(0)}%`;

  delta(m.total, ma.total, $("#kpi-atend-d"));
  delta(m.receita, ma.receita, $("#kpi-receita-d"));
  delta(m.ticket, ma.ticket, $("#kpi-ticket-d"));
  delta(m.pets, ma.pets, $("#kpi-pets-d"));

  graficoMovimento($("#viz-movimento"), atual);
  graficoPorte($("#viz-porte"), atual);

  const racas = ordenado(contar(atual, (a) => a.raca?.trim() || "Não informada")).slice(0, 10);
  barrasH($("#viz-racas"), racas.map(([nome, n]) => ({
    nome, n, dica: `${n} atendimento${n === 1 ? "" : "s"} · ${((n / atual.length) * 100).toFixed(0)}% do período`
  })));

  const servicos = ordenado(contar(atual, (a) => a.servicos || []));
  barrasH($("#viz-servicos"), servicos.map(([nome, n]) => ({
    nome, n, dica: `${n} vez${n === 1 ? "" : "es"} no período`
  })));

  const porHora = new Map();
  for (let h = 8; h <= 18; h++) porHora.set(h, 0);
  atual.forEach((a) => {
    const h = parseInt((a.hora || "").slice(0, 2), 10);
    if (!isNaN(h) && porHora.has(h)) porHora.set(h, porHora.get(h) + 1);
  });
  barrasV($("#viz-horas"), [...porHora.entries()].map(([h, n]) => ({
    nome: `${h}h`, n, completo: `Entre ${h}h e ${h + 1}h`
  })));

  const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const completos = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const porSemana = new Array(7).fill(0);
  atual.forEach((a) => porSemana[doIso(a.data).getDay()]++);
  barrasV($("#viz-semana"), porSemana.map((n, i) => ({ nome: nomesDias[i], n, completo: completos[i] })));

  graficoRacaPorte($("#viz-raca-porte"), atual);

  $("#legenda-porte").innerHTML = PORTES.map((p) =>
    `<span class="legenda__i"><span class="legenda__c" style="background:${COR_PORTE[p]}"></span>${p}</span>`
  ).join("");

  desenharTabela();
}

/* ═══ TABELA ══════════════════════════════════════════════ */
function listaFiltrada() {
  let lista = noPeriodo(dados, estado.dias);
  const q = estado.busca.trim().toLowerCase();
  if (q) {
    lista = lista.filter((a) =>
      [a.pet, a.tutor, a.raca, a.porte, (a.servicos || []).join(" ")]
        .join(" ").toLowerCase().includes(q));
  }
  const { col, dir } = estado;
  const s = dir === "asc" ? 1 : -1;
  return lista.sort((a, b) => {
    let x = a[col], y = b[col];
    if (col === "valor") { x = Number(x) || 0; y = Number(y) || 0; return (x - y) * s; }
    if (col === "data") return ((a.data + (a.hora||"")) > (b.data + (b.hora||"")) ? 1 : -1) * s;
    return String(x || "").localeCompare(String(y || ""), "pt-BR") * s;
  });
}

function desenharTabela() {
  const lista = listaFiltrada();
  const totalPaginas = Math.max(1, Math.ceil(lista.length / estado.porPagina));
  estado.pagina = Math.min(estado.pagina, totalPaginas);
  const inicio = (estado.pagina - 1) * estado.porPagina;
  const pagina = lista.slice(inicio, inicio + estado.porPagina);

  const soma = lista.reduce((s, a) => s + (Number(a.valor) || 0), 0);
  $("#tabela-contagem").textContent =
    `${lista.length} registro${lista.length === 1 ? "" : "s"} · ${dinheiroExato(soma)}`;

  const inicialPorte = { "Pequeno": "p", "Médio": "m", "Grande": "g" };

  $("#corpo-tabela").innerHTML = pagina.map((a) => `
    <tr>
      <td>${dataBRCompleta(a.data)}${a.hora ? ` <span style="color:var(--txt-3)">${a.hora}</span>` : ""}</td>
      <td class="tabela__pet">${escapar(a.pet)}</td>
      <td>${escapar(a.raca || "—")}</td>
      <td><span class="marcador marcador--${inicialPorte[a.porte] || "p"}">${escapar(a.porte || "—")}</span></td>
      <td class="tabela__servicos">${escapar((a.servicos || []).join(", ") || "—")}</td>
      <td>${escapar(a.tutor || "—")}</td>
      <td class="num">${a.valor ? dinheiroExato(Number(a.valor)) : "—"}</td>
      <td>
        <div class="acoes">
          <button class="acao" data-editar="${a.id}" aria-label="Editar atendimento de ${escapar(a.pet)}" title="Editar">
            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg>
          </button>
          <button class="acao acao--apagar" data-apagar="${a.id}" aria-label="Apagar atendimento de ${escapar(a.pet)}" title="Apagar">
            <svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join("") ||
    `<tr><td colspan="8" style="text-align:center;color:var(--txt-3);padding:2rem">Nenhum registro encontrado</td></tr>`;

  // paginação
  const p = $("#paginacao");
  if (totalPaginas <= 1) { p.innerHTML = ""; }
  else {
    const botoes = [];
    botoes.push(`<button class="pag" data-pag="${estado.pagina - 1}" ${estado.pagina === 1 ? "disabled" : ""}>←</button>`);
    for (let i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || Math.abs(i - estado.pagina) <= 1) {
        botoes.push(`<button class="pag ${i === estado.pagina ? "is-on" : ""}" data-pag="${i}">${i}</button>`);
      } else if (Math.abs(i - estado.pagina) === 2) {
        botoes.push(`<span style="color:var(--txt-3)">…</span>`);
      }
    }
    botoes.push(`<button class="pag" data-pag="${estado.pagina + 1}" ${estado.pagina === totalPaginas ? "disabled" : ""}>→</button>`);
    p.innerHTML = botoes.join("");
  }
}

const escapar = (s) => String(s ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ═══ MODAL ═══════════════════════════════════════════════ */
const modal = $("#modal");

$("#fichas-servicos").innerHTML = CONFIG.servicos.map((s) =>
  `<label class="ficha"><input type="checkbox" value="${escapar(s)}"><span>${escapar(s)}</span></label>`
).join("");

function abrirModal(id) {
  const a = id ? dados.find((x) => x.id === id) : null;
  $("#modal-titulo").textContent = a ? "Editar atendimento" : "Novo atendimento";
  $("#modal-erro").textContent = "";
  $("#f-id").value = a?.id || "";
  $("#f-data").value = a?.data || isoLocal(new Date());
  $("#f-hora").value = a?.hora || "";
  $("#f-pet").value = a?.pet || "";
  $("#f-raca").value = a?.raca || "";
  $("#f-porte").value = a?.porte || "Pequeno";
  $("#f-tutor").value = a?.tutor || "";
  $("#f-valor").value = a?.valor ?? "";
  $("#f-obs").value = a?.obs || "";
  $$("#fichas-servicos input").forEach((i) => { i.checked = !!a?.servicos?.includes(i.value); });

  atualizarListaRacas();
  modal.showModal();
  $("#f-pet").focus();
}

$("#form-atendimento").addEventListener("submit", (e) => {
  e.preventDefault();
  const pet = $("#f-pet").value.trim();
  const data = $("#f-data").value;
  if (!pet)  return ($("#modal-erro").textContent = "Escreva o nome do pet.", $("#f-pet").focus());
  if (!data) return ($("#modal-erro").textContent = "Escolha a data.", $("#f-data").focus());

  const registro = {
    id: $("#f-id").value || novoId(),
    data, hora: $("#f-hora").value,
    pet, raca: $("#f-raca").value.trim(),
    porte: $("#f-porte").value,
    tutor: $("#f-tutor").value.trim(),
    valor: $("#f-valor").value === "" ? 0 : Number($("#f-valor").value),
    servicos: $$("#fichas-servicos input:checked").map((i) => i.value),
    obs: $("#f-obs").value.trim()
  };

  const i = dados.findIndex((x) => x.id === registro.id);
  if (i >= 0) dados[i] = registro; else dados.unshift(registro);

  salvar();
  modal.close();
  atualizar();
  avisar(i >= 0 ? "Atendimento atualizado" : "Atendimento registrado");
});

$("#fechar-modal").addEventListener("click", () => modal.close());
$("#cancelar").addEventListener("click", () => modal.close());

function atualizarListaRacas() {
  const vistas = [...new Set(dados.map((a) => a.raca).filter(Boolean))].sort();
  const padrao = ["Shih-tzu","Poodle","Yorkshire","Sem raça definida","Lulu da Pomerânia",
    "Maltês","Pinscher","Lhasa Apso","Pug","Bulldog Francês","Schnauzer","Beagle",
    "Cocker Spaniel","Border Collie","Golden Retriever","Labrador","Pastor Alemão","Gato"];
  $("#lista-racas").innerHTML = [...new Set([...vistas, ...padrao])]
    .map((r) => `<option value="${escapar(r)}">`).join("");
}

/* ═══ AVISO RÁPIDO ════════════════════════════════════════ */
let tempoAviso;
function avisar(texto) {
  const a = $("#aviso");
  a.textContent = texto;
  a.hidden = false;
  clearTimeout(tempoAviso);
  tempoAviso = setTimeout(() => { a.hidden = true; }, 2600);
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
  const cabecalho = ["Data","Hora","Pet","Raça","Porte","Tutor","Serviços","Valor","Observações"];
  const celula = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = lista.map((a) => [
    a.data, a.hora, a.pet, a.raca, a.porte, a.tutor,
    (a.servicos || []).join(" + "), String(a.valor ?? "").replace(".", ","), a.obs
  ].map(celula).join(";"));
  // BOM para o Excel abrir os acentos certo
  baixar(`estilopet-atendimentos-${isoLocal(new Date())}.csv`,
    "﻿" + [cabecalho.map(celula).join(";"), ...linhas].join("\r\n"),
    "text/csv;charset=utf-8");
  avisar(`${lista.length} registros exportados`);
}

function fazerBackup() {
  if (!dados.length) return avisar("Nada para salvar ainda");
  baixar(`estilopet-backup-${isoLocal(new Date())}.json`,
    JSON.stringify({ versao: 1, geradoEm: new Date().toISOString(), atendimentos: dados }, null, 2),
    "application/json");
  avisar("Backup baixado");
}

$("#arquivo").addEventListener("change", (e) => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const lido = JSON.parse(leitor.result);
      const lista = Array.isArray(lido) ? lido : lido.atendimentos;
      if (!Array.isArray(lista)) throw new Error("formato");

      const existentes = new Set(dados.map((a) => a.id));
      const novos = lista
        .filter((a) => a && a.pet && a.data)
        .map((a) => ({
          id: a.id && !existentes.has(a.id) ? a.id : novoId(),
          data: a.data, hora: a.hora || "",
          pet: String(a.pet), raca: a.raca || "", porte: a.porte || "Pequeno",
          tutor: a.tutor || "", valor: Number(a.valor) || 0,
          servicos: Array.isArray(a.servicos) ? a.servicos : [],
          obs: a.obs || ""
        }))
        .filter((a) => !existentes.has(a.id));

      dados = [...novos, ...dados];
      salvar(); atualizar();
      avisar(`${novos.length} registros importados`);
    } catch {
      avisar("Arquivo inválido. Use um backup gerado por este painel.");
    }
    e.target.value = "";
  };
  leitor.readAsText(arquivo);
});

/* ═══ EVENTOS ═════════════════════════════════════════════ */
$$(".periodo__b").forEach((b) => b.addEventListener("click", () => {
  $$(".periodo__b").forEach((x) => x.classList.remove("is-on"));
  b.classList.add("is-on");
  estado.dias = Number(b.dataset.dias);
  estado.pagina = 1;
  desenhar();
}));

$("#btn-novo").addEventListener("click", () => abrirModal());
$("#btn-novo-2").addEventListener("click", () => abrirModal());
$("#btn-exemplo").addEventListener("click", () => {
  dados = gerarExemplo();
  salvar(); atualizar();
  avisar("Dados de exemplo carregados");
});

let tempoBusca;
$("#busca").addEventListener("input", (e) => {
  clearTimeout(tempoBusca);
  tempoBusca = setTimeout(() => {
    estado.busca = e.target.value;
    estado.pagina = 1;
    desenharTabela();
  }, 180);
});

$$(".ordenar").forEach((b) => b.addEventListener("click", () => {
  const col = b.dataset.col;
  if (estado.col === col) estado.dir = estado.dir === "asc" ? "desc" : "asc";
  else { estado.col = col; estado.dir = col === "data" || col === "valor" ? "desc" : "asc"; }
  $$(".ordenar").forEach((x) => x.removeAttribute("data-dir"));
  b.setAttribute("data-dir", estado.dir);
  desenharTabela();
}));

$("#corpo-tabela").addEventListener("click", (e) => {
  const editar = e.target.closest("[data-editar]");
  const apagar = e.target.closest("[data-apagar]");
  if (editar) return abrirModal(editar.dataset.editar);
  if (apagar) {
    const a = dados.find((x) => x.id === apagar.dataset.apagar);
    if (!a) return;
    if (!confirm(`Apagar o atendimento de ${a.pet} em ${dataBRCompleta(a.data)}?`)) return;
    dados = dados.filter((x) => x.id !== a.id);
    salvar(); atualizar();
    avisar("Atendimento apagado");
  }
});

$("#paginacao").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pag]");
  if (!b || b.disabled) return;
  estado.pagina = Number(b.dataset.pag);
  desenharTabela();
  $(".tabela").scrollIntoView({ block: "nearest", behavior: "smooth" });
});

$("#btn-csv").addEventListener("click", exportarCsv);
$("#btn-backup").addEventListener("click", fazerBackup);
$("#btn-backup-2").addEventListener("click", fazerBackup);
$("#btn-importar").addEventListener("click", () => $("#arquivo").click());

$("#btn-limpar").addEventListener("click", () => {
  if (!confirm("Apagar TODOS os atendimentos deste navegador? Não dá para desfazer.\n\nFaça um backup antes se quiser guardar.")) return;
  dados = [];
  salvar(); atualizar();
  avisar("Todos os dados foram apagados");
});

// redesenha ao mudar a largura da janela (os SVGs são feitos em pixels)
let tempoTamanho;
addEventListener("resize", () => {
  clearTimeout(tempoTamanho);
  tempoTamanho = setTimeout(() => { if (dados.length) desenhar(); }, 220);
});

/* ═══ INÍCIO ══════════════════════════════════════════════ */
function atualizar() {
  const temDados = dados.length > 0;
  $("#vazio").hidden = temDados;
  $("#painel").hidden = !temDados;
  atualizarListaRacas();
  if (temDados) desenhar();
}

function iniciar() {
  carregar();
  $("#app").hidden = false;
  atualizar();
}

/* trava de acesso — apenas um obstáculo simples, não é segurança */
const DESTRAVADO = "estilopet:painel-aberto";

if (!CONFIG.senha || sessionStorage.getItem(DESTRAVADO) === "1") {
  iniciar();
} else {
  $("#trava").hidden = false;
  $("#senha").focus();
  $("#form-trava").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#senha").value === CONFIG.senha) {
      try { sessionStorage.setItem(DESTRAVADO, "1"); } catch {}
      $("#trava").hidden = true;
      iniciar();
    } else {
      $("#trava-erro").textContent = "Senha incorreta.";
      $("#senha").select();
    }
  });
}
