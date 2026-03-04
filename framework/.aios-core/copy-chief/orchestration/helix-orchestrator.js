'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { OfferScanner } = require('./offer-scanner');

const OfferPhase = {
  IDLE: 'idle',
  RESEARCH: 'research',
  BRIEFING: 'briefing',
  PRODUCTION: 'production',
  REVIEW: 'review',
  DELIVERED: 'delivered',
};

const CRASH_THRESHOLD_MINUTES = 30;

const AGENT_MAP = {
  vox: { file: 'vox.md', model: 'sonnet', title: 'VOC Researcher' },
  cipher: { file: 'cipher.md', model: 'sonnet', title: 'Ads Miner' },
  atlas: { file: 'atlas.md', model: 'opus', title: 'HELIX Briefer' },
  echo: { file: 'echo.md', model: 'opus', title: 'VSL Director' },
  forge: { file: 'forge.md', model: 'sonnet', title: 'LP Builder' },
  scout: { file: 'scout.md', model: 'sonnet', title: 'Creative Producer' },
  blade: { file: 'blade.md', model: 'sonnet', title: 'Email Producer' },
  hawk: { file: 'hawk.md', model: 'sonnet', title: 'Copy Critic' },
  sentinel: { file: 'sentinel.md', model: 'sonnet', title: 'Gate Keeper' },
};

const WORKFLOW_MAP = {
  [OfferPhase.RESEARCH]: 'research-pipeline',
  [OfferPhase.BRIEFING]: 'briefing-pipeline',
  [OfferPhase.PRODUCTION]: 'production-pipeline',
  [OfferPhase.REVIEW]: 'review-pipeline',
};

const ROUTING_TABLE = {
  [OfferPhase.IDLE]: {
    nextWorkflow: 'research-pipeline',
    suggestedAgent: 'vox',
    action: 'start_research',
    message: 'Oferta em IDLE. Iniciar Research Pipeline com Vox.',
  },
  [OfferPhase.RESEARCH]: {
    nextWorkflow: 'research-pipeline',
    suggestedAgent: 'vox',
    action: 'continue_research',
    message: 'Research em andamento. Continuar Research Pipeline.',
  },
  [OfferPhase.BRIEFING]: {
    nextWorkflow: 'briefing-pipeline',
    suggestedAgent: 'atlas',
    action: 'continue_briefing',
    message: 'Briefing em andamento. Continuar HELIX Briefing com Atlas.',
  },
  [OfferPhase.PRODUCTION]: {
    nextWorkflow: 'production-pipeline',
    suggestedAgent: 'echo',
    action: 'continue_production',
    message: 'Production em andamento. Continuar Production Pipeline.',
  },
  [OfferPhase.REVIEW]: {
    nextWorkflow: 'review-pipeline',
    suggestedAgent: 'hawk',
    action: 'continue_review',
    message: 'Review em andamento. Hawk validando deliverables.',
  },
  [OfferPhase.DELIVERED]: {
    nextWorkflow: null,
    suggestedAgent: null,
    action: 'show_summary',
    message: 'Oferta entregue. Selecionar próxima oferta.',
  },
};

class HelixOrchestrator {
  constructor(ecosystemRoot, options = {}) {
    if (!ecosystemRoot || typeof ecosystemRoot !== 'string') {
      throw new Error('ecosystemRoot is required and must be a string');
    }

    this.ecosystemRoot = ecosystemRoot;
    this.options = {
      debug: false,
      agentsDir: path.join(process.env.HOME, '.claude', 'agents'),
      workflowsDir: path.join(ecosystemRoot, 'squads', 'copy-chief', 'workflows'),
      ...options,
    };

    this.scanner = new OfferScanner(ecosystemRoot, { debug: this.options.debug });
  }

