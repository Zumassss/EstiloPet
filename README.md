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
agendar.html                   link de atendimento rápido (o quiz)
painel.html                    painel interno (não linkado no site)
robots.txt                     pede aos buscadores para ignorar o painel
docs/planilha-apps-script.js   código para colar no Google Sheets
assets/
  css/style.css                estilos do site
  css/agendar.css              estilos do /agendar
  css/painel.css               estilos do painel
  js/config.js                 ⭐ dados do negócio — é aqui que você mexe
  js/dados.js                  camada de dados, compartilhada
  js/main.js                   interações do site
  js/agendar.js                o passo a passo do /agendar
  js/painel.js                 métricas e gráficos do painel
  fonts/                       Archivo e Hanken Grotesk (self-hosted)
  img/                         fotos de clientes e da loja, otimizadas
  video/                       o loop do topo, em duas resoluções
```

### Sobre as fotos

As oito imagens enviadas eram capturas de tela do Instagram. Recortei a
interface do app e do celular, e gerei versões `.webp` (com `.jpg` de reserva)
em dois tamanhos cada, para o navegador baixar só o que precisa. Numa delas
sobrou o contador "2/3" do carrossel no canto; a parede atrás dele é lisa, então
foi possível reconstruir o pedaço a partir do que estava em volta.

Para trocar ou acrescentar uma foto no mural: exporte em 4:5 (ex.: 800×1000),
salve em `assets/img/` e copie um dos blocos `<li class="star">` no `index.html`.

### Sobre as fontes

Archivo (títulos) e Hanken Grotesk (texto) ficam dentro do projeto em vez de vir
do Google Fonts. O site carrega mais rápido, funciona offline e não envia o IP
de quem visita para servidores do Google — o que ajuda do ponto de vista da LGPD.

---

## Link de atendimento rápido

Endereço: **`/agendar`**
No ar: <https://estilopet-beryl.vercel.app/agendar>

É uma página separada do site, feita para ser **mandada direto**: no WhatsApp,
na bio do Instagram, num QR code no balcão. Quem já é cliente não precisa passar
pelo site inteiro para marcar de novo.

São seis perguntas, uma por tela, no estilo de um quiz: nome do pet, porte, raça,
serviços, dia e horário, e o seu nome. No fim mostra a ficha para conferir e abre
a conversa no WhatsApp com tudo escrito.

O que ela faz de diferente do formulário do site:

- **Repetir o último.** O aparelho lembra do pedido anterior. Na volta, aparece
  um atalho *"Da última vez: Mel, Shih-tzu, banho e hidratação"* que preenche
  tudo e pula direto para a escolha do dia, que é o que muda.
- **Dia em cartões**, os próximos sete, com "Hoje" e "Amanhã" por extenso.
  Domingo aparece fechado e não dá para escolher.
- **Sábado só até 14h**: os horários da tarde nem aparecem nesse dia.
- Dá para voltar e mudar qualquer resposta pela ficha do fim, sem recomeçar.

Os pedidos feitos por aqui **caem no painel do mesmo jeito** que os do site, com
a marca `SITE`, e valem para todas as métricas.

Ela não é linkada no site nem indexada pelos buscadores: o link é seu, para
mandar para quem você quiser.

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
WhatsApp", o pedido é registrado com pet, raça, porte, serviços, dia e horário.
O painel soma tudo sozinho: você não precisa lançar nada à mão.

Não existe "situação" (pendente, confirmado, concluído) — e é de propósito. Pelo
site, a pessoa só consegue mandar a mensagem no WhatsApp; o que acontece depois
da mensagem acontece na conversa, e o site não tem como saber. Marcar situação
seria você digitando à mão uma informação que o painel não confere: o valor
mostrado é uma **estimativa** pela tabela de preços, não faturamento fechado.

Quem chegou pelo site aparece com a marca `SITE` na lista. Dá para lançar um
pedido à mão também (o botão "Novo"), para quem ligou ou apareceu na porta.

### Tempo real

O painel se atualiza sozinho, sem recarregar. Se o formulário for preenchido
noutra aba do mesmo navegador, o pedido aparece no mesmo instante: os números
sobem, ele entra no topo de "Chegando agora", a linha pisca por alguns segundos
e o menu **Pedidos** ganha um contador do que você ainda não viu (que zera ao
abrir a aba). O indicador **ao vivo**, no alto, mostra há quanto tempo foi a
última atualização.

Com a planilha ligada (abaixo), pedidos vindos de outros aparelhos entram na
consulta seguinte — a cada 25 segundos com a aba à vista, e imediatamente quando
você volta para ela.

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

**Visão geral** — pedidos, pets diferentes, valor estimado e ticket médio, cada
um comparado ao período anterior. Mais "Chegando agora", o movimento por dia,
horários de pico, dias da semana e serviços mais pedidos.

**Pedidos** — a lista completa, com busca, ordenação por coluna, edição,
exclusão e exportação em CSV (abre direto no Excel).

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

**A conversa.** Ao lado do formulário fica a janela do WhatsApp como ela vai
aparecer: cabeçalho com o nome da loja, uma mensagem de recepção e o balão verde
que se reescreve a cada campo preenchido. Antes ali havia só um balão solto num
espaço vazio, e não ficava claro de onde a mensagem vinha. Em tela estreita a
conversa desce para depois do formulário, que é onde ela faz sentido.

**Ícones.** Cada serviço tem o seu (chuveiro, tesoura, máquina, gota, escova,
gravata), desenhados à mão em SVG. Repetir a mesma patinha nos seis cartões era
o que mais entregava molde pronto na página. E cada um mexe do seu jeito: o
chuveiro pinga, a tesoura corta, a máquina vibra, a gota pulsa, a escova varre e
a gravata balança. Toca uma vez quando o cartão entra na tela e de novo a cada
passada do mouse, porque no celular não existe passar o mouse.

**Avaliações.** A nota fica num painel escuro só dela, com o 5,0 grande, e as
três falas passam uma de cada vez num carrossel, com espaço para serem lidas.
Troca sozinha a cada sete segundos e para assim que alguém encosta ou dá foco,
para ninguém perder o texto no meio da leitura. Funciona pelas setas do teclado
e não gira para quem pediu menos movimento. As três são as que estão no perfil
do Google: nenhuma foi escrita para o site nem escolhida a dedo.

**Botões.** Os botões "Agendar no WhatsApp" levam ao formulário e já deixam o
cursor no primeiro campo. O botão verde flutuante vai direto para a conversa,
com uma mensagem dizendo que a pessoa veio pelo site.

**O topo.** Um loop de 10 segundos de um banho de verdade, ocupando a metade
direita do topo como plano de fundo. Para não ficar a tela partida ao meio, com o
vídeo de um lado e o texto do outro, o azul-marinho entra por cima em degradê e
vai sumindo para a direita: o filme dissolve no fundo em vez de terminar numa
linha reta.

O arquivo original tinha 28 MB em 4K; ele é recortado em 2:3, reduzido a 900×1350
e fica em 1,1 MB. O corte tem um cruzamento de um segundo entre o fim e o começo,
para o loop emendar sem salto.

Nada é baixado pelo HTML: o `<video>` nasce sem fonte, mostrando só o pôster, e o
JavaScript decide se vale a pena carregar. Não carrega para quem ativou economia
de dados, está em rede 2G ou pediu menos movimento, e nesses casos o pôster já
conta a história. No celular vem o arquivo de 590 KB, e o azul cobre mais, porque
ali o texto fica por cima do vídeo. Fora da tela, o vídeo pausa.

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
