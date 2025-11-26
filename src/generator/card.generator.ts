import { ResultadoPersona, TipoPersona, EstatisticasAnalisadas } from '../types';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

interface CaracteristicaVisual {
  icone: string;
  valor: string;
  label: string;
}

const ICONES = {
  REPO: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  CODE: "M4.72 3.22a.75.75 0 0 1 1.06 1.06L2.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25Zm6.56 0a.75.75 0 1 0-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06l-4.25-4.25Z",
  STAR: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z",
  COMMIT: "M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 1 1 0-1.5h3.32a4.001 4.001 0 0 1 7.86 0h3.32a.75.75 0 1 1 0 1.5h-3.32Z",
  BUG: "M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
  CLOCK: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.75.75 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z",
  CHECK: "M12 1c6.075 0 11 4.925 11 11S18.075 23 12 23 1 18.075 1 12 5.925 1 12 1Zm-1.9 16.45l9.45-9.45a.75.75 0 0 0-1.1-1.02l-8.35 8.35-4.35-4.35a.75.75 0 1 0-1.06 1.06l4.88 4.88a.75.75 0 0 0 1.06 0Z",
  FIRE: "M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15",
  ROCKET: "M15.183 1.618a.75.75 0 0 0-1.06 0l-3.536 3.536a.75.75 0 0 0 0 1.06l1.06 1.06-6.364 6.364a.75.75 0 0 0 0 1.06l1.06 1.06a.75.75 0 0 0 1.06 0l6.364-6.364 1.06 1.06a.75.75 0 0 0 1.06 0l3.536-3.536a.75.75 0 0 0 0-1.06l-4.24-4.24ZM3.515 12.485l6.364-6.364.707.707-6.364 6.364-.707-.707ZM14.485 3.515l.707.707-3.536 3.536-.707-.707 3.536-3.536Z",
  CONTAINER: "M1 3.5c0-.828.672-1.5 1.5-1.5h11c.828 0 1.5.672 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 6.5v-3Zm1.5 0v3h11v-3h-11Zm0 6c0-.828.672-1.5 1.5-1.5h11c.828 0 1.5.672 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-3Zm1.5 0v3h11v-3h-11Z",
  GEAR: "M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.86z"
};

export class GeradorCard {
  async gerarSVG(resultado: ResultadoPersona): Promise<string> {
    const { persona, estatisticas, nomeUsuario } = resultado;

    // Agora o caminhoImagem é uma URL pública
    const imagemBase64 = await this.imagemParaBase64(persona.caminhoImagem);

    const larguraCard = 750;
    const alturaCard = 220;
    
    // cores padrao do tema dark
    const corFundo = '#0d1117';
    const corFundoSecundario = '#161b22';
    const corBorda = '#30363d';
    const corTexto = '#e6edf3';
    const corTitulo = '#ffffff';
    const corSubtitulo = '#8d96a0';
    const corAcento = '#7ee787';

    const caracteristicas = this.obterCaracteristicas(persona.tipo, estatisticas);

    return `
<svg width="${larguraCard}" height="${alturaCard}" viewBox="0 0 ${larguraCard} ${alturaCard}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradienteCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${corFundoSecundario};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${corFundo};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${larguraCard}" height="${alturaCard}" fill="url(#gradienteCard)" rx="12"/>
  <rect x="1.5" y="1.5" width="${larguraCard - 3}" height="${alturaCard - 3}" fill="none" stroke="${corBorda}" stroke-width="2" rx="10.5"/>
  
  <rect x="20" y="20" width="180" height="180" fill="${corFundoSecundario}" rx="10"/>
  <rect x="21" y="21" width="178" height="178" fill="none" stroke="${corBorda}" stroke-width="1" rx="9"/>
  <image x="28" y="28" width="164" height="164" href="data:image/png;base64,${imagemBase64}" clip-path="inset(0% round 8px)" />
  
  <g transform="translate(220, 45)">
    <text x="0" y="0" font-family="'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif" font-size="24" font-weight="700">
      <tspan fill="${corTitulo}">${this.escaparXml(nomeUsuario)}</tspan>
      <tspan fill="${corSubtitulo}" font-weight="400"> / ${this.escaparXml(persona.titulo)}</tspan>
    </text>
    
    <text x="0" y="30" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" fill="${corSubtitulo}" font-style="italic">
      <tspan fill="${corTitulo}" font-weight="600">Perfil: </tspan>${this.escaparXml(persona.perfil)}
    </text>
    
    <line x1="0" y1="50" x2="500" y2="50" stroke="${corBorda}" stroke-width="1" opacity="0.5"/>
    
    <g transform="translate(0, 80)">
      ${this.gerarStatsHorizontal(caracteristicas, corTexto, corAcento, corSubtitulo)}
    </g>
  </g>
</svg>`.trim();
  }