  orchestrate(context = {}) {
    const result = {
      timestamp: new Date().toISOString(),
      offers: [],
      activeOffer: null,
      routing: null,
      warnings: [],
    };

    try {
      // Step 1: Scan all offers
      const allOffers = this.scanner.scanAll();
      result.offers = allOffers.map(o => ({
        name: o.name,
        niche: o.niche,
        relativePath: o.relativePath,
        phase: o.state?.workflow_phase || 'idle',
        gatesStatus: this._summarizeGates(o.state?.gates),
        mecanismoState: o.state?.mecanismo?.state || 'undefined',
      }));

      // Step 2: Detect active offer
      const activeOffers = this.scanner.scanActive();
      if (activeOffers.length > 0) {
        // Pick the most recently updated active offer
        const sorted = activeOffers.sort((a, b) => {
          const aTime = a.state?.last_updated ? new Date(a.state.last_updated).getTime() : 0;
          const bTime = b.state?.last_updated ? new Date(b.state.last_updated).getTime() : 0;
          return bTime - aTime;
        });
        result.activeOffer = sorted[0];
      } else if (context.offerPath) {
        // User specified an offer
        result.activeOffer = this.scanner.getOffer(context.offerPath);
      }

      // Step 3: Route
      if (result.activeOffer) {
        const offerState = this.detectOfferState(result.activeOffer.path);
        result.routing = this.routeByState(offerState, context);

        // Step 4: Crash detection
        const crashInfo = this._detectCrash(offerState);
        if (crashInfo.isCrash) {
          result.warnings.push(`Possível crash detectado: última atualização há ${crashInfo.minutesSince} min`);
          result.routing.crashDetected = true;
        }
      } else {
        // No active offer — suggest starting one
        const idleOffers = allOffers.filter(o => !o.state || o.state.workflow_phase === 'idle');
        result.routing = {
          action: 'select_offer',
          message: `Nenhuma oferta ativa. ${idleOffers.length} ofertas em IDLE disponíveis.`,
          availableOffers: idleOffers.map(o => o.relativePath),
        };
      }
    } catch (error) {
      result.routing = {
        action: 'error',
        message: `Orchestration failed: ${error.message}`,
      };
      this._log(`Orchestration error: ${error.message}`);
    }

    return result;
  }

  detectOfferState(offerPath) {
    const helixStatePath = path.join(offerPath, 'helix-state.yaml');
    const mecanismoPath = path.join(offerPath, 'mecanismo-unico.yaml');

    const state = {
      offer: path.basename(offerPath),
      offerPath,
      phase: OfferPhase.IDLE,
      gates: { research: false, briefing: false, production: false },
      mecanismo: { state: 'undefined' },
      lastUpdated: null,
      hasResearch: false,
      hasBriefings: false,
      hasProduction: false,
    };

    // Read helix-state.yaml
    if (fs.existsSync(helixStatePath)) {
      try {
        const content = fs.readFileSync(helixStatePath, 'utf8');
        const helixState = yaml.load(content);

        state.phase = helixState?.workflow_phase || OfferPhase.IDLE;
        state.lastUpdated = helixState?.last_updated || null;

        if (helixState?.gates) {
          state.gates.research = helixState.gates.research === true || helixState.gates.research === 'passed';
          state.gates.briefing = helixState.gates.briefing === true || helixState.gates.briefing === 'passed';
          state.gates.production = helixState.gates.production === true || helixState.gates.production === 'passed';
        }
      } catch (e) {
        this._log(`Failed to read helix-state: ${e.message}`);
      }
    }

    // Read mecanismo-unico.yaml
    if (fs.existsSync(mecanismoPath)) {
      try {
        const content = fs.readFileSync(mecanismoPath, 'utf8');
        const mecanismo = yaml.load(content);
        state.mecanismo.state = mecanismo?.state || mecanismo?.status || 'draft';
        state.mecanismo.mupName = mecanismo?.mup?.name || null;
        state.mecanismo.musName = mecanismo?.mus?.name || null;
      } catch (e) {
        this._log(`Failed to read mecanismo: ${e.message}`);
      }
    }

    // Check directory existence
    state.hasResearch = fs.existsSync(path.join(offerPath, 'research'));
    state.hasBriefings = fs.existsSync(path.join(offerPath, 'briefings'));
    state.hasProduction = fs.existsSync(path.join(offerPath, 'production'));

    return state;
  }

  routeByState(offerState, context = {}) {
    const phase = offerState.phase;
    const baseRouting = ROUTING_TABLE[phase] || ROUTING_TABLE[OfferPhase.IDLE];

    const routing = {
      ...baseRouting,
      offer: offerState.offer,
      offerPath: offerState.offerPath,
      phase,
      gates: offerState.gates,
      mecanismo: offerState.mecanismo,
    };

    // Special case: Research gates passed → advance to briefing
    if (phase === OfferPhase.RESEARCH && offerState.gates.research) {
      routing.nextWorkflow = 'briefing-pipeline';
      routing.suggestedAgent = 'atlas';
      routing.action = 'start_briefing';
      routing.message = 'Research PASSED. Iniciar HELIX Briefing com Atlas.';
    }

    // Special case: Briefing gates passed → check mecanismo
    if (phase === OfferPhase.BRIEFING && offerState.gates.briefing) {
      const mecState = offerState.mecanismo.state;
      if (mecState === 'validated' || mecState === 'approved' || mecState === 'VALIDATED' || mecState === 'APPROVED') {
        routing.nextWorkflow = 'production-pipeline';
        routing.suggestedAgent = 'echo';
        routing.action = 'start_production';
        routing.message = 'Briefing PASSED + Mecanismo APPROVED. Iniciar Production Pipeline.';
      } else {
        routing.nextWorkflow = null;
        routing.suggestedAgent = 'atlas';
        routing.action = 'validate_mecanismo';
        routing.message = `Briefing PASSED mas Mecanismo em "${mecState}". Validar mecanismo antes de produzir.`;
        routing.blocked = true;
        routing.blockReason = 'mecanismo_not_validated';
      }
    }

    // Special case: Production gates passed → review
    if (phase === OfferPhase.PRODUCTION && offerState.gates.production) {
      routing.nextWorkflow = 'review-pipeline';
      routing.suggestedAgent = 'hawk';
      routing.action = 'start_review';
      routing.message = 'Production PASSED. Iniciar Review com Hawk.';
    }

    // Add agent info
    if (routing.suggestedAgent && AGENT_MAP[routing.suggestedAgent]) {
      routing.agentInfo = AGENT_MAP[routing.suggestedAgent];
    }

    // Add workflow path
    if (routing.nextWorkflow) {
      routing.workflowPath = path.join(
        this.options.workflowsDir,
        `${routing.nextWorkflow}.yaml`
      );
    }

    return routing;
  }

