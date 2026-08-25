# EstiloPet — Estética Animal

Site institucional de página única, com agendamento que abre direto no WhatsApp.

HTML, CSS e JavaScript puros — sem build, sem dependências, sem servidor.
É só abrir o `index.html` ou publicar a pasta em qualquer hospedagem.

---

## ⚠️ Antes de publicar

O WhatsApp **(27) 99892-3963**, o endereço e a foto da fachada já estão no lugar.
Sobraram três pontos, todos marcados no código com o comentário `ATUALIZAR`:

### 1. Horários de funcionamento — `index.html`, no rodapé

O Google só mostra "fecha às 18:00". Está no ar como *seg a sex 8h–18h, sábado
8h–14h, domingo fechado* — confirme se é isso mesmo.

### 2. Texto do "Sobre" — `index.html`, seção `#sobre`

Escrevi com base no que dá para ver nas fotos e nas avaliações do Google.
Confirme: "equipe fixa", "ambiente climatizado" e "transparência".

### 3. Legendas do mural — `index.html`, seção `#mural`

Estão com a raça. Se os tutores autorizarem, troque pelos nomes reais dos pets.

### Foto da fachada

A imagem enviada tem 352×526, então ela é ampliada para caber no espaço e fica um
pouco macia em telas grandes. Se você tiver o arquivo original da foto, é só
substituir `assets/img/fachada.jpg` e `fachada@sm.jpg` (proporção 4:5) que ela
fica nítida.

---

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
index.html                     site público
painel.html                    painel interno (não linkado no site)
robots.txt                     pede aos buscadores para ignorar o painel
docs/planilha-apps-script.js   código para colar no Google Sheets
assets/
  css/style.css                estilos do site
  css/painel.css               estilos do painel
  js/config.js                 ⭐ dados do negócio — é aqui que você mexe
  js/dados.js                  camada de dados, compartilhada
  js/main.js                   interações do site
  js/painel.js                 métricas e gráficos do painel
  fonts/                       Archivo e Hanken Grotesk (self-hosted)
  img/                         fotos de clientes e da loja, otimizadas
  video/                       o loop do topo, em duas resoluções
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

Endereço: **`/painel`** — senha inicial `estilopet`.
No ar: <https://estilopet-beryl.vercel.app/painel>

Não há link para ele no site público, o `robots.txt` pede aos buscadores para
ignorá-lo e o `vercel.json` ainda manda um cabeçalho `X-Robots-Tag: noindex`
nessa página.

O `vercel.json` também liga o `cleanUrls`, que é o que faz `/painel` funcionar
sem o `.html` no fim (e `/painel.html` redirecionar para lá).

### De onde vêm os números

Quando alguém preenche o formulário do site e clica em "Abrir conversa no
WhatsApp", o agendamento é registrado com pet, raça, porte, serviços, dia e
horário. O painel soma tudo sozinho: você não precisa lançar nada à mão.

Cada agendamento passa por quatro situações — **pendente → confirmado →
concluído** (ou **não veio**). Basta clicar na etiqueta de situação, na tabela,
para avançar. O faturamento conta só os concluídos.

Quem chegou pelo site aparece com a marca `SITE` na lista. Dá para lançar um
agendamento à mão também (o botão "Novo"), para quem ligou ou apareceu na porta.

### ⚠️ Ligando o site ao painel

**Isto é importante e vale ler até o fim.**

O site é estático — não tem servidor. Quando um cliente preenche o formulário no
celular dele, o registro fica no navegador **dele**. O painel roda no computador
de vocês. Um navegador não lê o armazenamento do outro.

Ou seja: **do jeito que está agora, o painel só mostra o que foi preenchido no
próprio aparelho onde ele está aberto.** Para os pedidos de qualquer cliente
chegarem no painel da loja, é preciso um lugar comum entre os dois — e a forma
mais simples e gratuita é uma planilha do Google.

São cinco minutos, uma vez só:

