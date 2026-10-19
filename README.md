# 🌊 Ruflo Agent Cockpit & Swarm Dashboard

> Painel Web interativo e orquestrador de agentes de IA autônomos baseado no **Ruflo V3 (Multi-Agent Mesh Harness)** com suporte nativo ao **Google Gemini**, Anthropic Claude, OpenAI e Ollama local.

---

## 🚀 Funcionalidades

- **🪐 Cockpit Geral:** Métricas do sistema em tempo real, estado do enxame e visualização gráfica com animação de topologia em malha hierárquica (Swarm Mesh V3).
- **🧠 Suporte ao Google Gemini:** Configuração rápida e persistente de chaves de API do Google AI Studio com modelos `gemini-2.5-pro` e `gemini-2.5-flash`.
- **🎯 Central de Missões:** Disparo e acompanhamento de missões de desenvolvimento autônomo com decomposição de tarefas.
- **🤖 Enxame de Agentes:** Catálogo e gerenciamento de agentes especializados (*Coder*, *Architect*, *Tester*, *Security*, *Coordinator*).
- **📟 Terminal Integrado:** Console interativo estilo hacker dark-mode para executar comandos nativos do Ruflo (`doctor`, `status`, `swarm pheromone`, etc.).
- **🔌 Servidor MCP:** Pronto para integração com Cursor, Windsurf, Claude Code e Claude Desktop.

---

## 🛠️ Scripts Utilitários Criados pelo Enxame

1. **`cotacoes.js` (Monitor e Conversor de Moedas em Tempo Real):**
   Consulta em tempo real a cotação do Dólar (USD), Euro (EUR), Bitcoin (BTC) e Libra (GBP), exibe variação diária colorida e salva o histórico em `cotacoes-historico.json`.
   ```bash
   node cotacoes.js
   ```

2. **`organizador.js` (Organizador Inteligente de Arquivos):**
   Varre uma pasta e separa automaticamente arquivos em subpastas categorizadas (`Imagens`, `Documentos`, `Planilhas`, `Compactados`, `Codigos`).
   ```bash
   node organizador.js --demo             # Testa em uma pasta segura de exemplo
   node organizador.js "C:\MinhaPasta"    # Organiza uma pasta específica
   ```

---

## 🛠️ Como Executar Localmente

### 1. Pré-requisitos
- **Node.js 18+** instalado
- Git configurado

### 2. Instalação
Clone este repositório e instale as dependências:
```bash
git clone https://github.com/joanasampaio07/RUFLO-M-S.git
cd RUFLO-M-S
npm install
```

### 3. Iniciar o Dashboard Web
Execute o servidor:
```bash
npm start
```
Abra o navegador em: **`http://localhost:3333`**

---

## 🔑 Configuração da Chave Gemini
Na aba **"Provedores & Chave Gemini"** da interface web, cole sua chave do Google AI Studio ou configure via terminal:
```bash
npx ruflo providers configure -p google -k SUA_CHAVE_AQUI
```

---

## 📜 Licença
Distribuído sob licença MIT. Baseado no ecossistema Ruflo / Claude Flow.
