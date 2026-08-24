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
index.html              página inteira
assets/
  css/style.css         estilos, incluindo animações
  js/main.js            CONFIG do negócio + interações
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
