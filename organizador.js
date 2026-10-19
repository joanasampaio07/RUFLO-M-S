/**
 * 📁 Ruflo Utility: Organizador Inteligente de Arquivos
 * Desenvolvido pelo Enxame de Agentes Ruflo (Gemini Engine)
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = {
  'Imagens': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
  'Documentos': ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'],
  'Planilhas': ['.xlsx', '.xls', '.csv'],
  'Compactados': ['.zip', '.rar', '.7z', '.tar', '.gz'],
  'Audios_Videos': ['.mp3', '.wav', '.mp4', '.mkv', '.avi'],
  'Codigos': ['.js', '.py', '.html', '.css', '.json', '.ts', '.sql']
};

function getCategory(ext) {
  ext = ext.toLowerCase();
  for (const [category, extensions] of Object.entries(CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }
  return 'Outros';
}

function organizeDirectory(targetDir) {
  console.log('\n======================================================');
  console.log('  🌊 RUFLO FILE ORGANIZER — ORGANIZADOR DE ARQUIVOS');
  console.log(`  Alvo: ${targetDir}`);
  console.log('======================================================\n');

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ O diretório informado não existe: ${targetDir}`);
    return;
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const files = entries.filter(e => e.isFile());

  if (files.length === 0) {
    console.log('ℹ️  Nenhum arquivo solto encontrado para organizar nesta pasta.');
    return;
  }

  const stats = {};

  files.forEach(file => {
    // Não mover o próprio script nem arquivos essenciais de configuração
    if (['organizador.js', 'cotacoes.js', 'server.js', 'package.json', 'package-lock.json'].includes(file.name)) {
      return;
    }

    const ext = path.extname(file.name);
    const category = getCategory(ext);
    const categoryDir = path.join(targetDir, category);

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    const oldPath = path.join(targetDir, file.name);
    let newPath = path.join(categoryDir, file.name);

    // Evitar sobrescrever se já existir
    if (fs.existsSync(newPath)) {
      const base = path.basename(file.name, ext);
      newPath = path.join(categoryDir, `${base}_${Date.now().toString().slice(-4)}${ext}`);
    }

    fs.renameSync(oldPath, newPath);

    stats[category] = (stats[category] || 0) + 1;
    console.log(`  ✓ [${category}] ${file.name} -> ${path.basename(newPath)}`);
  });

  console.log('\n----------------- RESUMO DA OPERAÇÃO -----------------');
  Object.entries(stats).forEach(([cat, count]) => {
    console.log(`  📁 ${cat.padEnd(16)}: ${count} arquivo(s) organizado(s)`);
  });
  console.log('======================================================');
  console.log('✨ Tarefa concluída com sucesso pelo agente Gemini Coder!\n');
}

// Cria uma pasta de demonstração para testar sem risco
function runDemo() {
  const demoDir = path.join(__dirname, 'pasta_teste_organizacao');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir);
  }

  const testFiles = [
    'relatorio_financeiro.pdf',
    'foto_viagem.jpg',
    'planilha_gastos.xlsx',
    'backup_sistema.zip',
    'anotacoes.txt',
    'logo_empresa.png'
  ];

  testFiles.forEach(f => {
    const fPath = path.join(demoDir, f);
    if (!fs.existsSync(fPath)) {
      fs.writeFileSync(fPath, 'Conteúdo de teste gerado pelo Ruflo');
    }
  });

  console.log('🧪 Pasta de demonstração criada com arquivos de exemplo!');
  organizeDirectory(demoDir);
}

const args = process.argv.slice(2);
if (args.includes('--demo') || args.length === 0) {
  runDemo();
} else {
  organizeDirectory(args[0]);
}
