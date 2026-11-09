# SASO ENERGY · front-end (protótipo v1)

Front-end navegável das 6 telas do design v1, com tela de login e menu lateral em todas as páginas.

## Abrir a demonstração (sem instalar nada)

Abra o arquivo **`demo/index.html`** com dois cliques. Ele funciona offline, em qualquer navegador.

## Rodar em modo de desenvolvimento

```bash
npm install
npm run dev          # http://localhost:5173
npm run build:demo   # gera de novo o demo/index.html (arquivo único)
npm run build        # build normal em dist/
```

## Telas

| Rota | Tela do design |
|---|---|
| `#/integrador` | 1 · Integrador — Office (página inicial) |
| `#/integrador/pre-proposta` | 2 · Integrador — Pré-proposta e premissas |
| `#/integrador/projetos/hotel-planalto` | 3 · Integrador — Painel de etapas do projeto |
| `#/saso` | 4 · SASO Engenharia — Fila de validação |
| `#/fornecedor` | 5 · Fornecedor — Painel e ordens de compra (sem valores) |
| `#/cronograma` | 6 · Cronograma de entrega em 3 fases |
| `#/` | Login: Integrador, SASO ou Fornecedor (qualquer e-mail válido e senha com 6+ caracteres) |

## Como a demo funciona

- Os 3 perfis compartilham o mesmo estado: o que um faz aparece nos outros, com avisos no sino.
- Cada perfil só acessa a própria área; sem login, a plataforma volta para a tela de entrada.
- O nome do fornecedor não aparece em nenhum lugar, e as telas do integrador não mencionam o fornecedor.
- A barra escura no rodapé troca de perfil, abre o **roteiro** da demo, mostra os **pontos em aberto** (formato do preço; o que o fornecedor vê do cliente) e **reinicia** a demo.
- O estado fica salvo no navegador (localStorage). Use "Reiniciar" antes de apresentar.
- Dados ilustrativos. Preços aparecem como `[PREÇO]`/`[VALOR]` até a definição comercial.

## Idiomas

Português, inglês e chinês, escolhidos no seletor do topo (também no login e no cronograma).

- Os textos ficam em `src/dict.ts` (chave = texto em português → [inglês, chinês]).
- Ao criar um texto novo na interface, use `t('Texto em português')` e adicione a tradução no `dict.ts`.
- `npm run i18n:check` aponta textos sem tradução e variáveis que não batem entre os idiomas.

## Estrutura

- `src/state/store.tsx`: dados iniciais, ações e regras que ligam os perfis
- `src/pages/`: uma página por tela
- `src/components/ui.tsx`: barra de demo, avisos, modal, menus
- `src/styles.css`: cores e componentes do design (Inter + Space Grotesk)
- `src/i18n.ts` e `src/dict.ts`: tradução PT / EN / 中文
