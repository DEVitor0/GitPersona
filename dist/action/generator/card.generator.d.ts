import { ResultadoPersona } from '../types';
export declare class GeradorCard {
    gerarSVG(resultado: ResultadoPersona): Promise<string>;
    private gerarStatsHorizontal;
    private obterCaracteristicas;
    private imagemParaBase64;
    private escaparXml;
    salvarSVG(svg: string, nomeUsuario: string): string;
}
//# sourceMappingURL=card.generator.d.ts.map