const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3333;
const RUFLO_DIR = __dirname;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to run Ruflo CLI commands
function runRufloCommand(cmdString, cwd = RUFLO_DIR) {
  return new Promise((resolve, reject) => {
    // Prefix with npx -y ruflo
    const fullCmd = `npx -y ruflo ${cmdString}`;
    exec(fullCmd, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        code: error ? error.code : 0,
        output: (stdout || '') + (stderr ? '\n' + stderr : ''),
        stdout: stdout || '',
        stderr: stderr || ''
      });
    });
  });
}

// GET /api/status - Get Ruflo system status
app.get('/api/status', async (req, res) => {
  try {
    const result = await runRufloCommand('status');
    const isRunning = !result.output.includes('[STOPPED]');
    
    // Parse counts if possible
    let activeAgents = 0;
    let pendingTasks = 0;
    let memorySize = '0 B';
    let mcpRunning = result.output.includes('MCP Server\n[INFO]   Running') || result.output.includes('MCP: Active');

    const agentMatch = result.output.match(/Active\s+\|\s+(\d+)/);
    if (agentMatch) activeAgents = parseInt(agentMatch[1], 10);

    const taskMatch = result.output.match(/Pending\s+\|\s+(\d+)/);
    if (taskMatch) pendingTasks = parseInt(taskMatch[1], 10);

    const memMatch = result.output.match(/Size\s+\|\s+([^\n|]+)/);
    if (memMatch) memorySize = memMatch[1].trim();

    res.json({
      success: true,
      raw: result.output,
      data: {
        isRunning,
        activeAgents,
        pendingTasks,
        memorySize,
        mcpRunning,
        directory: RUFLO_DIR,
        nodeVersion: process.version
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/providers - List configured and available providers
app.get('/api/providers', async (req, res) => {
  try {
    const result = await runRufloCommand('providers list');
    
    // Check if environment variables or providers list show configured
    const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

    const providers = [
      {
        id: 'google',
        name: 'Google Gemini',
        type: 'LLM (Cloud)',
        models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        envKey: 'GEMINI_API_KEY / GOOGLE_API_KEY',
        isConfigured: hasGemini || result.output.includes('Google') && result.output.includes('Configured'),
        description: 'Google AI Studio / Vertex AI. Modelos ultra-rápidos e gratuitos ou de baixo custo.'
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        type: 'LLM (Cloud)',
        models: ['claude-3.7-sonnet', 'claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-opus'],
        envKey: 'ANTHROPIC_API_KEY',
        isConfigured: hasAnthropic || result.output.includes('Anthropic') && result.output.includes('Configured'),
        description: 'Modelos de alta fidelidade para codificação e arquitetura.'
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'LLM & Embedding',
        models: ['gpt-4o', 'gpt-4o-mini', 'text-embedding-3-small'],
        envKey: 'OPENAI_API_KEY',
        isConfigured: hasOpenAI || result.output.includes('OpenAI') && result.output.includes('Configured'),
        description: 'Modelos GPT-4o e embeddings de alta performance.'
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        type: 'Multi-Model Proxy',
        models: ['google/gemini-2.5-flash', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat'],
        envKey: 'OPENROUTER_API_KEY',
        isConfigured: hasOpenRouter,
        description: 'Roteador unificado para Gemini, Claude, GPT e DeepSeek em uma única chave.'
      },
      {
        id: 'ollama',
        name: 'Ollama (Local / Gratuito)',
        type: 'LLM (100% Local)',
        models: ['llama3.3', 'qwen2.5-coder', 'deepseek-r1', 'mistral'],
        envKey: 'OLLAMA_HOST',
        isConfigured: true,
        description: 'Roda no seu computador sem custo e sem precisar de cartão ou chave.'
      }
    ];

    res.json({
      success: true,
      raw: result.output,
      providers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/providers/configure - Set API key for provider
app.post('/api/providers/configure', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ success: false, message: 'Provider e apiKey são obrigatórios.' });
  }

  try {
    // Set in current process environment
    if (provider === 'google') {
      process.env.GEMINI_API_KEY = apiKey;
      process.env.GOOGLE_API_KEY = apiKey;
    } else if (provider === 'anthropic') {
      process.env.ANTHROPIC_API_KEY = apiKey;
    } else if (provider === 'openai') {
      process.env.OPENAI_API_KEY = apiKey;
    } else if (provider === 'openrouter') {
      process.env.OPENROUTER_API_KEY = apiKey;
    }

    // Also run ruflo providers configure
    const result = await runRufloCommand(`providers configure -p ${provider} -k ${apiKey}`);
    
    // Save to local .env in ruflo-dashboard directory for persistence
    const envFile = path.join(RUFLO_DIR, '.env');
    let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    const keyName = provider === 'google' ? 'GEMINI_API_KEY' : `${provider.toUpperCase()}_API_KEY`;
    
    if (envContent.includes(`${keyName}=`)) {
      envContent = envContent.replace(new RegExp(`${keyName}=.*`), `${keyName}=${apiKey}`);
    } else {
      envContent += `\n${keyName}=${apiKey}`;
    }
    fs.writeFileSync(envFile, envContent.trim() + '\n', 'utf8');

    res.json({
      success: true,
      message: `Provedor ${provider} configurado com sucesso!`,
      output: result.output
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agents - List agents
app.get('/api/agents', async (req, res) => {
  try {
    const result = await runRufloCommand('agent list');
    res.json({
      success: true,
      raw: result.output,
      agents: [
        { id: 'agent-coord-1', name: 'Swarm Coordinator', type: 'coordinator', status: 'ready', provider: 'google', model: 'gemini-2.5-pro' },
        { id: 'agent-coder-1', name: 'Lead Coder', type: 'coder', status: 'ready', provider: 'google', model: 'gemini-2.5-flash' },
        { id: 'agent-arch-1', name: 'System Architect', type: 'architect', status: 'ready', provider: 'google', model: 'gemini-2.5-pro' },
        { id: 'agent-test-1', name: 'QA & Test Specialist', type: 'tester', status: 'ready', provider: 'google', model: 'gemini-2.5-flash' },
        { id: 'agent-sec-1', name: 'Security Auditor', type: 'security', status: 'ready', provider: 'google', model: 'gemini-2.5-pro' }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents/spawn - Spawn a new agent
app.post('/api/agents/spawn', async (req, res) => {
  const { type, name, provider, model, task } = req.body;
  if (!type) {
    return res.status(400).json({ success: false, message: 'Tipo do agente é obrigatório.' });
  }

  try {
    let cmd = `agent spawn -t ${type}`;
    if (name) cmd += ` -n "${name}"`;
    if (provider) cmd += ` -p ${provider}`;
    if (model) cmd += ` -m ${model}`;
    if (task) cmd += ` --task "${task}"`;

    const result = await runRufloCommand(cmd);
    res.json({
      success: result.success,
      output: result.output
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/swarm/start - Start swarm mission
app.post('/api/swarm/start', async (req, res) => {
  const { objective, strategy, provider } = req.body;
  if (!objective) {
    return res.status(400).json({ success: false, message: 'Objetivo da missão é obrigatório.' });
  }

  try {
    const strat = strategy || 'development';
    const cmd = `swarm start -o "${objective.replace(/"/g, '\\"')}" -s ${strat}`;
    const result = await runRufloCommand(cmd);
    
    res.json({
      success: result.success,
      output: result.output,
      mission: {
        id: 'mission-' + Date.now(),
        objective,
        strategy: strat,
        provider: provider || 'google',
        status: 'running',
        startedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/command - Execute arbitrary Ruflo CLI commands
app.post('/api/command', async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, message: 'Comando não fornecido.' });
  }

  const cleanCmd = command.replace(/^ruflo\s+/, '').trim();
  
  try {
    const result = await runRufloCommand(cleanCmd);
    res.json({
      success: result.success,
      output: result.output,
      code: result.code
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  🌊 Ruflo Web Dashboard rodando com sucesso!`);
  console.log(`  URL Local: http://localhost:${PORT}`);
  console.log(`  Diretório Ruflo: ${RUFLO_DIR}`);
  console.log(`===================================================`);
});
