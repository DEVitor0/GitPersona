# 🐙 GitPersona - A identidade visual do seu código

> **Transforme commits em personalidade.** Uma análise comportamental que converte seus dados do GitHub em cards visuais de alta qualidade. O sistema utiliza métricas de repositórios, linguagens e frequência de commits para categorizar seu estilo de desenvolvimento em um card informativo.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![REST API](https://img.shields.io/badge/REST_API-005571?style=for-the-badge&logo=postman&logoColor=white)
![Open Source](https://img.shields.io/badge/Open_Source-MIT-green?style=for-the-badge)

## 🎯 Impacto no Perfil Profissional

A utilização do GitPersona no seu `README.md` vai além da estética. Trata-se de **Data Visualization** aplicada ao marketing pessoal.

### Benefícios para o Desenvolvedor
- **Síntese de Competências**: Condensa anos de trabalho e milhares de linhas de código em uma visualização única e compreensível.
- **Prova Social de Atividade**: Demonstra consistência (streaks) e volume de trabalho (commits) de forma irrefutável.
- **Identidade Comportamental**: Revela seu **estilo de trabalho** (Explorador, Vigoroso, Caçador de Bugs), focando na forma como você interage com código e projetos.

### Visão para Tech Recruiters e RH
Recrutadores técnicos analisam dezenas de perfis diariamente. O GitPersona atua como um **resumo executivo** das suas hard skills:

1.  **Redução de Ruído**: Em vez de navegar por dezenas de repositórios, o recrutador tem um snapshot imediato do seu momento profissional e principais interesses.
2.  **Prova de Prática Real**: Vai além do currículo estático, validando que o candidato está ativamente codando, aprendendo e contribuindo no dia a dia.
3.  **Indicadores de Soft Skills (Baseado em Métricas Reais)**:
    *   **Disciplina & Resiliência**: Calculado via *Streaks* e frequência de commits (Persona Vigoroso).
    *   **Curiosidade & Adaptabilidade**: Mensurado pela diversidade de linguagens e volume de repositórios (Persona Explorador).
    *   **Foco em Qualidade & Resolução**: Identificado via análise semântica de commits (`fix`, `bug`, `resolve`) e interação em Issues (Persona Caçador de Bugs).
    *   **Pensamento Sistêmico**: Validado pelo uso de ferramentas de automação e CI/CD (Persona Automatizador).
    *   **Foco & Evolução**: Detectado pela consolidação de uma stack principal e crescimento constante de repositórios (Persona Estudante).


## 🧬 Descubra seu Arquétipo

<img src="assets/demo/demo-explorador.svg" width="100%">
<img src="assets/demo/demo-codificador.svg" width="100%">
<img src="assets/demo/demo-cacador.svg" width="100%">
<img src="assets/demo/demo-devops.svg" width="100%">
<img src="assets/demo/demo-estudante.svg" width="100%">

---

## 📚 Documentação Técnica

Quer entender como o sistema funciona por dentro? Acesse a **[Documentação Técnica Completa](https://github.com/DEVitor0/GitPersona/wiki)** para detalhes sobre:
- Arquitetura do sistema e padrões de design
- Análise de complexidade e performance
- Guia de extensibilidade e manutenção

---

## 🚀 Como Adicionar ao Seu Perfil (Passo a Passo)

Siga este guia para configurar o GitPersona no seu repositório de perfil (aquele com o mesmo nome do seu usuário, ex: `seunome/seunome`).

### Passo 1: Configurar a Automação
1.  No seu repositório, clique na aba **Actions** ou crie o arquivo manualmente.
2.  Crie um arquivo no caminho: `.github/workflows/persona.yml`
3.  Cole o seguinte código dentro dele:

```yaml
name: Update GitPersona

on:
  schedule:
    - cron: '0 0 * * *' # Executa todo dia à meia-noite
  workflow_dispatch: # Permite rodar manualmente clicando em um botão

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate Persona Card
        uses: devitor0/GitPersona@main
        with:
          github_token: ${{ secrets.PAT_TOKEN }} # Obrigatório: Criar um PAT para funcionamento correto
          username: ${{ github.repository_owner }}
          output_dir: dist
          
      - name: Commit & Push
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add -f dist/persona.svg
          git commit -m "chore: update persona card" || exit 0
          git push
```

### ⚠️ Obrigatório: Configurar Personal Access Token (PAT)
O token padrão do GitHub (`GITHUB_TOKEN`) tem acesso limitado e **não consegue ler seus repositórios privados**, impedindo o funcionamento correto da análise e gerando resultados imprecisos (ex: classificar um desenvolvedor experiente como Iniciante).

**O PAT é obrigatório para o uso e funcionamento adequado do GitPersona.** Para configurá-lo:
1.  Vá em **Settings** (do seu perfil) -> **Developer Settings** -> **Personal Access Tokens** -> **Tokens (classic)**.
2.  Gere um novo token (Generate new token) com o escopo **`repo`** e **`read:user`**.
3.  Copie o token.
4.  Vá no seu repositório -> **Settings** -> **Secrets and variables** -> **Actions**.
5.  Crie um **New repository secret** com o nome `PAT_TOKEN` e cole o token.
6.  Atualize seu workflow para usar `${{ secrets.PAT_TOKEN }}` em vez de `${{ secrets.GITHUB_TOKEN }}`.

### Passo 2: Gerar o Primeiro Card
1.  Vá até a aba **Actions** do seu repositório.
2.  No menu lateral esquerdo, clique em **Update GitPersona**.
3.  Clique no botão **Run workflow**.
4.  Aguarde alguns segundos até ficar verde ✅.
5.  Isso criará uma pasta `dist` na raiz do seu projeto com o arquivo `persona.svg`.

### Passo 3: Adicionar ao README
Agora basta adicionar a imagem ao seu perfil. Copie e cole o código abaixo no seu `README.md`, alterando apenas seu usuário e repositório:

```markdown
<p align="center">
  <img src="https://github.com/SEU_USUARIO/SEU_REPOSITORIO/blob/main/dist/persona.svg?raw=true" alt="Minha GitPersona" width="750">
</p>
```

> **Nota:** O parâmetro `?raw=true` no final do link é **obrigatório** para que a imagem apareça corretamente.

## 👨‍💻 Autor

**Vitor Moreira** - Desenvolvedor

- 📧 Email: vitormoreira6940@gmail.com
- 🔗 LinkedIn: www.linkedin.com/in/devitor0
- 🐙 GitHub: https://github.com/DEVitor0
