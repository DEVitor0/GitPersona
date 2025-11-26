import { DadosGitHub, EstatisticasAnalisadas, ResultadoPersona, TipoPersona } from '../types';
import { PERSONAS } from '../config/personas';
import { ServicoGitHub } from '../services/github.service';

export class AnalisadorPersona {
  private servicoGitHub: ServicoGitHub;

  constructor() {
    this.servicoGitHub = new ServicoGitHub();
  }

  async analisar(nomeUsuario: string): Promise<ResultadoPersona> {
    const dadosGitHub = await this.servicoGitHub.obterDadosUsuario(nomeUsuario);
    const estatisticas = await this.calcularEstatisticas(dadosGitHub);
    const tipoPersona = this.determinarPersona(estatisticas, dadosGitHub);
    const persona = PERSONAS[tipoPersona];
    const { pontuacao, criteriosAtendidos } = this.calcularConfianca(tipoPersona, estatisticas, dadosGitHub);

    return {
      nomeUsuario,
      persona,
      estatisticas,
      pontuacao,
      criteriosAtendidos
    };
  }

  private async calcularEstatisticas(dados: DadosGitHub): Promise<EstatisticasAnalisadas> {
    const linguagens = dados.repositorios
      .map(repo => repo.language)
      .filter(lang => lang !== null) as string[];
    const linguagensUsadas = [...new Set(linguagens)];

    // Agrupar linguagens por stack para calcular diversidade real
    const stacks = this.agruparPorStack(linguagensUsadas);
    
    const contagemLinguagens: Record<string, number> = {};
    linguagens.forEach(lang => {
      contagemLinguagens[lang] = (contagemLinguagens[lang] || 0) + 1;
    });
    const linguagemPrincipal = Object.keys(contagemLinguagens).sort(
      (a, b) => contagemLinguagens[b] - contagemLinguagens[a]
    )[0] || '-';

    const totalStars = dados.repositorios.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = dados.repositorios.reduce((sum, repo) => sum + repo.forks_count, 0);
    const issuesAbertas = dados.repositorios.reduce((sum, repo) => sum + repo.open_issues_count, 0);
    const frequenciaCommits = dados.commits.length;
    
    // buscar total de issues criadas pelo usuario
    const totalIssuesCriadas = await this.servicoGitHub.contarIssuesCriadas(dados.nomeUsuario);
    
    // buscar total de commits na conta (fallback para frequenciaCommits se falhar ou for 0)
    let totalCommits = await this.servicoGitHub.obterTotalCommits(dados.nomeUsuario);
    if (totalCommits === 0) totalCommits = frequenciaCommits;

    let temGitHubActions = false;
    let temDockerfiles = false;
    let temScriptsAutomacao = false;
    let temTerraform = false;
    let temAnsible = false;
    let reposComActions = 0;
    
    // Verificar apenas os primeiros 10 repositórios para otimizar performance
    // Foco em automação: CI/CD (Actions), containerização (Docker) e scripts
    const reposParaVerificar = dados.repositorios.slice(0, Math.min(10, dados.repositorios.length));
    
    // Fazer verificações em paralelo para acelerar
    const verificacoes = reposParaVerificar.map(async (repo) => {
      const [hasActions, hasDocker, hasScripts] = await Promise.all([
        this.servicoGitHub.temGitHubActions(dados.nomeUsuario, repo.name),
        this.servicoGitHub.temDockerfile(dados.nomeUsuario, repo.name),
        this.servicoGitHub.temScriptsAutomacao(dados.nomeUsuario, repo.name)
      ]);
      
      return { hasActions, hasDocker, hasScripts };
    });
    
    const resultados = await Promise.all(verificacoes);
    
    resultados.forEach(resultado => {
      if (resultado.hasActions) {
        temGitHubActions = true;
        reposComActions++;
      }
      if (resultado.hasDocker && !temDockerfiles) {
        temDockerfiles = true;
      }
      if (resultado.hasScripts && !temScriptsAutomacao) {
        temScriptsAutomacao = true;
      }
    });
    
    // Verificar IaC apenas se já tem indícios de DevOps (otimização)
    if (temGitHubActions || temDockerfiles) {
      const reposIaC = dados.repositorios.slice(0, Math.min(3, dados.repositorios.length));
      for (const repo of reposIaC) {
        if (!temTerraform || !temAnsible) {
          const [hasTerraform, hasAnsible] = await Promise.all([
            this.servicoGitHub.temTerraform(dados.nomeUsuario, repo.name),
            this.servicoGitHub.temAnsible(dados.nomeUsuario, repo.name)
          ]);
          if (hasTerraform) temTerraform = true;
          if (hasAnsible) temAnsible = true;
        }
        if (temTerraform && temAnsible) break;
      }
    }

    const pontuacaoDiversidade = linguagensUsadas.length / Math.max(dados.repositorios.length, 1) * 100;
    const pontuacaoConsistencia = Math.min(frequenciaCommits * 2, 100);
    
    // Calcular dias ativos e sequência atual (streak) com dados completos via GraphQL
    const contribDetalhes = await this.servicoGitHub.obterContribuicoesDetalhadas(dados.nomeUsuario);

    const diasAtivosSet = new Set<string>(contribDetalhes.dias);
    dados.commits.forEach(c => {
      diasAtivosSet.add(c.data.split('T')[0]);
    });

    const datasOrdenadas = Array.from(diasAtivosSet).sort();
    const diasAtivos = diasAtivosSet.size;

    let sequenciaAtual = contribDetalhes.sequenciaAtual;
    let maiorSequencia = contribDetalhes.maiorSequencia;

    if (sequenciaAtual === 0 || maiorSequencia === 0) {
      if (datasOrdenadas.length > 0) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let sequenciaCorrenteTemp = 1;
        maiorSequencia = 1;

        for (let i = 1; i < datasOrdenadas.length; i++) {
          const dataAnterior = new Date(datasOrdenadas[i - 1]);
          const dataAtual = new Date(datasOrdenadas[i]);
          dataAnterior.setHours(0, 0, 0, 0);
          dataAtual.setHours(0, 0, 0, 0);

          const diffDias = Math.round((dataAtual.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDias === 1) {
            sequenciaCorrenteTemp++;
          } else {
            if (sequenciaCorrenteTemp > maiorSequencia) {
              maiorSequencia = sequenciaCorrenteTemp;
            }
            sequenciaCorrenteTemp = 1;
          }
        }

        if (sequenciaCorrenteTemp > maiorSequencia) {
          maiorSequencia = sequenciaCorrenteTemp;
        }

        const ultimaData = new Date(datasOrdenadas[datasOrdenadas.length - 1]);
        ultimaData.setHours(0, 0, 0, 0);
        const diasDesdeUltimoCommit = Math.round((hoje.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24));

        if (diasDesdeUltimoCommit <= 1) {
          sequenciaAtual = sequenciaCorrenteTemp;
        } else {
          sequenciaAtual = 0;
        }
      }
    }

    return {
      totalRepositorios: dados.repositoriosPublicos,
      linguagensUsadas,
      linguagemPrincipal,
      totalStars,
      totalForks,
      issuesAbertas,
      issuesFechadas: 0,
      totalIssuesCriadas,
      totalCommits,
      frequenciaCommits,
      diasAtivos,
      sequenciaAtual,
      maiorSequencia,
      temGitHubActions,
      temDockerfiles,
      reposComActions,
      temScriptsAutomacao,
      temTerraform,
      temAnsible,
      pontuacaoDiversidade,
      pontuacaoConsistencia
    };
  }