  detectAllOffers() {
    return this.scanner.scanAll();
  }

  handleSessionResume(option, offerPath) {
    switch (option) {
      case 'continue':
        return {
          action: 'continue',
          offer: this.scanner.getOffer(offerPath),
          message: 'Continuando de onde parou.',
        };
      case 'review':
        return {
          action: 'review',
          offer: this.scanner.getOffer(offerPath),
          message: 'Revise o estado e escolha o próximo passo.',
        };
      case 'restart':
        return {
          action: 'restart',
          offer: this.scanner.getOffer(offerPath),
          message: 'Reiniciando fase atual.',
        };
      case 'discard':
        return {
          action: 'discard',
          message: 'Estado descartado. Selecione uma oferta.',
        };
      default:
        return {
          action: 'unknown',
          message: `Opção desconhecida: ${option}`,
        };
    }
  }

  formatRoutingContext(orchestrationResult) {
    const r = orchestrationResult;
    const lines = [];

    lines.push('<helix-routing>');
    lines.push(`<timestamp>${r.timestamp}</timestamp>`);

    // Offers summary
    lines.push('<offers>');
    for (const offer of r.offers) {
      lines.push(`  <offer name="${offer.name}" niche="${offer.niche}" phase="${offer.phase}" gates="${offer.gatesStatus}" mecanismo="${offer.mecanismoState}" />`);
    }
    lines.push('</offers>');

    // Active offer + routing
    if (r.activeOffer) {
      lines.push(`<active-offer>${r.activeOffer.relativePath}</active-offer>`);
    }

    if (r.routing) {
      lines.push('<routing>');
      lines.push(`  <action>${r.routing.action}</action>`);
      lines.push(`  <message>${r.routing.message}</message>`);
      if (r.routing.nextWorkflow) {
        lines.push(`  <workflow>${r.routing.nextWorkflow}</workflow>`);
      }
      if (r.routing.suggestedAgent) {
        lines.push(`  <agent>${r.routing.suggestedAgent}</agent>`);
      }
      if (r.routing.blocked) {
        lines.push(`  <blocked reason="${r.routing.blockReason}" />`);
      }
      lines.push('</routing>');
    }

    // Warnings
    if (r.warnings.length > 0) {
      lines.push('<warnings>');
      for (const w of r.warnings) {
        lines.push(`  <warning>${w}</warning>`);
      }
      lines.push('</warnings>');
    }

    lines.push('</helix-routing>');
    return lines.join('\n');
  }

  _detectCrash(offerState) {
    if (!offerState.lastUpdated) {
      return { isCrash: false };
    }

    const lastUpdated = new Date(offerState.lastUpdated);
    const now = new Date();
    const minutesSince = Math.floor((now - lastUpdated) / (1000 * 60));

    return {
      isCrash: minutesSince > CRASH_THRESHOLD_MINUTES && offerState.phase !== OfferPhase.IDLE && offerState.phase !== OfferPhase.DELIVERED,
      minutesSince,
      lastUpdated: offerState.lastUpdated,
    };
  }

  _summarizeGates(gates) {
    if (!gates) return 'none';
    const passed = [];
    if (gates.research === true || gates.research === 'passed') passed.push('R');
    if (gates.briefing === true || gates.briefing === 'passed') passed.push('B');
    if (gates.production === true || gates.production === 'passed') passed.push('P');
    return passed.length > 0 ? passed.join('+') : 'none';
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[HelixOrchestrator] ${message}`);
    }
  }
}

module.exports = {
  HelixOrchestrator,
  OfferPhase,
  AGENT_MAP,
  WORKFLOW_MAP,
  ROUTING_TABLE,
};
