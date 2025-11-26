import axios from 'axios';
import { DadosGitHub, RepositorioGitHub, EventoGitHub, DadosCommit } from '../types';

const BASE_API_GITHUB = 'https://api.github.com';

export class ServicoGitHub {
  private urlBase: string;
  private headers: any;

  constructor() {
    this.urlBase = BASE_API_GITHUB;
    // token opcional do github para aumentar rate limit (60 -> 5000 req/hora)
    const token = process.env.GITHUB_TOKEN;
    this.headers = token ? { Authorization: `token ${token}` } : {};
  }

  async obterDadosUsuario(nomeUsuario: string): Promise<DadosGitHub> {
    try {
      const respostaUsuario = await axios.get(`${this.urlBase}/users/${nomeUsuario}`, { headers: this.headers });
      const usuario = respostaUsuario.data;

      const respostaRepos = await axios.get(
        `${this.urlBase}/users/${nomeUsuario}/repos`,
        {
          headers: this.headers,
          params: {
            per_page: 100,
            sort: 'updated',
            type: 'owner'
          }
        }
      );
      const repositorios: RepositorioGitHub[] = respostaRepos.data;

      const respostaEventos = await axios.get(
        `${this.urlBase}/users/${nomeUsuario}/events/public`,
        {
          headers: this.headers,
          params: {
            per_page: 100
          }
        }
      );
      const eventos: EventoGitHub[] = respostaEventos.data;

      const commits = this.extrairCommitsDosEventos(eventos);

      return {
        nomeUsuario: usuario.login,
        nome: usuario.name,
        bio: usuario.bio,
        repositoriosPublicos: usuario.public_repos,
        seguidores: usuario.followers,
        seguindo: usuario.following,
        criadoEm: usuario.created_at,
        repositorios,
        eventos,
        commits
      };
    } catch (erro: any) {
      if (erro.response?.status === 404) {
        throw new Error(`Usuário '${nomeUsuario}' não encontrado no GitHub`);
      }
      throw new Error(`Erro ao buscar dados do GitHub: ${erro.message}`);
    }
  }

  async contarIssuesCriadas(nomeUsuario: string): Promise<number> {
    try {
      const resposta = await axios.get(
        `${this.urlBase}/search/issues`,
        {
          headers: this.headers,
          params: {
            q: `author:${nomeUsuario} type:issue`,
            per_page: 1
          }
        }
      );
      return resposta.data.total_count;
    } catch {
      return 0;
    }
  }

  async obterTotalCommits(nomeUsuario: string): Promise<number> {
    try {
      const resposta = await axios.get(
        `${this.urlBase}/search/commits`,
        {
          headers: {
            ...this.headers,
            'Accept': 'application/vnd.github.cloak-preview' // Cabeçalho necessário para busca de commits
          },
          params: {
            q: `author:${nomeUsuario}`,
            per_page: 1
          }
        }
      );
      return resposta.data.total_count;
    } catch (erro) {
      // Fallback se a API de busca falhar ou não tiver permissão
      return 0;
    }
  }

  private extrairCommitsDosEventos(eventos: EventoGitHub[]): DadosCommit[] {
    const commits: DadosCommit[] = [];

    for (const evento of eventos) {
      if (evento.type === 'PushEvent' && evento.payload.commits) {
        for (const commit of evento.payload.commits) {
          const data = new Date(evento.created_at);
          commits.push({
            data: evento.created_at,
            hora: data.getHours(),
            mensagem: commit.message
          });
        }
      }
    }

    return commits;
  }

