import { TipoPersona, InfoPersona } from '../types';

export const PERSONAS: Record<TipoPersona, InfoPersona> = {
  [TipoPersona.EXPLORADOR]: {
    tipo: TipoPersona.EXPLORADOR,
    titulo: 'O Explorador',
    perfil: 'Curioso, versátil e adaptável',
    caminhoImagem: 'assets/personas/explorador.png'
  },
  [TipoPersona.PROGRAMADOR_VIGOROSO]: {
    tipo: TipoPersona.PROGRAMADOR_VIGOROSO,
    titulo: 'O Programador Rigoroso',
    perfil: 'Disciplinado, consistente e resiliente',
    caminhoImagem: 'assets/personas/codificador.png'
  },
  [TipoPersona.BUG_HUNTER]: {
    tipo: TipoPersona.BUG_HUNTER,
    titulo: 'O Caçador de Bugs',
    perfil: 'Analítico, atento e meticuloso',
    caminhoImagem: 'assets/personas/cacador.png'
  },
  [TipoPersona.DEVOPS]: {
    tipo: TipoPersona.DEVOPS,
    titulo: 'O Automatizador',
    perfil: 'Organizado, engenhoso e eficaz',
    caminhoImagem: 'assets/personas/devops.png'
  },
  [TipoPersona.ESTUDANTE]: {
    tipo: TipoPersona.ESTUDANTE,
    titulo: 'O Estudante',
    perfil: 'Mente curiosa buscando seu rumo',
    caminhoImagem: 'assets/personas/estudante.png'
  }
};