  // Agrupa linguagens por stack (frontend, backend, mobile, etc)
  private agruparPorStack(linguagens: string[]): Set<string> {
    const stacks = new Set<string>();
    const stackMap: Record<string, string> = {
      'HTML': 'frontend', 'CSS': 'frontend', 'JavaScript': 'frontend', 
      'TypeScript': 'frontend', 'SCSS': 'frontend', 'Less': 'frontend',
      'Vue': 'frontend', 'Svelte': 'frontend',
      'Python': 'backend', 'Java': 'backend', 'Go': 'backend', 
      'Ruby': 'backend', 'PHP': 'backend', 'C#': 'backend',
      'Rust': 'backend', 'Kotlin': 'backend', 'Scala': 'backend',
      'Swift': 'mobile', 'Objective-C': 'mobile', 'Dart': 'mobile',
      'C++': 'systems', 'C': 'systems', 'Assembly': 'systems',
      'Shell': 'devops', 'Dockerfile': 'devops', 'Makefile': 'devops',
      'Lua': 'scripting', 'Perl': 'scripting', 'R': 'data'
    };

    linguagens.forEach(lang => {
      const stack = stackMap[lang] || 'outros';
      stacks.add(stack);
    });

    return stacks;
  }

  private determinarPersona(stats: EstatisticasAnalisadas, dados: DadosGitHub): TipoPersona {
    const pontuacoes: Record<TipoPersona, number> = {
      [TipoPersona.EXPLORADOR]: 0,
      [TipoPersona.PROGRAMADOR_VIGOROSO]: 0,
      [TipoPersona.BUG_HUNTER]: 0,
      [TipoPersona.DEVOPS]: 0,
      [TipoPersona.ESTUDANTE]: 0
    };

    const stacksUnicas = this.agruparPorStack(stats.linguagensUsadas);
    
    // Explorador: Critérios mais rigorosos
    // precisa de diversidade REAL de stacks (não apenas linguagens)
    // precisa de um volume considerável de repositórios E stars
    if (stacksUnicas.size >= 4) pontuacoes[TipoPersona.EXPLORADOR] += 40; // Aumentado requisito de stacks
    if (stacksUnicas.size >= 5) pontuacoes[TipoPersona.EXPLORADOR] += 30;
    
    // Só ganha pontos de repositório se tiver stars para validar que não é spam
    if (stats.totalRepositorios > 20 && stats.totalStars > 50) pontuacoes[TipoPersona.EXPLORADOR] += 20;
    if (stats.totalRepositorios > 50 && stats.totalStars > 100) pontuacoes[TipoPersona.EXPLORADOR] += 20;

    // Programador Vigoroso: commits frequentes, atividade constante
    // Se tiver muitos commits totais, ganha muitos pontos
    if (stats.totalCommits > 1000) pontuacoes[TipoPersona.PROGRAMADOR_VIGOROSO] += 40;
    if (stats.totalCommits > 500) pontuacoes[TipoPersona.PROGRAMADOR_VIGOROSO] += 20;
    
    if (stats.frequenciaCommits > 40) pontuacoes[TipoPersona.PROGRAMADOR_VIGOROSO] += 20;
    if (stats.pontuacaoConsistencia > 60) pontuacoes[TipoPersona.PROGRAMADOR_VIGOROSO] += 30;
    
    const eventosPush = dados.eventos.filter(e => e.type === 'PushEvent').length;
    if (eventosPush > 30) pontuacoes[TipoPersona.PROGRAMADOR_VIGOROSO] += 20;

    // Bug Hunter: foco em issues criadas e correções
    // Usando totalIssuesCriadas ao invés de issuesAbertas (que era do repo)
    // RATIO: Issues / Commits. Se for muito baixo, provavelmente é dev, não bug hunter
    const ratioIssuesCommits = stats.totalCommits > 0 ? stats.totalIssuesCriadas / stats.totalCommits : 0;
    
    // Só considera bug hunter se tiver um ratio razoavel ou muitas issues absolutas
    if (stats.totalIssuesCriadas > 50) pontuacoes[TipoPersona.BUG_HUNTER] += 30;
    
    // Se tiver poucas issues em relacao aos commits, penaliza bug hunter ou exige muito mais
    if (ratioIssuesCommits > 0.05) { // Pelo menos 1 issue a cada 20 commits
        if (stats.totalIssuesCriadas > 10) pontuacoes[TipoPersona.BUG_HUNTER] += 35;
        if (stats.totalIssuesCriadas > 30) pontuacoes[TipoPersona.BUG_HUNTER] += 30;
    } else {
        // Ratio baixo, exige MUITAS issues para ser considerado bug hunter
        if (stats.totalIssuesCriadas > 100) pontuacoes[TipoPersona.BUG_HUNTER] += 20;
    }
    
    const commitsCorrecao = dados.commits.filter(c => 
      /fix|bug|error|issue|patch|correct|resolve/i.test(c.mensagem)
    ).length;
    if (commitsCorrecao > 5) pontuacoes[TipoPersona.BUG_HUNTER] += 30;
    if (commitsCorrecao > 15) pontuacoes[TipoPersona.BUG_HUNTER] += 25;

    // Automatizador: foco em CI/CD, containerização e scripts de automação
    // Prioriza múltiplos projetos automatizados
    // REBALANCEAMENTO: Critérios mais rigorosos para evitar falsos positivos
    
    // Pontuação base por Actions (reduzida)
    if (stats.reposComActions >= 1) pontuacoes[TipoPersona.DEVOPS] += 15;
    if (stats.reposComActions >= 3) pontuacoes[TipoPersona.DEVOPS] += 25;
    if (stats.reposComActions >= 5) pontuacoes[TipoPersona.DEVOPS] += 20;
    
    // Docker é forte, mas sozinho não define DevOps completo
    if (stats.temDockerfiles) pontuacoes[TipoPersona.DEVOPS] += 25;
    
    // Scripts são comuns, peso drasticamente reduzido
    if (stats.temScriptsAutomacao) pontuacoes[TipoPersona.DEVOPS] += 10;
    
    // Stack DevOps (Shell, Python, etc.) - peso reduzido
    if (stacksUnicas.has('devops')) pontuacoes[TipoPersona.DEVOPS] += 10;

    // BÔNUS DE SINERGIA (Onde o verdadeiro DevOps brilha)
    // Actions + Docker = Pipeline completa
    if (stats.temGitHubActions && stats.temDockerfiles) pontuacoes[TipoPersona.DEVOPS] += 30;

    // IaC (Terraform/Ansible) é o "santo graal" do DevOps - peso alto
    if (stats.temTerraform || stats.temAnsible) pontuacoes[TipoPersona.DEVOPS] += 40;

    // Estudante é o perfil padrão (fallback) quando nenhum outro se destaca
    // Não precisa de pontos altos, será escolhido automaticamente se os outros forem baixos
    pontuacoes[TipoPersona.ESTUDANTE] = 10; // pontuação base baixa

    return Object.keys(pontuacoes).reduce((a, b) => 
      pontuacoes[a as TipoPersona] > pontuacoes[b as TipoPersona] ? a : b
    ) as TipoPersona;
  }