  async temGitHubActions(nomeUsuario: string, nomeRepo: string): Promise<boolean> {
    try {
      const resposta = await axios.get(
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/.github/workflows`,
        { headers: this.headers }
      );
      return Array.isArray(resposta.data) && resposta.data.length > 0;
    } catch {
      return false;
    }
  }

  async temDockerfile(nomeUsuario: string, nomeRepo: string): Promise<boolean> {
    try {
      await axios.get(
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/Dockerfile`,
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  async temTerraform(nomeUsuario: string, nomeRepo: string): Promise<boolean> {
    try {
      // Verificar apenas main.tf (mais comum e rápido)
      await axios.get(
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/main.tf`,
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  async temAnsible(nomeUsuario: string, nomeRepo: string): Promise<boolean> {
    try {
      // Verificar apenas playbook.yml (mais comum e rápido)
      await axios.get(
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/playbook.yml`,
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }

  async temScriptsAutomacao(nomeUsuario: string, nomeRepo: string): Promise<boolean> {
    try {
      // Verificar diretórios comuns de scripts de automação
      const verificacoes = [
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/scripts`,
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/.scripts`,
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/contents/automation`
      ];

      for (const url of verificacoes) {
        try {
          const resposta = await axios.get(url, { headers: this.headers });
          // Verificar se há arquivos de script (.sh, .py, .js)
          if (Array.isArray(resposta.data) && resposta.data.length > 0) {
            const hasScripts = resposta.data.some((file: any) => 
              /\.(sh|py|js|bash)$/i.test(file.name)
            );
            if (hasScripts) return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  async obterIssuesRepositorio(nomeUsuario: string, nomeRepo: string): Promise<any[]> {
    try {
      const resposta = await axios.get(
        `${this.urlBase}/repos/${nomeUsuario}/${nomeRepo}/issues`,
        {
          headers: this.headers,
          params: {
            state: 'all',
            per_page: 100
          }
        }
      );
      return resposta.data;
    } catch {
      return [];
    }
  }

  async obterDiasComContribuicoes(nomeUsuario: string): Promise<string[]> {
    try {
      // Buscar commits do ultimo ano usando a search API
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      const dataInicio = umAnoAtras.toISOString().split('T')[0];
      
      const resposta = await axios.get(
        `${this.urlBase}/search/commits`,
        {
          headers: {
            ...this.headers,
            'Accept': 'application/vnd.github.cloak-preview'
          },
          params: {
            q: `author:${nomeUsuario} author-date:>=${dataInicio}`,
            per_page: 100,
            sort: 'author-date',
            order: 'desc'
          }
        }
      );

      const diasUnicos = new Set<string>();
      if (resposta.data.items) {
        resposta.data.items.forEach((commit: any) => {
          if (commit.commit?.author?.date) {
            const data = commit.commit.author.date.split('T')[0];
            diasUnicos.add(data);
          }
        });
      }

      return Array.from(diasUnicos).sort();
    } catch (erro) {
      console.error('Erro ao buscar contribuições:', erro);
      return [];
    }
  }

  async obterContribuicoesDetalhadas(nomeUsuario: string): Promise<{ dias: string[]; sequenciaAtual: number; maiorSequencia: number; }> {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      const diasFallback = await this.obterDiasComContribuicoes(nomeUsuario);
      return { dias: diasFallback, sequenciaAtual: 0, maiorSequencia: 0 };
    }

    try {
      // 1. Obter ano de criação
      const queryUser = `
        query ($login: String!) {
          user(login: $login) {
            createdAt
          }
        }
      `;
      const respUser = await this.executarGraphQL(queryUser, { login: nomeUsuario }, token);
      
      if (respUser.errors) {
          console.error('Erro GraphQL User:', JSON.stringify(respUser.errors));
          throw new Error('Erro na API GraphQL ao buscar usuário');
      }
      
      if (!respUser.data?.user) {
         throw new Error('Usuário não encontrado');
      }

      const createdAt = new Date(respUser.data.user.createdAt);
      const startYear = createdAt.getFullYear();
      const currentYear = new Date().getFullYear();
      
      const diasSet = new Set<string>();

      // 2. Iterar pelos anos
      for (let year = startYear; year <= currentYear; year++) {
        const start = `${year}-01-01T00:00:00Z`;
        const end = `${year}-12-31T23:59:59Z`;
        
        const queryContrib = `
          query ($login: String!, $start: DateTime!, $end: DateTime!) {
            user(login: $login) {
              contributionsCollection(from: $start, to: $end) {
                contributionCalendar {
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
            }
          }
        `;
        
        try {
            const respContrib = await this.executarGraphQL(queryContrib, { login: nomeUsuario, start, end }, token);
            const weeks = respContrib.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
            
            if (weeks) {
              weeks.forEach((week: any) => {
                week.contributionDays.forEach((day: any) => {
                  if (day.contributionCount > 0) {
                    diasSet.add(day.date);
                  }
                });
              });
            }
        } catch (err) {
            console.error(`Erro ao buscar ano ${year}:`, err);
            // Continuar para o próximo ano
        }
      }

      const dias = Array.from(diasSet).sort();

      // 3. Calcular streaks
      let sequenciaAtual = 0;
      let maiorSequencia = 0;
      let sequenciaCorrenteTemp = 0;

      if (dias.length > 0) {
        sequenciaCorrenteTemp = 1;
        maiorSequencia = 1;
        
        for (let i = 1; i < dias.length; i++) {
          const dataAnterior = new Date(dias[i-1]);
          const dataAtual = new Date(dias[i]);
          // Normalizar para meio-dia para evitar problemas de fuso horario na diferenca
          dataAnterior.setHours(12, 0, 0, 0);
          dataAtual.setHours(12, 0, 0, 0);
          
          const diffTime = dataAtual.getTime() - dataAnterior.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
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
        
        // Verificar sequencia atual
        const ultimaDataStr = dias[dias.length - 1];
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = ontem.toISOString().split('T')[0];
        
        if (ultimaDataStr === hojeStr || ultimaDataStr === ontemStr) {
             sequenciaAtual = sequenciaCorrenteTemp;
        } else {
             sequenciaAtual = 0;
        }
      }

      return {
        dias,
        sequenciaAtual,
        maiorSequencia
      };
    } catch (erro) {
      console.error('Erro ao buscar contribuições detalhadas:', erro);
      const diasFallback = await this.obterDiasComContribuicoes(nomeUsuario);
      return { dias: diasFallback, sequenciaAtual: 0, maiorSequencia: 0 };
    }
  }

  private async executarGraphQL(query: string, variables: any, token: string) {
      const response = await axios.post(
        'https://api.github.com/graphql',
        { query, variables },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
  }
}
