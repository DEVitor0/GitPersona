import 'dotenv/config';
import { Command } from 'commander';
import { AnalisadorPersona } from './analyzer/persona.analyzer';
import { GeradorCard } from './generator/card.generator';

const programa = new Command();

programa
  .name('gitpersona')
  .description('analisa desenvolvedores do github e gera personas visuais')
  .version('1.0.0');

programa
  .command('analyze')
  .description('analisa um usuario do github e gera sua persona')
  .argument('<nomeUsuario>', 'nome de usuario do github')
  .option('-o, --output <caminho>', 'diretorio de saida para o svg', 'output')
  .action(async (nomeUsuario: string, opcoes: { output: string }) => {
    try {
      console.log(`analisando ${nomeUsuario}`);
      
      const analisador = new AnalisadorPersona();
      const resultado = await analisador.analisar(nomeUsuario);
      
      console.log(`\npersona identificada: ${resultado.persona.titulo}`);
      console.log(`confianca: ${resultado.pontuacao.toFixed(1)}%`);
      console.log(`\nperfil: ${resultado.persona.perfil}`);
      console.log(`\ncriterios atendidos:`);
      resultado.criteriosAtendidos.forEach(criterio => console.log(`   - ${criterio}`));
      
      console.log(`\nestatisticas:`);
      console.log(`   - repositorios: ${resultado.estatisticas.totalRepositorios}`);
      console.log(`   - linguagem principal: ${resultado.estatisticas.linguagemPrincipal}`);
      console.log(`   - stars totais: ${resultado.estatisticas.totalStars}`);
      console.log(`   - commits totais: ${resultado.estatisticas.totalCommits}`);
      console.log(`   - commits recentes: ${resultado.estatisticas.frequenciaCommits}`);
      
      console.log(`\ngerando card svg`);
      const geradorCard = new GeradorCard();
      const svg = await geradorCard.gerarSVG(resultado);
      const caminhoSaida = geradorCard.salvarSVG(svg, nomeUsuario);
      
      console.log(`card salvo em ${caminhoSaida}`);
      console.log(`\nuse no seu readme:`);
      console.log(`   ![GitPersona](${caminhoSaida})`);
      
    } catch (erro: any) {
      console.error(`erro: ${erro.message}`);
      process.exit(1);
    }
  });

programa
  .command('server')
  .description('inicia o servidor web para geracao dinamica de cards')
  .option('-p, --port <porta>', 'porta do servidor', '3000')
  .action((opcoes: { port: string }) => {
    process.env.PORT = opcoes.port;
    require('./server');
  });

programa.parse();