  private calcularConfianca(
    tipoPersona: TipoPersona,
    stats: EstatisticasAnalisadas,
    dados: DadosGitHub
  ): { pontuacao: number; criteriosAtendidos: string[] } {
    const criteriosAtendidos: string[] = [];
    let pontuacao = 0;

    switch (tipoPersona) {
      case TipoPersona.EXPLORADOR:
        if (stats.totalRepositorios > 20) {
          criteriosAtendidos.push(`${stats.totalRepositorios} repositorios criados`);
          pontuacao += 33;
        }
        if (stats.linguagensUsadas.length > 5) {
          criteriosAtendidos.push(`${stats.linguagensUsadas.length} linguagens diferentes`);
          pontuacao += 33;
        }
        if (stats.pontuacaoDiversidade > 30) {
          criteriosAtendidos.push(`alta diversidade de projetos`);
          pontuacao += 34;
        }
        break;

      case TipoPersona.PROGRAMADOR_VIGOROSO:
        if (stats.frequenciaCommits > 50) {
          criteriosAtendidos.push(`${stats.frequenciaCommits} commits recentes`);
          pontuacao += 33;
        }
        if (stats.pontuacaoConsistencia > 50) {
          criteriosAtendidos.push('atividade consistente');
          pontuacao += 33;
        }
        const eventosPush = dados.eventos.filter(e => e.type === 'PushEvent').length;
        if (eventosPush > 30) {
          criteriosAtendidos.push(`${eventosPush} push events`);
          pontuacao += 34;
        }
        break;

      case TipoPersona.BUG_HUNTER:
        if (stats.totalIssuesCriadas > 10) {
          criteriosAtendidos.push(`${stats.totalIssuesCriadas} issues criadas`);
          pontuacao += 40;
        }
        const commitsCorrecao = dados.commits.filter(c => /fix|bug|error|issue/i.test(c.mensagem)).length;
        if (commitsCorrecao > 10) {
          criteriosAtendidos.push(`${commitsCorrecao} commits corrigindo bugs`);
          pontuacao += 40;
        }
        if (commitsCorrecao > 0) {
          criteriosAtendidos.push('commits focados em correcoes');
          pontuacao += 20;
        }
        break;

      case TipoPersona.DEVOPS:
        if (stats.temGitHubActions) {
          criteriosAtendidos.push('usa github actions');
          pontuacao += 50;
        }
        if (stats.temDockerfiles) {
          criteriosAtendidos.push('usa docker');
          pontuacao += 50;
        }
        break;

      case TipoPersona.ESTUDANTE:
        criteriosAtendidos.push(`linguagem principal: ${stats.linguagemPrincipal}`);
        pontuacao += 33;
        criteriosAtendidos.push(`${stats.totalRepositorios} repositorios`);
        pontuacao += 33;
        criteriosAtendidos.push(`${stats.totalCommits} commits`);
        pontuacao += 34;
        break;
    }

    return {
      pontuacao: Math.min(pontuacao, 100),
      criteriosAtendidos
    };
  }
}
