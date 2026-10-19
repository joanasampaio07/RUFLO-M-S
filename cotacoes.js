/**
 * 🪙 Ruflo Utility: Monitor e Conversor de Moedas em Tempo Real
 * Desenvolvido pelo Enxame de Agentes Ruflo (Gemini Engine)
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,GBP-BRL';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

async function main() {
  console.log('\n======================================================');
  console.log('  🌊 RUFLO CURRENCY TRACKER — COTAÇÕES EM TEMPO REAL');
  console.log('  Horário: ' + new Date().toLocaleString('pt-BR'));
  console.log('======================================================\n');

  try {
    const res = await fetch(API_URL, {
      headers: { 'User-Agent': 'Ruflo-Agent-Harness/3.0' }
    });
    
    if (!res.ok) {
      throw new Error(`Status HTTP: ${res.status}`);
    }

    const rates = await res.json();

    const items = [
      { name: 'Dólar Comercial (USD)', data: rates.USDBRL },
      { name: 'Euro (EUR)', data: rates.EURBRL },
      { name: 'Bitcoin (BTC)', data: rates.BTCBRL },
      { name: 'Libra Esterlina (GBP)', data: rates.GBPBRL }
    ];

    items.forEach(({ name, data }) => {
      if (!data) return;
      const bid = parseFloat(data.bid);
      const pctChange = parseFloat(data.pctChange);
      const varSymbol = pctChange >= 0 ? '▲ +' : '▼ ';
      const varColor = pctChange >= 0 ? '\x1b[32m' : '\x1b[31m'; // Verde ou Vermelho
      const resetColor = '\x1b[0m';

      console.log(`📌 ${name}`);
      console.log(`   Valor Atual : ${formatCurrency(bid)}`);
      console.log(`   Variação Dia: ${varColor}${varSymbol}${pctChange.toFixed(2)}%${resetColor}`);
      console.log(`   Máxima / Mín: ${formatCurrency(data.high)} / ${formatCurrency(data.low)}`);
      console.log('------------------------------------------------------');
    });

    // Salvar relatório em JSON
    const reportPath = path.join(__dirname, 'cotacoes-historico.json');
    const logEntry = {
      timestamp: new Date().toISOString(),
      rates: {
        USD: rates.USDBRL?.bid,
        EUR: rates.EURBRL?.bid,
        BTC: rates.BTCBRL?.bid,
        GBP: rates.GBPBRL?.bid
      }
    };

    let history = [];
    if (fs.existsSync(reportPath)) {
      try {
        history = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch (e) {}
    }
    history.push(logEntry);
    fs.writeFileSync(reportPath, JSON.stringify(history, null, 2), 'utf8');

    console.log(`\n💾 Histórico salvo com sucesso em:`);
    console.log(`   ${reportPath}`);
    console.log('\n✨ Execução finalizada com sucesso pelo agente Gemini Coder!\n');

  } catch (error) {
    console.error('❌ Erro ao consultar cotações:', error.message);
  }
}

main();
