'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const KNOWN_NICHES = ['saude', 'relacionamento', 'concursos', 'financeiro', 'educacao'];

class OfferScanner {
  constructor(ecosystemRoot, options = {}) {
    if (!ecosystemRoot || typeof ecosystemRoot !== 'string') {
      throw new Error('ecosystemRoot is required and must be a string');
    }
    this.ecosystemRoot = ecosystemRoot;
    this.options = { debug: false, ...options };
  }

  scanAll() {
    const offers = [];
    for (const niche of KNOWN_NICHES) {
      const nichePath = path.join(this.ecosystemRoot, niche);
      if (!fs.existsSync(nichePath)) continue;

      let entries;
      try {
        entries = fs.readdirSync(nichePath, { withFileTypes: true });
      } catch { continue; }

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const offerPath = path.join(nichePath, entry.name);
        const helixStatePath = path.join(offerPath, 'helix-state.yaml');
        const contextPath = path.join(offerPath, 'CONTEXT.md');

        if (!fs.existsSync(helixStatePath) && !fs.existsSync(contextPath)) continue;

        const offerInfo = {
          name: entry.name,
          niche,
          path: offerPath,
          relativePath: `${niche}/${entry.name}`,
          hasHelixState: fs.existsSync(helixStatePath),
          hasContext: fs.existsSync(contextPath),
          hasMecanismo: fs.existsSync(path.join(offerPath, 'mecanismo-unico.yaml')),
        };

        if (offerInfo.hasHelixState) {
          offerInfo.state = this._readHelixState(helixStatePath);
        }

        offers.push(offerInfo);
      }
    }

    return offers;
  }

  scanActive() {
    return this.scanAll().filter(o => {
      if (!o.state) return false;
      const phase = o.state.workflow_phase || 'idle';
      return phase !== 'delivered' && phase !== 'idle';
    });
  }

  scanByPhase(phase) {
    return this.scanAll().filter(o => o.state && o.state.workflow_phase === phase);
  }

  getOffer(relativePath) {
    const offerPath = path.join(this.ecosystemRoot, relativePath);
    if (!fs.existsSync(offerPath)) return null;

    const helixStatePath = path.join(offerPath, 'helix-state.yaml');
    const parts = relativePath.split(path.sep);

    const offer = {
      name: parts[parts.length - 1],
      niche: parts[0],
      path: offerPath,
      relativePath,
      hasHelixState: fs.existsSync(helixStatePath),
      hasContext: fs.existsSync(path.join(offerPath, 'CONTEXT.md')),
      hasMecanismo: fs.existsSync(path.join(offerPath, 'mecanismo-unico.yaml')),
    };

    if (offer.hasHelixState) {
      offer.state = this._readHelixState(helixStatePath);
    }

    return offer;
  }

  _readHelixState(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const state = yaml.load(content);
      return {
        workflow_phase: state?.workflow_phase || 'idle',
        gates: state?.gates || {},
        mecanismo: state?.mecanismo || {},
        last_updated: state?.last_updated || null,
        tools_used: state?.tools_used || {},
      };
    } catch (e) {
      this._log(`Failed to read helix-state: ${filePath} — ${e.message}`);
      return { workflow_phase: 'idle', gates: {}, mecanismo: {}, last_updated: null, tools_used: {} };
    }
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[OfferScanner] ${message}`);
    }
  }
}

module.exports = { OfferScanner, KNOWN_NICHES };
