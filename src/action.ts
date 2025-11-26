import { AnalisadorPersona } from './analyzer/persona.analyzer';
import { GeradorCard } from './generator/card.generator';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

async function run() {
  try {
    // 1. Obter inputs das variáveis de ambiente (padrão do GitHub Actions)
    const token = process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    let username = process.env.INPUT_USERNAME;
    const outputDir = process.env.INPUT_OUTPUT_DIR || 'dist';

    // Configurar token para o serviço
    if (token) {
      process.env.GITHUB_TOKEN = token;
    }

    // Se não informou usuário, tenta pegar do contexto do repositório
    if (!username) {
      const repo = process.env.GITHUB_REPOSITORY; // formato "owner/repo"
      if (repo) {
        username = repo.split('/')[0];
      }
    }

    if (!username) {
      throw new Error('Nome de usuário não fornecido e não foi possível inferir do repositório.');
    }

    console.log(`iniciando gitpersona action para ${username}`);

    // 2. Executar Análise
    const analisador = new AnalisadorPersona();
    const resultado = await analisador.analisar(username);

    console.log(`persona identificada: ${resultado.persona.titulo}`);

    // 3. Gerar Card
    const gerador = new GeradorCard();
    const svg = gerador.gerarSVG(resultado);

    // 4. Salvar Arquivo
    // Garantir que o diretório existe
    const targetDir = join(process.cwd(), outputDir);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const fileName = 'persona.svg';
    const fullPath = join(targetDir, fileName);
    
    // Usar fs diretamente ou o método do gerador (que salva em 'output' hardcoded, então melhor salvar manual aqui para respeitar o input)
    const fs = require('fs');
    fs.writeFileSync(fullPath, svg);

    console.log(`card gerado com sucesso em ${fullPath}`);
    
    // Definir output para passos posteriores
    console.log(`::set-output name=path::${fullPath}`);

  } catch (error: any) {
    console.error(`falha na execucao: ${error.message}`);
    process.exit(1);
  }
}

run();
