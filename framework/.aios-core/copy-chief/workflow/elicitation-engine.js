'use strict';

/**
 * Elicitation Engine (U-37)
 *
 * Guided question-based document creation flows.
 * Loads question sets from YAML templates, processes answers into
 * structured output (CONTEXT.md, mecanismo-unico.yaml).
 *
 * @module elicitation-engine
 * @version 1.0.0
 * @atom U-37
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const TEMPLATES_DIR = path.join(process.env.HOME, 'copywriting-ecosystem', 'squads', 'copy-chief', 'templates', 'elicitation');

/**
 * Built-in question sets (used when template files don't exist).
 */
const BUILT_IN_SETS = {
  context: [
    { id: 'product_name', prompt: 'Qual o nome do produto?', required: true, section: 'produto' },
    { id: 'product_type', prompt: 'Qual o tipo? (suplemento, curso, app, servico)', required: true, section: 'produto' },
    { id: 'niche', prompt: 'Qual o nicho? (saude, relacionamento, financeiro, educacao)', required: true, section: 'produto' },
    { id: 'sub_niche', prompt: 'Qual o sub-nicho especifico?', required: true, section: 'produto' },
    { id: 'ticket', prompt: 'Qual a faixa de preco? (ex: EUR 49-89)', required: true, section: 'produto' },
    { id: 'funnel', prompt: 'Qual o modelo de funil? (VSL->Checkout, Quiz->VSL, Webinar, etc)', required: true, section: 'produto' },
    { id: 'expert', prompt: 'Quem e o expert/autoridade? (nome, credenciais)', required: false, section: 'produto' },
    { id: 'market', prompt: 'Qual o mercado-alvo? (pais, idioma)', required: true, section: 'business' },
    { id: 'guarantee', prompt: 'Qual a garantia oferecida?', required: false, section: 'business' },
    { id: 'avatar_gender_age', prompt: 'Qual o avatar primario? (genero, faixa etaria)', required: true, section: 'avatar' },
    { id: 'avatar_problem', prompt: 'Qual o problema principal que o avatar enfrenta?', required: true, section: 'avatar' },
    { id: 'avatar_attempts', prompt: 'O que o avatar ja tentou sem sucesso?', required: false, section: 'avatar' },
    { id: 'dre_primary', prompt: 'Qual a DRE primaria? (Medo, Vergonha, Frustracao, Raiva)', required: true, section: 'avatar' },
    { id: 'awareness_level', prompt: 'Nivel de consciencia do avatar? (Unaware, Problem Aware, Solution Aware)', required: true, section: 'avatar' },
  ],

  mecanismo: [
    { id: 'problem_root', prompt: 'Qual a causa-raiz REAL do problema? (nao o sintoma)', required: true, section: 'mup' },
    { id: 'paradigm_shift', prompt: 'Qual o paradigm shift? (o que o mercado acredita ERRADO)', required: true, section: 'mup' },
    { id: 'mup_name', prompt: 'Qual o nome do MUP? (ex: "Morte das Celulas de Lubrificacao")', required: true, section: 'mup' },
    { id: 'solution_core', prompt: 'Qual o ingrediente/metodo principal da solucao?', required: true, section: 'mus' },
    { id: 'gimmick_name', prompt: 'Qual o Gimmick Name? (nome memoravel para o mecanismo)', required: false, section: 'mus' },
    { id: 'authority_hook', prompt: 'Qual o authority hook? (estudo, universidade, premio)', required: false, section: 'mus' },
    { id: 'proof_points', prompt: 'Quais os pontos de prova? (estudos, numeros, testemunhos)', required: true, section: 'proof' },
  ],
};

/**
 * Load a question set by name.
 * First tries YAML templates, falls back to built-in sets.
 *
 * @param {string} setName - Question set name ('context', 'mecanismo')
 * @returns {object[]} Array of question objects
 */
function loadQuestionSet(setName) {
  // Try loading from template YAML
  const templatePath = path.join(TEMPLATES_DIR, `${setName}.yaml`);
  try {
    if (fs.existsSync(templatePath)) {
      const content = yaml.load(fs.readFileSync(templatePath, 'utf8'));
      if (Array.isArray(content?.questions)) {
        return content.questions;
      }
    }
  } catch { /* fall back to built-in */ }

  // Fall back to built-in
  return BUILT_IN_SETS[setName] || [];
}

/**
 * Format answers into structured CONTEXT.md content.
 *
 * @param {object} answers - Map of { questionId: answer }
 * @param {object[]} questions - Question set with section info
 * @returns {string} Formatted markdown
 */
function formatContextMd(answers, questions) {
  const sections = {};

  for (const q of questions) {
    const section = q.section || 'general';
    if (!sections[section]) sections[section] = [];
    const answer = answers[q.id] || '';
    if (answer) {
      sections[section].push(`- **${q.prompt}**: ${answer}`);
    }
  }

  const lines = [`# CONTEXT — ${answers.product_name || 'Offer'}`, ''];
  for (const [section, items] of Object.entries(sections)) {
    lines.push(`## ${section.charAt(0).toUpperCase() + section.slice(1)}`);
    lines.push('');
    lines.push(...items);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format answers into mecanismo-unico.yaml content.
 *
 * @param {object} answers - Map of { questionId: answer }
 * @returns {string} YAML content
 */
function formatMecanismoYaml(answers) {
  const mecanismo = {
    state: 'DRAFT',
    version: 1,
    mup: {
      name: answers.mup_name || '',
      root_cause: answers.problem_root || '',
      paradigm_shift: answers.paradigm_shift || '',
    },
    mus: {
      core_solution: answers.solution_core || '',
      gimmick_name: answers.gimmick_name || '',
      authority_hook: answers.authority_hook || '',
    },
    proof: {
      points: answers.proof_points || '',
    },
  };

  return yaml.dump(mecanismo, { lineWidth: 120 });
}

/**
 * Get available question set names.
 *
 * @returns {string[]}
 */
function listQuestionSets() {
  const sets = new Set(Object.keys(BUILT_IN_SETS));

  try {
    if (fs.existsSync(TEMPLATES_DIR)) {
      const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.yaml'));
      for (const f of files) {
        sets.add(f.replace('.yaml', ''));
      }
    }
  } catch { /* ignore */ }

  return [...sets];
}

module.exports = { loadQuestionSet, formatContextMd, formatMecanismoYaml, listQuestionSets };
