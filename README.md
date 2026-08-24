# EstiloPet — Estética Animal

Site institucional de página única, com agendamento que abre direto no WhatsApp.

HTML, CSS e JavaScript puros — sem build, sem dependências, sem servidor.
É só abrir o `index.html` ou publicar a pasta em qualquer hospedagem.

---

## ⚠️ Antes de publicar: 4 coisas para preencher

O site está pronto, mas com dados de exemplo. Troque estes quatro pontos:

### 1. Número do WhatsApp — `assets/js/main.js` (linha 9)

É **o item mais importante**: sem ele, nenhum botão do site funciona.

```js
const CONFIG = {
  whatsapp: "5500000000000",          // ← 55 + DDD + número, só dígitos
  whatsappVisivel: "(00) 00000-0000", // ← como aparece escrito na tela
  endereco: "EstiloPet Estética Animal"
};
```

Exemplo para (11) 98765-4321 → `"5511987654321"`.

Mexendo só aqui, todos os botões do site passam a funcionar: o do menu, os dois
do topo, o link de orçamento, o botão verde flutuante e o formulário.

### 2. Endereço e horários — `index.html`, seção `#contato`

Procure o comentário `<!-- ATUALIZAR: endereço, horários e telefone reais -->`.
O link do Google Maps é montado sozinho a partir do endereço que estiver ali.

### 3. As três promessas do topo — `index.html`, seção `.hero__facts`

"Atendimento com hora marcada", "Sem espera em gaiola" e "Produtos por tipo de
pelo". Confirme com a equipe se as três são verdade; se alguma não for, troque
ou apague.

### 4. Legendas do mural — `index.html`, seção `#mural`

Estão com a raça e o serviço ("Lulu da Pomerânia", "Tosa na tesoura"). Deixei
sem nome de pet de propósito: são clientes reais e os nomes seriam invenção
minha. Se os tutores autorizarem, troque pelos nomes verdadeiros — fica bem
mais caloroso.

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

Animações: entrada em sequência no topo, revelação dos blocos conforme a rolagem,
letreiro rolante como o de fachada de loja, anel tracejado girando na foto
principal e microinterações nos cards. Tudo é desligado automaticamente para quem
ativou "reduzir movimento" no sistema.

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
