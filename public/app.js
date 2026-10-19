// Ruflo Dashboard Web Client

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  const tabMeta = {
    'tab-cockpit': {
      title: 'Painel de Controle do Enxame',
      subtitle: 'Monitoramento em tempo real do ecossistema Ruflo V3'
    },
    'tab-providers': {
      title: 'Provedores de IA & Google Gemini',
      subtitle: 'Configure suas chaves de API do Google Gemini, Anthropic, OpenAI ou Ollama'
    },
    'tab-missions': {
      title: 'Central de Missões & Metas',
      subtitle: 'Dispare missões de desenvolvimento com orquestração autônoma de enxame'
    },
    'tab-agents': {
      title: 'Catálogo de Agentes Especialistas',
      subtitle: 'Gerencie e spawne agentes para papéis específicos de engenharia'
    },
    'tab-terminal': {
      title: 'Console Interativo Ruflo CLI',
      subtitle: 'Execute comandos nativos diretamente no runtime da sua máquina'
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      item.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');

      if (tabMeta[targetTab]) {
        pageTitle.textContent = tabMeta[targetTab].title;
        pageSubtitle.textContent = tabMeta[targetTab].subtitle;
      }
    });
  });

  // Quick Mission button in header redirects to Missions tab
  const btnQuickMission = document.getElementById('btn-quick-mission');
  if (btnQuickMission) {
    btnQuickMission.addEventListener('click', () => {
      document.getElementById('btn-tab-missions').click();
      document.getElementById('mission-objective').focus();
    });
  }

  // Toast System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Initialize Swarm Topology Canvas
  initSwarmCanvas();

  // Load Status, Providers & Agents
  loadSystemStatus();
  loadProviders();
  loadAgents();

  // Refresh status button
  document.getElementById('btn-refresh-status').addEventListener('click', () => {
    loadSystemStatus();
    loadProviders();
    loadAgents();
    showToast('Status atualizado com sucesso!', 'success');
  });

  // ==================== PROVIDER ACTIONS ====================
  // Save Gemini Key
  const btnSaveGemini = document.getElementById('btn-save-gemini');
  btnSaveGemini.addEventListener('click', async () => {
    const keyInput = document.getElementById('gemini-api-key');
    const key = keyInput.value.trim();
    if (!key) {
      showToast('Por favor, cole sua chave de API do Gemini.', 'error');
      return;
    }

    btnSaveGemini.disabled = true;
    btnSaveGemini.textContent = 'Salvando...';

    try {
      const res = await fetch('/api/providers/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', apiKey: key })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('Chave do Google Gemini configurada com sucesso!', 'success');
        updateGeminiStatus(true);
        keyInput.value = '';
        keyInput.placeholder = 'Chave ativa (••••••••••••)';
      } else {
        showToast('Erro ao salvar chave: ' + (data.message || 'desconhecido'), 'error');
      }
    } catch (err) {
      showToast('Falha na requisição: ' + err.message, 'error');
    } finally {
      btnSaveGemini.disabled = false;
      btnSaveGemini.textContent = 'Salvar Chave';
    }
  });

  // Save Anthropic Key
  const btnSaveAnthropic = document.getElementById('btn-save-anthropic');
  btnSaveAnthropic.addEventListener('click', async () => {
    const keyInput = document.getElementById('anthropic-api-key');
    const key = keyInput.value.trim();
    if (!key) {
      showToast('Por favor, cole sua chave Anthropic.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/providers/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'anthropic', apiKey: key })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Chave Anthropic configurada com sucesso!', 'success');
        keyInput.value = '';
        keyInput.placeholder = 'Chave ativa (••••••••••••)';
      }
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  });

  // Save OpenRouter Key
  const btnSaveOpenRouter = document.getElementById('btn-save-openrouter');
  btnSaveOpenRouter.addEventListener('click', async () => {
    const keyInput = document.getElementById('openrouter-api-key');
    const key = keyInput.value.trim();
    if (!key) return showToast('Cole a chave OpenRouter.', 'error');

    try {
      const res = await fetch('/api/providers/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openrouter', apiKey: key })
      });
      const data = await res.json();
      if (data.success) {
        showToast('OpenRouter configurado com sucesso!', 'success');
        keyInput.value = '';
      }
    } catch (err) {
      showToast('Erro: ' + err.message, 'error');
    }
  });

  // Test Ollama
  document.getElementById('btn-test-ollama').addEventListener('click', async () => {
    showToast('Verificando Ollama local em http://localhost:11434...', 'info');
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'providers test -p ollama' })
      });
      const data = await res.json();
      appendTerminal('ruflo providers test -p ollama', data.output);
      showToast('Teste de Ollama finalizado. Veja o terminal!', 'info');
    } catch (err) {
      showToast('Erro ao testar Ollama: ' + err.message, 'error');
    }
  });

  function updateGeminiStatus(configured) {
    const indicator = document.getElementById('gemini-status-indicator');
    const text = document.getElementById('gemini-status-text');
    if (configured) {
      indicator.innerHTML = '<span class="dot dot-sec"></span> Status: <span class="text-emerald">Configurado & Ativo</span>';
      document.getElementById('active-provider-text').textContent = 'Provedor Ativo: Google Gemini';
    } else {
      indicator.innerHTML = '<span class="dot dot-amber"></span> Status: <span class="text-amber">Chave Pendente</span>';
    }
  }

  // ==================== MISSIONS TAB ====================
  const formMission = document.getElementById('form-mission');
  formMission.addEventListener('submit', async (e) => {
    e.preventDefault();
    const objective = document.getElementById('mission-objective').value.trim();
    const strategy = document.getElementById('mission-strategy').value;
    const provider = document.getElementById('mission-provider').value;
    const coordination = document.getElementById('mission-coordination').value;

    if (!objective) {
      showToast('Por favor, informe o objetivo da missão.', 'error');
      return;
    }

    const btnSubmit = document.getElementById('btn-submit-mission');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="icon">⏳</span> Orquestrando Enxame...';

    showToast(`Iniciando missão com provedor ${provider.toUpperCase()}...`, 'info');

    try {
      const res = await fetch('/api/swarm/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, strategy, provider })
      });
      const data = await res.json();

      renderMissionTimeline(objective, strategy, provider, coordination);
      showToast('Enxame mobilizado com sucesso!', 'success');
      appendTerminal(`ruflo swarm start -o "${objective}" -s ${strategy}`, data.output || 'Swarm started');
    } catch (err) {
      showToast('Erro ao iniciar missão: ' + err.message, 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span class="icon">🚀</span> Iniciar Enxame de Agentes';
    }
  });

  function renderMissionTimeline(objective, strategy, provider, coordination) {
    const timeline = document.getElementById('mission-timeline');
    const badge = document.getElementById('mission-status-badge');
    badge.textContent = 'Enxame em Execução';
    badge.className = 'tag tag-cyan';

    const now = new Date().toLocaleTimeString();

    timeline.innerHTML = `
      <div class="timeline-item">
        <div class="timeline-time">${now}</div>
        <div class="timeline-content">
          <strong>1. Decomposição da Meta (Queen Coordinator)</strong>
          <p>Objetivo aceito: "${objective}". Modo de coordenação: ${coordination.toUpperCase()}. Provedor: ${provider}.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-time">${now}</div>
        <div class="timeline-content">
          <strong>2. Alocação de Agentes Especialistas</strong>
          <p>Agentes <code>Lead Coder</code>, <code>System Architect</code> e <code>QA Tester</code> vinculados ao contexto.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-time">${now}</div>
        <div class="timeline-content">
          <strong>3. Consulta à Memória RuVector</strong>
          <p>Buscando padrões de arquitetura e soluções anteriores semânticas para evitar erros repetidos.</p>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-time">${now}</div>
        <div class="timeline-content">
          <strong>4. Execução de Tarefas em Paralelo</strong>
          <p class="text-emerald">Enxame trabalhando autonomamente sob guardrails de segurança Ruflo.</p>
        </div>
      </div>
    `;
  }

  // ==================== AGENTS MODAL & SPAWN ====================
  const modalSpawn = document.getElementById('modal-spawn');
  document.getElementById('btn-modal-spawn').addEventListener('click', () => {
    modalSpawn.classList.add('open');
  });
  document.getElementById('btn-close-modal').addEventListener('click', () => {
    modalSpawn.classList.remove('open');
  });
  document.getElementById('btn-cancel-spawn').addEventListener('click', () => {
    modalSpawn.classList.remove('open');
  });

  document.getElementById('form-spawn-agent').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('spawn-type').value;
    const name = document.getElementById('spawn-name').value.trim() || `${type}-${Date.now().toString().slice(-4)}`;
    const provider = document.getElementById('spawn-provider').value;
    const task = document.getElementById('spawn-task').value.trim();

    try {
      const res = await fetch('/api/agents/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, provider, task })
      });
      const data = await res.json();
      modalSpawn.classList.remove('open');
      showToast(`Agente ${name} (${type}) spawnado com sucesso!`, 'success');
      loadAgents();
      appendTerminal(`ruflo agent spawn -t ${type} -n "${name}" -p ${provider}`, data.output);
    } catch (err) {
      showToast('Erro ao spawnar agente: ' + err.message, 'error');
    }
  });

  // ==================== QUICK ACTION BUTTONS ====================
  document.getElementById('btn-run-doctor').addEventListener('click', async () => {
    document.getElementById('btn-tab-terminal').click();
    runTerminalCommand('doctor');
  });

  document.getElementById('btn-test-providers').addEventListener('click', async () => {
    document.getElementById('btn-tab-terminal').click();
    runTerminalCommand('providers list');
  });

  document.getElementById('btn-swarm-pheromone').addEventListener('click', async () => {
    document.getElementById('btn-tab-terminal').click();
    runTerminalCommand('swarm pheromone');
  });

  document.getElementById('btn-start-mcp').addEventListener('click', () => {
    document.getElementById('btn-tab-terminal').click();
    appendTerminal('Comando para Conectar Ruflo via MCP:', 'npx -y ruflo mcp start\n\nConfigure no Claude Desktop ou Cursor:\ncommand: npx\nargs: ["-y", "ruflo@latest", "mcp", "start"]');
  });

  // ==================== TERMINAL CLI ====================
  const termInput = document.getElementById('terminal-input');
  const btnRunTerm = document.getElementById('btn-run-term-cmd');
  const termOutput = document.getElementById('terminal-output');

  async function runTerminalCommand(cmd) {
    if (!cmd) return;
    appendTerminalPrompt(cmd);

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      appendTerminalOutput(data.output || '(Comando executado sem retorno)');
    } catch (err) {
      appendTerminalError('Erro de comunicação: ' + err.message);
    }
  }

  btnRunTerm.addEventListener('click', () => {
    const cmd = termInput.value.trim();
    if (cmd) {
      runTerminalCommand(cmd);
      termInput.value = '';
    }
  });

  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnRunTerm.click();
    }
  });

  document.getElementById('btn-clear-terminal').addEventListener('click', () => {
    termOutput.innerHTML = '<div class="term-line info">Terminal limpo. Digite um comando para começar.</div>';
  });

  document.querySelectorAll('.term-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cmd = pill.getAttribute('data-cmd');
      runTerminalCommand(cmd);
    });
  });

  function appendTerminal(title, content) {
    appendTerminalPrompt(title);
    appendTerminalOutput(content);
  }

  function appendTerminalPrompt(cmd) {
    const line = document.createElement('div');
    line.className = 'term-line prompt';
    line.textContent = cmd;
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  function appendTerminalOutput(text) {
    const line = document.createElement('div');
    line.className = 'term-line output';
    line.textContent = text;
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  function appendTerminalError(err) {
    const line = document.createElement('div');
    line.className = 'term-line error';
    line.textContent = err;
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  // ==================== FETCH API HELPERS ====================
  async function loadSystemStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success && data.data) {
        document.getElementById('metric-swarm-state').textContent = data.data.isRunning ? 'ONLINE' : 'ONLINE (STANDBY)';
        document.getElementById('metric-memory-size').textContent = data.data.memorySize || 'RuVector';
        document.getElementById('daemon-status-text').textContent = 'Daemon Ruflo Ativo';
      }
    } catch (err) {
      console.warn('Status error:', err);
    }
  }

  async function loadProviders() {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      if (data.success && data.providers) {
        const google = data.providers.find(p => p.id === 'google');
        if (google) {
          updateGeminiStatus(google.isConfigured);
        }
      }
    } catch (err) {
      console.warn('Providers load error:', err);
    }
  }

  async function loadAgents() {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success && data.agents) {
        renderAgentsTable(data.agents);
        renderAgentsGrid(data.agents);
        document.getElementById('metric-agents-count').textContent = `${data.agents.length} Prontos`;
      }
    } catch (err) {
      console.warn('Agents load error:', err);
    }
  }

  function renderAgentsTable(agents) {
    const tbody = document.getElementById('agents-table-body');
    if (!tbody) return;
    tbody.innerHTML = agents.map(agent => `
      <tr>
        <td><strong>${agent.type.toUpperCase()}</strong></td>
        <td><code>${agent.name}</code></td>
        <td><span class="tag tag-cyan">${agent.provider}</span></td>
        <td><code>${agent.model}</code></td>
        <td><span class="tag tag-emerald">${agent.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="triggerAgentTask('${agent.name}')">Acionar</button>
        </td>
      </tr>
    `).join('');
  }

  function renderAgentsGrid(agents) {
    const grid = document.getElementById('agent-cards-container');
    if (!grid) return;
    
    const icons = {
      coordinator: '👑',
      coder: '💻',
      architect: '🏛️',
      tester: '🧪',
      security: '🛡️',
      researcher: '🔍'
    };

    grid.innerHTML = agents.map(agent => `
      <div class="agent-card">
        <div class="agent-card-header">
          <div class="agent-avatar">${icons[agent.type] || '🤖'}</div>
          <div class="agent-info">
            <h4>${agent.name}</h4>
            <span>${agent.type} • ${agent.model}</span>
          </div>
          <div class="agent-badges">
            <span class="tag tag-emerald">${agent.status}</span>
          </div>
        </div>
        <p class="agent-desc">Agente especializado configurado para atuar no enxame via provedor ${agent.provider.toUpperCase()}.</p>
        <button class="btn btn-outline btn-sm" onclick="triggerAgentTask('${agent.name}')">Atribuir Tarefa</button>
      </div>
    `).join('');
  }

  window.triggerAgentTask = (agentName) => {
    document.getElementById('btn-tab-missions').click();
    document.getElementById('mission-objective').value = `Tarefa direta para o agente ${agentName}: `;
    document.getElementById('mission-objective').focus();
    showToast(`Agente ${agentName} selecionado para nova tarefa`, 'info');
  };

  // ==================== CANVAS TOPOLOGY ANIMATION ====================
  function initSwarmCanvas() {
    const canvas = document.getElementById('swarm-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const nodes = [
      { id: 'queen', label: 'Queen / Coordinator', x: 0.5, y: 0.5, color: '#00f2fe', radius: 18, pulse: 0 },
      { id: 'arch', label: 'Architect', x: 0.25, y: 0.25, color: '#9d4edd', radius: 12, pulse: 0.5 },
      { id: 'coder', label: 'Lead Coder', x: 0.75, y: 0.25, color: '#9d4edd', radius: 14, pulse: 1.0 },
      { id: 'tester', label: 'QA Tester', x: 0.75, y: 0.75, color: '#9d4edd', radius: 12, pulse: 1.5 },
      { id: 'sec', label: 'Security Auditor', x: 0.25, y: 0.75, color: '#05d550', radius: 12, pulse: 2.0 },
      { id: 'mem', label: 'RuVector Memory', x: 0.5, y: 0.15, color: '#ffb703', radius: 10, pulse: 2.5 }
    ];

    let t = 0;
    function animate() {
      t += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Draw connection lines
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i < j && (n1.id === 'queen' || n2.id === 'queen' || Math.abs(i - j) === 1)) {
            ctx.beginPath();
            ctx.moveTo(n1.x * w, n1.y * h);
            ctx.lineTo(n2.x * w, n2.y * h);
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Traveling particle
            const progress = (t * 0.5 + (i + j) * 0.2) % 1;
            const px = (n1.x * (1 - progress) + n2.x * progress) * w;
            const py = (n1.y * (1 - progress) + n2.y * progress) * h;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#00f2fe';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const nx = node.x * w;
        const ny = node.y * h;
        const currentPulse = Math.sin(t * 2 + node.pulse) * 3;

        // Outer glow
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius + 6 + currentPulse, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '22';
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(nx, ny, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#f0f4fc';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, nx, ny + node.radius + 14);
      });

      requestAnimationFrame(animate);
    }
    animate();
  }
});
