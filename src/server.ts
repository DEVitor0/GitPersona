import 'dotenv/config';
import express, { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AnalisadorPersona } from './analyzer/persona.analyzer';
import { GeradorCard } from './generator/card.generator';

const app = express();
const PORTA = process.env.PORT || 3000;

const analisador = new AnalisadorPersona();
const geradorCard = new GeradorCard();

const cache = new Map<string, { svg: string; timestamp: number }>();
const DURACAO_CACHE = 3600000;

app.get('/:nomeUsuario', async (req: Request, res: Response) => {
  const { nomeUsuario } = req.params;

  if (!nomeUsuario || nomeUsuario === 'favicon.ico') {
    return res.status(404).end();
  }

  try {
    // Chave de cache simples apenas com nome de usuário
    const chaveCache = nomeUsuario;
    const emCache = cache.get(chaveCache);
    
    if (emCache && Date.now() - emCache.timestamp < DURACAO_CACHE) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(emCache.svg);
    }

    console.log(`analisando ${nomeUsuario}`);
    const resultado = await analisador.analisar(nomeUsuario);
    const svg = geradorCard.gerarSVG(resultado);

    cache.set(chaveCache, { svg, timestamp: Date.now() });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);

  } catch (erro: any) {
    console.error(`erro ao processar ${nomeUsuario}`, erro.message);
    
    const svgErro = gerarSVGErro(erro.message);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(500).send(svgErro);
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

function gerarSVGErro(mensagem: string): string {
  const isRateLimit = mensagem.includes('403') || mensagem.includes('rate limit');
  const isNotFound = mensagem.includes('não encontrado') || mensagem.includes('404');
  
  let titulo = 'Erro Desconhecido';
  let subtexto = mensagem;

  if (isRateLimit) {
    titulo = 'Rate Limit Excedido';
    subtexto = 'Aguarde alguns minutos ou configure um token';
  } else if (isNotFound) {
    titulo = 'Usuário Não Encontrado';
    subtexto = 'Verifique se o nome de usuário está correto';
  }

  let imagemBase64 = '';
  try {
      const caminhoImagem = join(process.cwd(), 'assets/personas/ops.png');
      imagemBase64 = readFileSync(caminhoImagem).toString('base64');
  } catch (e) {
      console.error('erro ao carregar imagem de erro', e);
  }

  const larguraCard = 750;
  const alturaCard = 220;
  const corFundo = '#0d1117';
  const corFundoSecundario = '#161b22';
  const corBorda = '#30363d';
  const corTitulo = '#ff7b72'; // Vermelho suave
  const corTexto = '#8b949e';

  return `
<svg width="${larguraCard}" height="${alturaCard}" viewBox="0 0 ${larguraCard} ${alturaCard}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradienteErro" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${corFundoSecundario};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${corFundo};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${larguraCard}" height="${alturaCard}" fill="url(#gradienteErro)" rx="12"/>
  <rect x="1.5" y="1.5" width="${larguraCard - 3}" height="${alturaCard - 3}" fill="none" stroke="${corBorda}" stroke-width="2" rx="10.5"/>
  
  <!-- Container da Imagem -->
  <rect x="20" y="20" width="180" height="180" fill="${corFundoSecundario}" rx="10"/>
  <rect x="21" y="21" width="178" height="178" fill="none" stroke="${corBorda}" stroke-width="1" rx="9"/>
  ${imagemBase64 ? `<image x="28" y="28" width="164" height="164" href="data:image/png;base64,${imagemBase64}" clip-path="inset(0% round 8px)" />` : ''}
  
  <g transform="translate(220, 70)">
    <text x="0" y="0" font-family="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif" font-size="28" font-weight="700" fill="${corTitulo}">
      ${titulo}
    </text>
    
    <text x="0" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="16" fill="${corTexto}">
      ${subtexto}
    </text>
    
    <line x1="0" y1="60" x2="60" y2="60" stroke="${corBorda}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`.trim();
}

app.listen(PORTA, () => {
  console.log(`os cards sao criados em http://localhost:${PORTA}/:username`);
});

export default app;
