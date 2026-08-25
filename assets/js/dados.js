/* ═══════════════════════════════════════════════════════════
   EstiloPet — camada de dados
   Compartilhada pelo site (grava) e pelo painel (lê).

   Guarda tudo no navegador e, quando CONFIG.endpoint estiver
   preenchido, também espelha numa planilha do Google — que é
   o que faz o agendamento sair do celular do cliente e chegar
   no computador da loja.
   ═══════════════════════════════════════════════════════════ */

window.Dados = (() => {
  const CHAVE = "estilopet:agendamentos";
  const CHAVE_FILA = "estilopet:fila-envio";

  /* Aviso de mudança entre abas do mesmo navegador.
     Quando alguém preenche o formulário numa aba, a aba do
     painel recebe o recado na hora — sem precisar recarregar
     nem esperar a próxima consulta. */
  const canal = "BroadcastChannel" in self ? new BroadcastChannel("estilopet:dados") : null;
  const ouvintes = new Set();

  /* O recado leva a lista junto — e isso não é capricho.
     A gravação no localStorage de uma aba demora um instante
     para ficar visível nas outras; o recado pelo canal chega
     antes disso. Quem recebesse só o aviso e fosse reler ainda
     leria a lista antiga. Mandando o conteúdo junto, não há
     corrida: o que chega já é o estado novo.

     Quem gravou não é avisado — o BroadcastChannel não entrega
     para quem envia, e a própria aba já sabe o que escreveu. */
  function avisarMudanca(texto) {
    try { canal?.postMessage({ t: Date.now(), lista: texto }); } catch {}
  }

  function receber(texto) {
    let lista = null;
    if (texto) { try { lista = JSON.parse(texto); } catch {} }
    if (!Array.isArray(lista)) lista = lerLocal();
    ouvintes.forEach((f) => {
      // engolir o erro aqui esconde defeito de quem escuta:
      // avisa no console e segue para os outros ouvintes
      try { f(lista); } catch (erro) { console.error("[EstiloPet] ouvinte falhou:", erro); }
    });
  }

  // Um caminho OU o outro, nunca os dois: com os dois ligados o
  // mesmo gravar chega duas vezes, e quem escuta acha que a
  // segunda foi uma mudança nova (sem nada de novo dentro).
  if (canal) {
    canal.addEventListener("message", (e) => receber(e.data?.lista));
  } else {
    // sem canal, sobra o evento de armazenamento — que já vem
    // com o valor novo, então também não sofre da corrida.
    addEventListener("storage", (e) => { if (e.key === CHAVE) receber(e.newValue); });
  }

  /** Chama de volta sempre que a lista mudar, aqui ou em outra
   *  aba. Recebe a lista já pronta como argumento. */
  function aoMudar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }

  const novoId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ── leitura e escrita local ───────────────────────── */
  function lerLocal() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch { return []; }
  }

  function gravarLocal(lista, { avisar = true } = {}) {
    try {
      const texto = JSON.stringify(lista);
      localStorage.setItem(CHAVE, texto);
      if (avisar) avisarMudanca(texto);
      return true;
    } catch { return false; }
  }

  /* ── normalização ──────────────────────────────────────
     Tudo que entra — do formulário, da planilha ou de um
     backup antigo — passa por aqui e sai no mesmo formato. */
  function normalizar(bruto) {
    if (!bruto || !bruto.pet) return null;

    const servicos = Array.isArray(bruto.servicos)
      ? bruto.servicos
      : String(bruto.servicos || "").split(/\s*[+,;]\s*/).filter(Boolean);

    const porte = ["Pequeno", "Médio", "Grande"].includes(bruto.porte)
      ? bruto.porte : "Pequeno";

    return {
      id: bruto.id || novoId(),
      criadoEm: bruto.criadoEm || new Date().toISOString(),
      origem: bruto.origem === "site" ? "site" : "manual",
      data: bruto.data || hoje(),
      hora: bruto.hora || "",
      tutor: String(bruto.tutor || "").trim(),
      pet: String(bruto.pet).trim(),
      raca: String(bruto.raca || "").trim(),
      porte,
      servicos,
      valor: Number(bruto.valor) || 0,
      obs: String(bruto.obs || "").trim()
    };
  }

  const hoje = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  };

  /* estimativa de valor, para o agendamento que vem do site
     sem preço — a loja ajusta depois se precisar */
  function estimarValor(porte, servicos) {
    const tabela = window.CONFIG?.precos?.[porte];
    if (!tabela) return 0;
    const extras = Math.max(0, (servicos?.length || 1) - 1);
    return tabela.base + extras * tabela.servicoExtra;
  }

  /* ── envio para a planilha ─────────────────────────────
     text/plain evita o pedido de permissão prévia (CORS
     preflight), que o Apps Script não responde.           */
  async function enviarRemoto(registro) {
    const url = window.CONFIG?.endpoint;
    if (!url) return false;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(registro)
      });
      return true;
    } catch {
      return false;
    }
  }

  /* Se o envio falhar (cliente sem sinal, por exemplo), o
     registro fica numa fila e tenta de novo na próxima vez. */
  function enfileirar(registro) {
    try {
      const fila = JSON.parse(localStorage.getItem(CHAVE_FILA) || "[]");
      fila.push(registro);
      localStorage.setItem(CHAVE_FILA, JSON.stringify(fila.slice(-50)));
    } catch {}
  }

  async function esvaziarFila() {
    if (!window.CONFIG?.endpoint) return;
    let fila;
    try { fila = JSON.parse(localStorage.getItem(CHAVE_FILA) || "[]"); } catch { return; }
    if (!fila.length) return;

    const sobraram = [];
    for (const item of fila) {
      const ok = await enviarRemoto(item);
      if (!ok) sobraram.push(item);
    }
    try { localStorage.setItem(CHAVE_FILA, JSON.stringify(sobraram)); } catch {}
  }

  /* ── API pública ───────────────────────────────────── */

  /** Registra um agendamento. Chamado pelo formulário do site
   *  e pelo "novo atendimento" do painel. */
  async function registrar(bruto, { remoto = true } = {}) {
    const registro = normalizar(bruto);
    if (!registro) return null;

    if (!registro.valor && registro.origem === "site") {
      registro.valor = estimarValor(registro.porte, registro.servicos);
    }

    const lista = lerLocal();
    const i = lista.findIndex((x) => x.id === registro.id);
    if (i >= 0) lista[i] = registro; else lista.unshift(registro);
    gravarLocal(lista);

    if (remoto && window.CONFIG?.endpoint) {
      const ok = await enviarRemoto(registro);
      if (!ok) enfileirar(registro);
    }
    return registro;
  }

  /** Lê tudo: o que está neste navegador + o que está na
   *  planilha, se houver. Sem duplicar. */
  async function listar() {
    const locais = lerLocal().map(normalizar).filter(Boolean);
    const url = window.CONFIG?.endpoint;
    if (!url) return { lista: ordenar(locais), remoto: "desligado" };

    try {
      const resposta = await fetch(url, { method: "GET" });
      if (!resposta.ok) throw new Error("resposta " + resposta.status);
      const cru = await resposta.json();
      const remotos = (Array.isArray(cru) ? cru : cru.agendamentos || [])
        .map(normalizar).filter(Boolean);

      // o registro da planilha manda, porque pode ter sido
      // editado por outra pessoa da equipe
      const mapa = new Map(locais.map((r) => [r.id, r]));
      remotos.forEach((r) => mapa.set(r.id, r));

      const lista = ordenar([...mapa.values()]);
      const mudou = lista.length !== locais.length ||
        lista.some((r, i) => r.id !== locais[i]?.id);
      gravarLocal(lista, { avisar: mudou });
      return { lista, remoto: "ok", novos: lista.length - locais.length, mudou };
    } catch (erro) {
      return { lista: ordenar(locais), remoto: "erro", mensagem: String(erro.message || erro) };
    }
  }

  const ordenar = (lista) =>
    lista.sort((a, b) =>
      (b.data + (b.hora || "")).localeCompare(a.data + (a.hora || "")));

  function remover(id) {
    const lista = lerLocal().filter((x) => x.id !== id);
    gravarLocal(lista);
    return lista;
  }

  function substituirTudo(lista) {
    const limpa = ordenar((lista || []).map(normalizar).filter(Boolean));
    gravarLocal(limpa);
    return limpa;
  }

  function limpar() {
    gravarLocal([]);
    try { localStorage.removeItem(CHAVE_FILA); } catch {}
  }

  return {
    novoId, hoje, normalizar, estimarValor,
    registrar, listar, remover, substituirTudo, limpar,
    lerLocal, esvaziarFila, aoMudar
  };
})();
