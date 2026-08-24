# EstiloPet — Estética Animal

Site institucional de página única, com agendamento que abre direto no WhatsApp.

HTML, CSS e JavaScript puros — sem build, sem dependências, sem servidor.
É só abrir o `index.html` ou publicar a pasta em qualquer hospedagem.

---

## ⚠️ Antes de publicar

O WhatsApp **(27) 99892-3963 já está configurado** e todos os botões funcionam.
Faltam estes pontos, todos marcados no código com o comentário `ATUALIZAR`:

### 1. Foto da fachada — `assets/img/fachada.jpg`

A seção "Sobre" está pronta, mas com uma imagem provisória (o disco amarelo).
Substitua **esses quatro arquivos** pela foto real da loja, em proporção 4:5:

```
assets/img/fachada.jpg      1000×1250
assets/img/fachada@sm.jpg     480×600
assets/img/fachada.webp     1000×1250
assets/img/fachada@sm.webp    480×600
```

Se preferir, pode apagar as versões `.webp` e as `@sm` e deixar só o
`fachada.jpg` — o navegador usa o que existir.

### 2. Endereço e horários — `index.html`, no rodapé

Procure `<!-- ATUALIZAR: endereço real da loja -->`. O link do Google Maps é
montado sozinho a partir do endereço que estiver ali.

### 3. Texto do "Sobre" — `index.html`, seção `#sobre`

Escrevi com base no que dá para ver nas fotos (ar-condicionado, mesas com piso
antiderrapante) e no jeito de trabalhar que você descreveu. Confirme com a
equipe: "equipe fixa", "ambiente climatizado" e "transparência" precisam ser
verdade.

### 4. As três promessas do topo e as legendas do mural

No topo: "Atendimento com hora marcada", "Sem espera em gaiola", "Produtos por
tipo de pelo". No mural, as legendas estão com a raça — se os tutores
autorizarem, troque pelos nomes reais dos pets.

### Onde fica o número, se precisar trocar

`assets/js/main.js`, no topo do arquivo:

```js
const CONFIG = {
  whatsapp: "5527998923963",           // 55 + DDD + número, só dígitos
  whatsappVisivel: "(27) 99892-3963",  // como aparece escrito na tela
  endereco: "EstiloPet Estética Animal"
};
```

---

## Publicar

A pasta é 100% estática. Qualquer uma destas opções serve:

| Onde | Como |
|---|---|
| **Vercel** | `vercel --prod` na raiz, ou conecte o repositório pelo painel |
| **Netlify** | arraste a pasta em app.netlify.com/drop |
| **GitHub Pages** | Settings → Pages → branch `main`, pasta `/` |
| **Hospedagem comum** | envie os arquivos por FTP para `public_html` |

Para testar na sua máquina:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

---

## Estrutura

```
index.html              site público
painel.html             painel interno (não linkado no site)
robots.txt              pede aos buscadores para ignorar o painel
assets/
  css/style.css         estilos do site
  css/painel.css        estilos do painel
  js/main.js            CONFIG do negócio + interações do site
  js/painel.js          dados, métricas e gráficos do painel
  fonts/                Archivo e Hanken Grotesk (self-hosted)
  img/                  fotos de clientes, otimizadas
```

### Sobre as fotos

As oito imagens enviadas eram capturas de tela do Instagram. Recortei a
interface do app e do celular, e gerei versões `.webp` (com `.jpg` de reserva)
em dois tamanhos cada, para o navegador baixar só o que precisa.

Para trocar ou acrescentar uma foto no mural: exporte em 4:5 (ex.: 800×1000),
salve em `assets/img/` e copie um dos blocos `<li class="star">` no `index.html`.

### Sobre as fontes

Archivo (títulos) e Hanken Grotesk (texto) ficam dentro do projeto em vez de vir
do Google Fonts. O site carrega mais rápido, funciona offline e não envia o IP
de quem visita para servidores do Google — o que ajuda do ponto de vista da LGPD.

---

## Painel interno

Endereço: **`/painel.html`** — senha inicial `estilopet`.

Não existe nenhum link para ele no site público, e o `robots.txt` pede aos
buscadores para ignorá-lo.

### ⚠️ Sobre a senha

A trava do painel é feita no navegador. Ela **evita acesso casual, mas não é
segurança de verdade**: quem abrir o código-fonte da página vê a senha. Como o
painel guarda nomes de clientes, vale proteger de verdade:

- **Vercel** → Settings → Deployment Protection → Password Protection
- **Netlify** → Site settings → Access control → Password protection
- **Hospedagem comum** → `.htaccess` com autenticação básica

Para trocar a senha (ou tirar a trava, deixando `""`), edite `assets/js/painel.js`:

```js
const CONFIG = { senha: "estilopet", … };
```

### De onde vêm os dados

O site público manda o agendamento pelo WhatsApp e **não guarda nada** — não há
servidor. Então o painel funciona como um caderno de registros: a cada
atendimento, você clica em **Novo atendimento** e preenche pet, raça, porte,
serviços, valor e horário. O painel calcula todo o resto sozinho.

Foi por isso que o campo **raça** entrou também no formulário do site: a
mensagem que chega no WhatsApp já vem com a raça, e você só copia para o painel.

**Onde os dados ficam:** no navegador daquele aparelho (localStorage). Isso quer
dizer que:

- abrir o painel em outro celular ou computador mostra uma lista vazia;
- limpar os dados do navegador apaga tudo.

Por isso existem os botões **Backup** (baixa um `.json`) e **Importar** (lê esse
`.json` de volta, sem duplicar o que já existe). Use o backup para levar os dados
de um aparelho para outro, e faça um de tempos em tempos.

Se um dia precisarem acessar de vários aparelhos ao mesmo tempo, aí é caso de
banco de dados com login de verdade — dá para fazer, mas é outro projeto.

### O que o painel mostra

**Indicadores** — atendimentos, faturamento, ticket médio, pets diferentes e
taxa de retorno (quantos pets voltaram). Cada um compara com o período anterior
de mesmo tamanho.

**Gráficos** — movimento por dia, distribuição por porte, raças mais atendidas,
serviços mais pedidos, horários de pico, dias da semana e um cruzamento de raça
por porte. Todos com detalhe ao passar o mouse.

**Tabela** — todos os atendimentos, com busca, ordenação por coluna, edição,
exclusão e exportação em CSV (abre direto no Excel, com acentos certos).

**Filtro de período** — 7 dias, 30, 90, 1 ano ou tudo. Vale para o painel inteiro.

### Primeira vez

O painel abre vazio. O botão **Carregar dados de exemplo** preenche uns três
meses de atendimentos fictícios para você ver tudo funcionando — e **Apagar
todos os dados**, no rodapé, limpa quando quiser começar de verdade.

### Sobre as cores dos gráficos

O amarelo da marca é usado nos gráficos de uma série só. Onde há categorias
lado a lado (o porte), as cores foram escolhidas e conferidas para continuarem
distinguíveis por quem tem daltonismo, e todo gráfico traz o número escrito
junto — a cor nunca é a única informação.

---

## Decisões de design

A paleta saiu da própria loja: o azul-marinho da fachada, o amarelo da placa e o
branco da parede interna.

O elemento que se repete é o **disco amarelo com a pata** — a mesma parede em que
todo pet é fotografado depois do banho. Ele aparece como o "O" do logo, como
moldura circular da foto principal e no card de contato. A ideia do site inteiro
vem daí: a EstiloPet já trata cada cachorro como uma estrela de retrato, então o
site trata as fotos do mesmo jeito.

**Botões.** Os botões "Agendar no WhatsApp" levam ao formulário e já deixam o
cursor no primeiro campo. O botão verde flutuante vai direto para a conversa,
com uma mensagem dizendo que a pessoa veio pelo site.

**Animações.** Entrada em sequência no topo, revelação dos blocos conforme a
rolagem (com desfoque suave que se dissolve), letreiro rolante como o de fachada
de loja, anel tracejado girando na foto principal, barra fina de progresso da
leitura sob o cabeçalho e um rastro de patinhas que aparecem uma a uma, discreto,
no fim do "Como funciona" e ao fundo do rodapé. Tudo é desligado automaticamente
para quem ativou "reduzir movimento" no sistema.

## Acessibilidade

- Todos os contrastes passam no WCAG AA (a maioria em AAA)
- Navegação por teclado com foco visível e link "pular para o conteúdo"
- Textos alternativos descritivos nas fotos
- `prefers-reduced-motion` respeitado
- Formulário com `label` em todos os campos e mensagens de erro ligadas a eles

## Ideias para depois

- Feed automático do Instagram via Instagram Graph API (precisa de Conta
  Profissional ligada a uma Página do Facebook)
- Tabela de preços por porte
- Depoimentos de clientes
- Google Analytics ou Plausible, se quiser acompanhar as visitas
