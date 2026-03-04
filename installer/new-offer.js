/**
 * Copy Chief BLACK — New Offer Scaffold
 * Creates a new offer project structure
 */
'use strict';

const fs = require('fs');
const path = require('path');
const platform = require('../lib/platform');

async function newOffer(niche, name, opts = {}) {
  const eco = platform.ecosystemRoot();
  const offerDir = path.join(eco, niche, name);

  if (fs.existsSync(offerDir)) {
    console.error(`❌ Offer already exists: ${offerDir}`);
    process.exit(1);
  }

  console.log(`Creating offer: ${niche}/${name}\n`);

  // Create directory structure
  const dirs = [
    '',
    'research/raw',
    'research/processed',
    'briefings/phases',
    'production/vsl',
    'production/landing-page',
    'production/creatives',
    'production/emails',
    'swipes/vsl',
    'swipes/criativos',
    '.aios',
  ];

  for (const dir of dirs) {
    fs.mkdirSync(path.join(offerDir, dir), { recursive: true });
  }

  // Create CONTEXT.md
  const yaml = platform.getYaml();
  const context = `# ${name} - Contexto da Oferta

## Produto
- **Tipo:** ${opts.template === 'quiz' ? 'Quiz Funnel' : 'VSL -> Checkout'}
- **Nicho:** ${niche}
- **Sub-nicho:** [definir]
- **Ticket:** [definir]
- **Funil:** ${opts.template === 'quiz' ? 'Quiz -> VSL -> Checkout' : 'VSL -> Checkout'}
- **Expert:** [definir]

## Mecanismo
- **MUP:** [a definir]
- **MUS:** [a definir]

## Avatar Primario
[a definir]

## Quality Gates
| Gate | Status |
|------|--------|
| Research | NOT_STARTED |
| Briefing | NOT_STARTED |
| Production | NOT_STARTED |
`;
  fs.writeFileSync(path.join(offerDir, 'CONTEXT.md'), context);

  // Create mecanismo-unico.yaml
  const mecanismo = {
    version: '1.0',
    offer: name,
    niche: niche,
    mup: { name: null, description: null, status: 'DRAFT' },
    mus: { name: null, description: null, gimmick_name: null, status: 'DRAFT' },
    paradigm_shift: null,
    authority_hook: null,
  };
  platform.writeYaml(path.join(offerDir, 'mecanismo-unico.yaml'), mecanismo);

  // Create helix-state.yaml
  const helixState = {
    offer: name,
    niche: niche,
    phases: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`phase_${String(i + 1).padStart(2, '0')}`, { status: 'NOT_STARTED', confidence: 0 }])
    ),
  };
  platform.writeYaml(path.join(offerDir, 'helix-state.yaml'), helixState);

  // Create project_state.yaml
  const projectState = {
    offer: name,
    niche: niche,
    current_phase: 'research',
    gates: { research: 'NOT_STARTED', briefing: 'NOT_STARTED', production: 'NOT_STARTED' },
    created: new Date().toISOString(),
  };
  platform.writeYaml(path.join(offerDir, 'project_state.yaml'), projectState);

  console.log(`✅ Offer scaffolded: ${offerDir}`);
  console.log('\nNext steps:');
  console.log(`  1. Edit ${niche}/${name}/CONTEXT.md with product details`);
  console.log(`  2. cd ${offerDir}`);
  console.log('  3. Start Claude Code and run: /next-action');
}

module.exports = { newOffer };
