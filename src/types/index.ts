export enum TipoPersona {
  EXPLORADOR = 'explorador',
  PROGRAMADOR_VIGOROSO = 'codificador',
  BUG_HUNTER = 'cacador',
  DEVOPS = 'devops',
  ESTUDANTE = 'estudante'
}

export interface InfoPersona {
  tipo: TipoPersona;
  titulo: string;
  perfil: string;
  caminhoImagem: string;
}

export interface RepositorioGitHub {
  name: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  size: number;
  has_issues: boolean;
  open_issues_count: number;
  topics: string[];
}

export interface EventoGitHub {
  type: string;
  created_at: string;
  payload: any;
}

export interface DadosCommit {
  data: string;
  hora: number;
  mensagem: string;
}

export interface DadosGitHub {
  nomeUsuario: string;
  nome: string | null;
  bio: string | null;
  repositoriosPublicos: number;
  seguidores: number;
  seguindo: number;
  criadoEm: string;
  repositorios: RepositorioGitHub[];
  eventos: EventoGitHub[];
  commits: DadosCommit[];
}

export interface EstatisticasAnalisadas {
  totalRepositorios: number;
  linguagensUsadas: string[];
  linguagemPrincipal: string;
  totalStars: number;
  totalForks: number;
  issuesAbertas: number;
  issuesFechadas: number;
  totalIssuesCriadas: number;
  totalCommits: number;
  frequenciaCommits: number;
  diasAtivos: number;
  sequenciaAtual: number;
  maiorSequencia: number;
  temGitHubActions: boolean;
  temDockerfiles: boolean;
  reposComActions: number;
  temScriptsAutomacao: boolean;
  temTerraform: boolean;
  temAnsible: boolean;
  pontuacaoDiversidade: number;
  pontuacaoConsistencia: number;
}

export interface ResultadoPersona {
  nomeUsuario: string;
  persona: InfoPersona;
  estatisticas: EstatisticasAnalisadas;
  pontuacao: number;
  criteriosAtendidos: string[];
}