  private gerarStatsHorizontal(stats: CaracteristicaVisual[], corTexto: string, corAcento: string, corLabel: string): string {
    return stats.map((stat, i) => {
      const x = i * 170;
      // Ajuste de escala para os icones
      let scale = 1.3;
      let translateY = 0;
      
      if (stat.icone === ICONES.CHECK) {
        scale = 1.0;
        translateY = 2;
      } else if (stat.icone === ICONES.FIRE) {
        scale = 1.3;
        translateY = 0;
      } else if (stat.icone === ICONES.ROCKET) {
        scale = 1.0;
        translateY = 2;
      } else if (stat.icone === ICONES.GEAR) {
        scale = 1.2;
        translateY = 1;
      } else if (stat.icone === ICONES.CONTAINER) {
        scale = 1.2;
        translateY = 1;
      }
      
      return `
      <g transform="translate(${x}, 0)">
        <g transform="translate(0, -5)">
          <path d="${stat.icone}" fill="${corAcento}" transform="scale(${scale}) translate(0, ${translateY})"/>
          <text x="32" y="16" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="600" fill="${corTexto}">
            ${this.escaparXml(stat.valor)}
          </text>
        </g>
        <text x="2" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" fill="${corLabel}">
          ${this.escaparXml(stat.label)}
        </text>
      </g>
      `;
    }).join('');
  }

  private obterCaracteristicas(tipoPersona: TipoPersona, stats: EstatisticasAnalisadas): CaracteristicaVisual[] {
    switch (tipoPersona) {
      case TipoPersona.EXPLORADOR:
        return [
          { icone: ICONES.REPO, valor: stats.totalRepositorios.toString(), label: 'Totais Repositórios' },
          { icone: ICONES.STAR, valor: stats.totalStars.toString(), label: 'Totais estrelas' },
          { icone: ICONES.CODE, valor: stats.linguagensUsadas.length.toString(), label: 'Linguagens' }
        ];

      case TipoPersona.PROGRAMADOR_VIGOROSO:
        // Se a sequência atual é maior ou igual à maior sequência, mostra a atual
        // Caso contrário, mostra a maior sequência histórica
        const sequenciaAtualMaiorOuIgual = stats.sequenciaAtual >= stats.maiorSequencia;
        const diasSequencia = sequenciaAtualMaiorOuIgual ? stats.sequenciaAtual : stats.maiorSequencia;
        const labelSequencia = sequenciaAtualMaiorOuIgual ? 'Sequência Atual' : 'Maior Sequência';
        return [
          { icone: ICONES.COMMIT, valor: stats.totalCommits.toString(), label: 'Totais Commits' },
          { icone: ICONES.FIRE, valor: `${diasSequencia} dias`, label: labelSequencia },
          { icone: ICONES.CODE, valor: stats.linguagemPrincipal, label: 'Linguagem Foco' }
        ];

      case TipoPersona.BUG_HUNTER:
        return [
          { icone: ICONES.BUG, valor: stats.totalIssuesCriadas.toString(), label: 'Issues Criadas' },
          { icone: ICONES.COMMIT, valor: stats.totalCommits.toString(), label: 'Totais Commits' },
          { icone: ICONES.REPO, valor: stats.totalRepositorios.toString(), label: 'Totais Repositórios' }
        ];

      case TipoPersona.DEVOPS:
        const containerizacao = stats.temDockerfiles ? 'Docker' : 'Não';
        const automacao = stats.temScriptsAutomacao ? 'Sim' : 'Não';
        return [
          { icone: ICONES.ROCKET, valor: stats.reposComActions.toString(), label: 'Projetos com CI/CD' },
          { icone: ICONES.CONTAINER, valor: containerizacao, label: 'Containerização' },
          { icone: ICONES.GEAR, valor: automacao, label: 'Scripts Automação' }
        ];

      case TipoPersona.ESTUDANTE:
        return [
          { icone: ICONES.CODE, valor: stats.linguagemPrincipal, label: 'Linguagem Principal' },
          { icone: ICONES.REPO, valor: stats.totalRepositorios.toString(), label: 'Totais Repositórios' },
          { icone: ICONES.COMMIT, valor: stats.totalCommits.toString(), label: 'Totais Commits' }
        ];

      default:
        return [
          { icone: ICONES.REPO, valor: stats.totalRepositorios.toString(), label: 'Totais Repositórios' },
          { icone: ICONES.CODE, valor: stats.linguagensUsadas.length.toString(), label: 'Linguagens' },
          { icone: ICONES.STAR, valor: stats.totalStars.toString(), label: 'Totais Estrelas' }
        ];
    }
  }



  private async imagemParaBase64(urlImagem: string): Promise<string> {
    try {
      const response = await axios.get(urlImagem, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      return buffer.toString('base64');
    } catch (erro) {
      console.error(`erro ao baixar imagem: ${urlImagem}`, erro);
      return '';
    }
  }

  private escaparXml(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  salvarSVG(svg: string, nomeUsuario: string): string {
    const diretorioSaida = join(process.cwd(), 'output');
    if (!existsSync(diretorioSaida)) {
      mkdirSync(diretorioSaida, { recursive: true });
    }

    const caminhoSaida = join(diretorioSaida, `${nomeUsuario}.svg`);
    writeFileSync(caminhoSaida, svg, 'utf-8');
    return caminhoSaida;
  }
}
