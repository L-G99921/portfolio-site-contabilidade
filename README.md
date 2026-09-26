# Lastro Contabilidade — Portfólio

Site institucional de um escritório de contabilidade **fictício**, criado como peça de portfólio.
Visual inspirado no [ReUI](https://reui.io/) (shadcn/ui), adaptado para o setor contábil.

**🔗 Site no ar:** https://l-g99921.github.io/portfolio-site-contabilidade/

## Como rodar

```bash
node server.js
```

Abra http://localhost:5500. Também funciona abrindo o `index.html` direto no navegador.

## Estrutura

```
index.html        Página única com todas as seções
css/styles.css    Estilos (tokens de cor no topo do arquivo)
js/main.js        Interações: tema, menu, abas, planos, simulador, formulário
img/              Fotos (Unsplash, licença de uso livre)
favicon.svg       Ícone do site
server.js         Servidor local sem dependências
REFERENCIAS.md    Pesquisa de sites de contabilidade usados como base
```

## Identidade

| Item | Valor |
|---|---|
| Cor principal | Verde-esmeralda `#047857` (claro) / `#10b981` (escuro) |
| Neutros | Escala do ReUI: `#0a0a0a`, `#f5f5f5`, `#e5e5e5` |
| Títulos e texto | Inter |
| Destaques e logo | Instrument Serif itálico |
| Números | Geist Mono |

Para trocar a cor da marca, edite as variáveis `--primary*` no topo de `css/styles.css`.

## Observações

- **Simulador PF x PJ:** estimativa ilustrativa com tabelas de 2025 (IRPF mensal, INSS e Simples Nacional Anexo III com Fator R).
- **Formulário:** simula o envio e gera um link de WhatsApp. Para receber os contatos, troque o `setTimeout` em `js/main.js` por um `fetch()` para o seu backend ou CRM.
- Telefone, CNPJ e registros CRC são fictícios.