1. Crie uma planilha nova em [sheets.new](https://sheets.new).
2. Menu **Extensões → Apps Script**.
3. Apague o que estiver lá e cole todo o conteúdo de
   [`docs/planilha-apps-script.js`](docs/planilha-apps-script.js).
4. Clique em **Implantar → Nova implantação**, escolha o tipo
   **App da Web** e configure:
   - *Executar como*: **Eu**
   - *Quem pode acessar*: **Qualquer pessoa**
5. Autorize quando o Google pedir e copie a **URL do app da web**
   (algo como `https://script.google.com/macros/s/AKfy…/exec`).
6. Cole essa URL em `assets/js/config.js`:

```js
endpoint: "https://script.google.com/macros/s/AKfy…/exec",
```

Pronto. A partir daí, todo agendamento feito no site cai na planilha e aparece no
painel — de qualquer celular, para qualquer computador. A aba **Ajustes** do
painel mostra se a ligação está funcionando, e o botão de atualizar (ao lado do
período) busca os pedidos novos na hora. Se o cliente estiver sem sinal na hora
de enviar, o pedido fica guardado e é reenviado sozinho depois.

Como bônus, vocês passam a ter tudo numa planilha do Google, que dá para abrir do
celular e compartilhar com a equipe.

### ⚠️ Sobre a senha do painel

A trava é feita no navegador: ela **evita acesso casual, mas não é segurança de
verdade** — quem abrir o código-fonte da página vê a senha. Como o painel mostra
nomes de clientes, vale proteger de verdade pela hospedagem:

- **Vercel** → Settings → Deployment Protection → Password Protection
- **Netlify** → Site settings → Access control → Password protection
- **Hospedagem comum** → `.htaccess` com autenticação básica

Para trocar a senha (ou tirar a trava, deixando `""`), edite `assets/js/config.js`.

### O que tem em cada aba

**Visão geral** — agendamentos, concluídos, faturamento, ticket médio e pets
diferentes, cada um comparado ao período anterior. Mais o movimento por dia, o
funil de situação, horários de pico, dias da semana e serviços mais pedidos.

**Agendamentos** — a lista completa, com filtro por situação, busca, ordenação
por coluna, edição, exclusão e exportação em CSV (abre direto no Excel).

**Pets e raças** — distribuição por porte, ranking de raças, cruzamento de raça
por porte e os clientes que mais voltam.

**Ajustes** — estado da ligação com a planilha, backup e limpeza.

### Backup

Os dados também ficam guardados no navegador, para o painel abrir rápido e
funcionar sem internet. Vale baixar um backup de vez em quando (aba **Ajustes**),
porque limpar os dados do navegador apaga essa cópia local.

### Sobre as cores dos gráficos

O amarelo da marca é usado nos gráficos de uma série só. Onde há categorias lado
a lado (o porte), as cores foram escolhidas e conferidas para continuarem
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

**O topo.** Um loop de 10 segundos de um banho de verdade, em quadro vertical.
O arquivo original tinha 28 MB em 4K; ele é exibido no máximo a 340px de largura,
então foi reduzido a 640×1138 e ficou em 891 KB. O corte tem um cruzamento de um
segundo entre o fim e o começo, para o loop emendar sem salto.

Nada é baixado pelo HTML: o `<video>` nasce sem fonte, mostrando só o pôster, e o
JavaScript decide se vale a pena carregar. Não carrega para quem ativou economia
de dados, está em rede 2G ou pediu menos movimento — nesses casos o pôster já
conta a história. No celular vem o arquivo de 385 KB. Fora da tela, o vídeo pausa.

**O disco girando** saiu do topo e foi para o "Como funciona", que era a seção
mais fraca do site: os três passos viraram uma lista numerada à esquerda, com o
retrato circular à direita.

**Rolagem.** A roda do mouse move um alvo e a página persegue esse alvo quadro a
quadro, o que dá o deslize contínuo em vez do salto do navegador. Os cliques no
menu usam a mesma curva e já descontam a altura do cabeçalho. Em telas de toque
nada disso é aplicado — o celular já tem inércia própria e melhor.

**Animações.** Entrada em sequência no topo, revelação dos blocos conforme a
rolagem (com um desfoque leve que se dissolve), letreiro rolante como o de fachada
de loja, anel tracejado girando na foto principal, barra fina de progresso da
leitura sob o cabeçalho e um rastro de patinhas que aparecem uma a uma, discreto,
no fim do "Como funciona" e ao fundo do rodapé. Tudo é desligado automaticamente
para quem ativou "reduzir movimento" no sistema.

## Prova social

A nota 5,0 e as três avaliações da seção "O que dizem" são reais e públicas, do
perfil da loja no Google. Nenhuma foi escrita para o site.

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
