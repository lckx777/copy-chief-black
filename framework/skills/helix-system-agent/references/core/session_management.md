# Gestão de Sessões do HELIX System

## Divisão em 3 Sessões

Para evitar degradação de contexto em briefings completos, divida em 3 sessões:

Sessão 1 - Fundação: Fases 1-4 (Identificação, Pesquisa, Avatar, Níveis de Consciência). Output: HELIX-STATE.json + Briefing Parcial.

Sessão 2 - Mecanismos: Fases 5-7 (MUP, MUS, Big Offer). Output: HELIX-STATE.json + Briefing Parcial.

Sessão 3 - Execução: Fases 8-10 (Fechamento, Leads/Ganchos, Progressão Emocional). Output: Briefing Final Completo.

## HELIX-STATE.json

Arquivo de handoff entre sessões que preserva contexto crítico.

### Formato

```json
{
  "projeto": {
    "cliente": "",
    "oferta": "",
    "nicho": "",
    "sessao_atual": 1
  },
  "fases_completas": [],
  "fases_parciais": [],
  "gaps_pendentes": [],
  "decisoes_chave": {
    "mup": "",
    "mus": "",
    "one_belief": "",
    "vilao": "",
    "dre": ""
  },
  "swipes_referenciados": [],
  "conexoes_criticas": [],
  "ultima_atualizacao": ""
}
```

### Campos Explicados

- projeto: Identificação básica do projeto
- fases_completas: Lista de fases já entregues
- fases_parciais: Fases com pendências
- gaps_pendentes: O que falta preencher
- decisoes_chave: Elementos estratégicos definidos
- swipes_referenciados: SWIPEs consultados nesta sessão
- conexoes_criticas: Conexões entre fases que devem ser mantidas
- ultima_atualizacao: Timestamp da última modificação

## Início de Nova Sessão

1. Solicite HELIX-STATE.json se não fornecido
2. Carregue contexto das fases anteriores
3. Confirme entendimento antes de prosseguir
4. Identifique o que precisa ser revisitado

### Prompt de Continuação

```
Continuando Sessão [N].

Estado carregado:
- Projeto: [cliente] - [oferta]
- Fases completas: [lista]
- Decisões-chave preservadas:
  - MUP: [resumo]
  - MUS: [resumo]
  - DRE: [resumo]

Próximas fases: [lista]

Posso prosseguir ou há algo para revisar?
```

## Fim de Cada Sessão

1. Atualize HELIX-STATE.json com novos dados
2. Liste gaps pendentes
3. Prepare handoff para próxima sessão
4. Forneça instruções claras para continuação

### Output de Encerramento

```
SESSAO [N] COMPLETA

Fases entregues:
- briefing_fase0X_nome.md [OK]
- briefing_fase0X_nome.md [OK]

Confiança geral: [Alta/Média/Baixa]
SWIPEs referenciados: [lista]
Conexões críticas estabelecidas: [lista]

HELIX-STATE.json atualizado:
[JSON atualizado]

Para continuar na Sessão [N+1]:
1. Abra um novo chat
2. Cole o HELIX-STATE.json acima
3. Diga "Continuar Sessão [N+1]"
```

## Conexões Entre Sessões

### Sessão 1 -> Sessão 2

Decisões que DEVEM ser preservadas:
- DRE (Fase 3): Usada em Fase 5 e 10
- Vilão identificado (Fase 3): Desenvolvido em Fase 5
- Linguagem do avatar: Usada em todas as fases seguintes
- Nível de consciência: Define abordagem do mecanismo

### Sessão 2 -> Sessão 3

Decisões que DEVEM ser preservadas:
- MUP completo: Referenciado no fechamento
- MUS com 4 camadas: Base para leads e ganchos
- Arsenal de provas: Usado no fechamento
- Estrutura da oferta: Base para pitch

## Recuperação de Contexto Perdido

Se o HELIX-STATE.json não for fornecido:

1. Pergunte por briefings já preenchidos
2. Identifique decisões-chave nos materiais
3. Reconstrua HELIX-STATE.json antes de continuar
4. Valide com usuário antes de prosseguir

### Prompt de Recuperação

```
Não recebi o HELIX-STATE.json da sessão anterior.

Posso continuar de duas formas:

1. Cole o JSON da sessão anterior (recomendado)
2. Cole os briefings já preenchidos para que eu reconstrua o contexto

Qual prefere?
```
