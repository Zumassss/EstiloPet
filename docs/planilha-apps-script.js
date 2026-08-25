/**
 * EstiloPet — ponte entre o site e o painel
 * ------------------------------------------------------------
 * Cole este código em Extensões → Apps Script de uma planilha
 * do Google e publique como aplicativo da web. O passo a passo
 * completo está no README, na seção "Ligando o site ao painel".
 *
 * O que ele faz:
 *   GET  → devolve todos os agendamentos em JSON (o painel lê)
 *   POST → grava um agendamento (o site escreve). Se já existir
 *          um com o mesmo id, atualiza a linha em vez de duplicar.
 */

const ABA = 'Agendamentos';

const COLUNAS = [
  'id', 'criadoEm', 'origem', 'status', 'data', 'hora',
  'tutor', 'pet', 'raca', 'porte', 'servicos', 'valor', 'obs'
];

/** Pega a aba, criando-a com o cabeçalho na primeira vez. */
function pegarAba() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);

  if (!aba) {
    aba = planilha.insertSheet(ABA);
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length)
       .setFontWeight('bold')
       .setBackground('#0F2A4A')
       .setFontColor('#FFC20E');
    aba.setFrozenRows(1);
  }
  return aba;
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/** O painel lê daqui. */
function doGet() {
  try {
    const aba = pegarAba();
    const valores = aba.getDataRange().getValues();
    if (valores.length < 2) return responder([]);

    const cabecalho = valores[0];
    const linhas = valores.slice(1).filter(function (l) { return l[0]; });

    const agendamentos = linhas.map(function (linha) {
      const item = {};
      cabecalho.forEach(function (nome, i) { item[nome] = linha[i]; });

      // a planilha guarda os serviços como texto, o site espera lista
      item.servicos = String(item.servicos || '')
        .split(/\s*[+,;]\s*/)
        .filter(function (s) { return s; });

      item.valor = Number(item.valor) || 0;

      // datas voltam como objeto Date; o site quer AAAA-MM-DD
      if (item.data instanceof Date) {
        item.data = Utilities.formatDate(item.data, 'America/Sao_Paulo', 'yyyy-MM-dd');
      }
      if (item.hora instanceof Date) {
        item.hora = Utilities.formatDate(item.hora, 'America/Sao_Paulo', 'HH:mm');
      }
      return item;
    });

    return responder(agendamentos);
  } catch (erro) {
    return responder({ erro: String(erro) });
  }
}

/** O site (e o painel) escrevem aqui. */
function doPost(e) {
  // uma trava para dois pedidos não gravarem na mesma linha
  const trava = LockService.getScriptLock();
  trava.waitLock(20000);

  try {
    const dados = JSON.parse(e.postData.contents);
    if (!dados || !dados.pet) return responder({ ok: false, erro: 'sem pet' });

    const aba = pegarAba();
    const linha = COLUNAS.map(function (coluna) {
      if (coluna === 'servicos') return (dados.servicos || []).join(' + ');
      return dados[coluna] !== undefined && dados[coluna] !== null ? dados[coluna] : '';
    });

    // já existe? então atualiza em vez de criar outra
    const ids = aba.getRange(1, 1, Math.max(aba.getLastRow(), 1), 1).getValues();
    let alvo = -1;
    for (let i = 1; i < ids.length; i++) {
      if (String(ids[i][0]) === String(dados.id)) { alvo = i + 1; break; }
    }

    if (alvo > 0) {
      aba.getRange(alvo, 1, 1, COLUNAS.length).setValues([linha]);
      return responder({ ok: true, acao: 'atualizado' });
    }

    aba.appendRow(linha);
    return responder({ ok: true, acao: 'criado' });
  } catch (erro) {
    return responder({ ok: false, erro: String(erro) });
  } finally {
    trava.releaseLock();
  }
}
