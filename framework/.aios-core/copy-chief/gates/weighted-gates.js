var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var weighted_gates_exports = {};
__export(weighted_gates_exports, {
  evaluateBriefingGate: () => evaluateBriefingGate,
  evaluateProductionGate: () => evaluateProductionGate,
  evaluateResearchGate: () => evaluateResearchGate,
  formatGateReport: () => formatGateReport
});
module.exports = __toCommonJS(weighted_gates_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const ECOSYSTEM_ROOT = (0, import_path.join)(HOME, "copywriting-ecosystem");
function safeReadFile(filePath) {
  try {
    if (!(0, import_fs.existsSync)(filePath)) return "";
    return (0, import_fs.readFileSync)(filePath, "utf-8");
  } catch {
    return "";
  }
}
function safeReadDir(dirPath) {
  try {
    if (!(0, import_fs.existsSync)(dirPath)) return [];
    return (0, import_fs.readdirSync)(dirPath);
  } catch {
    return [];
  }
}
function resolveOfferPath(offerPath) {
  if (offerPath.startsWith("/")) return offerPath;
  return (0, import_path.join)(ECOSYSTEM_ROOT, offerPath);
}
function computeVerdict(total) {
  if (total >= 85) return "PASSED";
  if (total >= 70) return "NEEDS_REVIEW";
  return "FAILED";
}
function yamlFieldValue(content, field) {
  const regex = new RegExp(`^\\s*${field}\\s*:\\s*(.+)$`, "m");
  const match = content.match(regex);
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
}
function countPattern(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}
function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
function readAllMdFiles(dirPath) {
  const files = safeReadDir(dirPath).filter((f) => f.endsWith(".md"));
  return files.map((f) => safeReadFile((0, import_path.join)(dirPath, f))).join("\n");
}
function readProductionFiles(offerPath) {
  const productionDir = (0, import_path.join)(offerPath, "production");
  if (!(0, import_fs.existsSync)(productionDir)) return "";
  const subdirs = ["vsl", "landing-page", "creatives", "emails"];
  let combined = "";
  for (const sub of subdirs) {
    const subPath = (0, import_path.join)(productionDir, sub);
    combined += readAllMdFiles(subPath) + "\n";
  }
  combined += readAllMdFiles(productionDir);
  return combined;
}
function evaluateVocDepth(offerPath) {
  const vocDir = (0, import_path.join)(offerPath, "research", "voc");
  const summaryPath = (0, import_path.join)(vocDir, "summary.md");
  const processedDir = (0, import_path.join)(vocDir, "processed");
  let allContent = safeReadFile(summaryPath);
  allContent += "\n" + readAllMdFiles(processedDir);
  if (!allContent.trim()) {
    return {
      name: "VOC Depth",
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: "No VOC files found in research/voc/"
    };
  }
  const quotePatterns = [
    /^>\s*.+/gm,
    // Blockquote lines
    /[""].+?[""]/g,
    // Curly quoted text
    /(?:^|\n)\s*-\s*[""].+/gm,
    // List items with quotes
    /Quote\s*[:]\s*.+/gi,
    // "Quote:" labeled entries
    /(?:^|\n)\s*\d+\.\s+[""].+/gm
    // Numbered quote entries
  ];
  const quoteLines = /* @__PURE__ */ new Set();
  for (const pattern of quotePatterns) {
    const matches = allContent.match(pattern);
    if (matches) {
      for (const m of matches) {
        quoteLines.add(m.trim().substring(0, 100));
      }
    }
  }
  const totalQuotes = quoteLines.size;
  const platformNames = ["youtube", "instagram", "tiktok", "reddit", "facebook", "twitter", "x.com", "quora", "amazon"];
  const platformsFound = [];
  const lowerContent = allContent.toLowerCase();
  for (const p of platformNames) {
    if (lowerContent.includes(p)) {
      platformsFound.push(p);
    }
  }
  const platformCount = Math.max(platformsFound.length, 1);
  const quotesPerPlatform = Math.round(totalQuotes / platformCount);
  let rawScore;
  if (quotesPerPlatform >= 50) rawScore = 10;
  else if (quotesPerPlatform >= 25) rawScore = 7;
  else if (quotesPerPlatform >= 10) rawScore = 5;
  else rawScore = 2;
  if (totalQuotes === 0) rawScore = 0;
  return {
    name: "VOC Depth",
    weight: 30,
    raw_score: rawScore,
    weighted_score: rawScore * 30 / 10,
    details: `${totalQuotes} quotes across ${platformCount} platform(s) (${quotesPerPlatform}/platform). Platforms: ${platformsFound.join(", ") || "none detected"}`
  };
}
function evaluateCompetitorAnalysis(offerPath) {
  const adsSpyPath = (0, import_path.join)(offerPath, "research", "competitors", "processed", "ads-library-spy.md");
  const content = safeReadFile(adsSpyPath);
  if (!content) {
    return {
      name: "Competitor Analysis",
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: "No ads-library-spy.md found in research/competitors/processed/"
    };
  }
  const scaleScoreMatches = content.match(/Scale\s*Score\s*[:]\s*\d+/gi);
  const competitorCount = scaleScoreMatches ? scaleScoreMatches.length : 0;
  let rawScore;
  if (competitorCount >= 5) rawScore = 10;
  else if (competitorCount >= 3) rawScore = 7;
  else if (competitorCount >= 1) rawScore = 5;
  else rawScore = 0;
  return {
    name: "Competitor Analysis",
    weight: 25,
    raw_score: rawScore,
    weighted_score: rawScore * 25 / 10,
    details: `${competitorCount} competitor(s) with Scale Score in ads-library-spy.md`
  };
}
function evaluateMechanismDiscovery(offerPath) {
  const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
  const content = safeReadFile(mecPath);
  if (!content) {
    return {
      name: "Mechanism Discovery",
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: "No mecanismo-unico.yaml found"
    };
  }
  const novaCausa = yamlFieldValue(content, "new_cause");
  const sexyCause = yamlFieldValue(content, "sexy_cause");
  const fieldsPopulated = [novaCausa, sexyCause].filter((v) => v.length > 0).length;
  let rawScore;
  if (fieldsPopulated === 2) rawScore = 10;
  else if (fieldsPopulated === 1) rawScore = 5;
  else rawScore = 0;
  return {
    name: "Mechanism Discovery",
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `mecanismo-unico.yaml: new_cause=${novaCausa ? "YES" : "EMPTY"}, sexy_cause=${sexyCause ? "YES" : "EMPTY"}`
  };
}
function evaluateAvatarDefinition(offerPath) {
  const avatarPath = (0, import_path.join)(offerPath, "research", "avatar", "summary.md");
  const content = safeReadFile(avatarPath);
  if (!content) {
    return {
      name: "Avatar Definition",
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: "No research/avatar/summary.md found"
    };
  }
  const lowerContent = content.toLowerCase();
  const headingsFound = [];
  if (/##\s*dre|dre\s*[:]/i.test(content) || lowerContent.includes("emocao dominante") || lowerContent.includes("emo\xE7\xE3o dominante")) {
    headingsFound.push("DRE");
  }
  if (/##\s*escalada|escalada\s*emocional/i.test(content) || lowerContent.includes("escalada")) {
    headingsFound.push("Escalada");
  }
  if (/##\s*segment|segmentos|segments/i.test(content) || lowerContent.includes("segment")) {
    headingsFound.push("Segments");
  }
  const count = headingsFound.length;
  let rawScore;
  if (count >= 3) rawScore = 10;
  else if (count === 2) rawScore = 7;
  else if (count === 1) rawScore = 4;
  else rawScore = 0;
  return {
    name: "Avatar Definition",
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `Sections found: ${headingsFound.join(", ") || "none"} (${count}/3)`
  };
}
function evaluateStructureCompliance(offerPath) {
  const requiredDirs = [
    (0, import_path.join)(offerPath, "research", "voc"),
    (0, import_path.join)(offerPath, "research", "competitors"),
    (0, import_path.join)(offerPath, "research", "mechanism"),
    (0, import_path.join)(offerPath, "research", "avatar")
  ];
  const existingDirs = [];
  for (const dir of requiredDirs) {
    if ((0, import_fs.existsSync)(dir)) {
      try {
        const stat = (0, import_fs.statSync)(dir);
        if (stat.isDirectory()) {
          existingDirs.push(dir.split("/").pop());
        }
      } catch {
      }
    }
  }
  const count = existingDirs.length;
  let rawScore;
  if (count >= 4) rawScore = 10;
  else if (count === 3) rawScore = 7;
  else if (count === 2) rawScore = 5;
  else rawScore = 2;
  return {
    name: "Structure Compliance",
    weight: 5,
    raw_score: rawScore,
    weighted_score: rawScore * 5 / 10,
    details: `${count}/4 required dirs exist: ${existingDirs.join(", ") || "none"}`
  };
}
function evaluateEmotionalImpact(offerPath) {
  const reviewsDir = (0, import_path.join)(offerPath, "reviews");
  const files = safeReadDir(reviewsDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    return {
      name: "Emotional Impact",
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: "No review files found in reviews/"
    };
  }
  const scores = [];
  for (const file of files) {
    const content = safeReadFile((0, import_path.join)(reviewsDir, file));
    const scorePatterns = [
      /(?:score|rating|nota|pontuacao)\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/gi,
      /(\d+(?:\.\d+)?)\s*\/\s*10/g,
      /\*\*(\d+(?:\.\d+)?)\*\*\s*\/\s*10/g
    ];
    for (const pattern of scorePatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const val = parseFloat(match[1]);
        if (val >= 0 && val <= 10) {
          scores.push(val);
        }
      }
    }
  }
  if (scores.length === 0) {
    return {
      name: "Emotional Impact",
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: `Found ${files.length} review file(s) but no parseable scores`
    };
  }
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const rawScore = Math.min(10, Math.round(avgScore * 10) / 10);
  return {
    name: "Emotional Impact",
    weight: 30,
    raw_score: rawScore,
    weighted_score: rawScore * 30 / 10,
    details: `Average score ${rawScore.toFixed(1)}/10 from ${scores.length} score(s) in ${files.length} review file(s)`
  };
}
function evaluateSpecificity(offerPath) {
  const productionContent = readProductionFiles(offerPath);
  if (!productionContent.trim()) {
    return {
      name: "Specificity",
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: "No production files found"
    };
  }
  const words = countWords(productionContent);
  if (words === 0) {
    return {
      name: "Specificity",
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: "Production files are empty"
    };
  }
  let markers = 0;
  const nonRoundNumbers = productionContent.match(/\b\d+[.,]\d+\b/g);
  markers += nonRoundNumbers ? nonRoundNumbers.length : 0;
  const allNumbers = productionContent.match(/\b\d{2,}\b/g) || [];
  const nonRoundIntegers = allNumbers.filter((n) => {
    const num = parseInt(n, 10);
    return num % 10 !== 0 && num !== 100 && num !== 1e3;
  });
  markers += nonRoundIntegers.length;
  const dates = productionContent.match(/\b\d{1,2}\s+(?:de\s+)?(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/gi);
  markers += dates ? dates.length : 0;
  const properNames = productionContent.match(/(?<=[a-z]\s)[A-Z][a-zà-ú]{2,}/g);
  markers += properNames ? Math.min(properNames.length, 20) : 0;
  const locations = productionContent.match(/(?:de|em|no|na)\s+[A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)*/g);
  markers += locations ? Math.min(locations.length, 15) : 0;
  const sensorialPatterns = [
    /\b(?:3h|2h|4h|5h|meia-noite|madrugada|amanhecer)\b/gi,
    /\b(?:suando|tremendo|acordou|olhou|sentiu|ouviu|viu|tocou)\b/gi,
    /\b(?:peito|barriga|cabeça|cabeca|costas|joelho|mão|mao|olho|boca)\b/gi
  ];
  for (const pattern of sensorialPatterns) {
    const matches = productionContent.match(pattern);
    markers += matches ? matches.length : 0;
  }
  const densityPer1000 = markers / words * 1e3;
  let rawScore;
  if (densityPer1000 >= 8) rawScore = 10;
  else if (densityPer1000 >= 5) rawScore = 7;
  else if (densityPer1000 >= 2) rawScore = 4;
  else rawScore = 1;
  return {
    name: "Specificity",
    weight: 25,
    raw_score: rawScore,
    weighted_score: rawScore * 25 / 10,
    details: `${markers} markers in ${words} words (${densityPer1000.toFixed(1)}/1000 words)`
  };
}
function evaluateMupMusAlignment(offerPath) {
  const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
  const mecContent = safeReadFile(mecPath);
  if (!mecContent) {
    return {
      name: "MUP/MUS Alignment",
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: "No mecanismo-unico.yaml found \u2014 cannot check alignment"
    };
  }
  const productionContent = readProductionFiles(offerPath);
  if (!productionContent.trim()) {
    return {
      name: "MUP/MUS Alignment",
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: "No production files found to check alignment"
    };
  }
  const gimmickName = yamlFieldValue(mecContent, "gimmick_name");
  const sexyCause = yamlFieldValue(mecContent, "sexy_cause");
  const authorityHook = yamlFieldValue(mecContent, "authority_hook");
  const lowerProd = productionContent.toLowerCase();
  const found = [];
  if (gimmickName && lowerProd.includes(gimmickName.toLowerCase())) {
    found.push(`gimmick_name ("${gimmickName}")`);
  }
  if (sexyCause && lowerProd.includes(sexyCause.toLowerCase())) {
    found.push(`sexy_cause ("${sexyCause}")`);
  }
  if (authorityHook && lowerProd.includes(authorityHook.toLowerCase())) {
    found.push(`authority_hook ("${authorityHook}")`);
  }
  const count = found.length;
  let rawScore;
  if (count >= 3) rawScore = 10;
  else if (count === 2) rawScore = 7;
  else if (count === 1) rawScore = 4;
  else rawScore = 0;
  const missing = [];
  if (gimmickName && !found.some((f) => f.startsWith("gimmick"))) missing.push("gimmick_name");
  if (sexyCause && !found.some((f) => f.startsWith("sexy"))) missing.push("sexy_cause");
  if (authorityHook && !found.some((f) => f.startsWith("authority"))) missing.push("authority_hook");
  return {
    name: "MUP/MUS Alignment",
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `Found: ${found.join(", ") || "none"}. Missing: ${missing.join(", ") || "none"}`
  };
}
function evaluateAntiHomogeneization(offerPath) {
  const productionContent = readProductionFiles(offerPath);
  if (!productionContent.trim()) {
    return {
      name: "Anti-Homogeneization",
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: "No production files found"
    };
  }
  const cliches = [
    /\bmétodo\s+infalível\b/gi,
    /\bmetodo\s+infalivel\b/gi,
    /\bsegredo\s+d[oae]s?\b/gi,
    /\btransformação\b/gi,
    /\btransformacao\b/gi,
    /\bfinalmente[\s,]/gi,
    /\bimagine\s/gi,
    /\brevolucion[aá]ri[oa]\b/gi,
    /\bincrível\b/gi,
    /\bincrivel\b/gi,
    /\bliberdade\s+financeira\b/gi,
    /\bcorpo\s+dos\s+sonhos\b/gi,
    /\bsem\s+(?:dieta|esforço|esforco)\b/gi,
    /\bmetabolismo\s+acelerado\b/gi,
    /\bconexão\s+profunda\b/gi,
    /\bconexao\s+profunda\b/gi,
    /\batracao\s+irresist[ií]vel\b/gi,
    /\brenda\s+extra\b/gi,
    /\bdesbloqu(?:ear|eie)\b/gi,
    /\bempoder[ae]/gi
  ];
  const found = [];
  for (const cliche of cliches) {
    const matches = productionContent.match(cliche);
    if (matches && matches.length > 0) {
      found.push(`"${matches[0]}" (x${matches.length})`);
    }
  }
  const totalCliches = found.length;
  let rawScore;
  if (totalCliches === 0) rawScore = 10;
  else if (totalCliches <= 2) rawScore = 7;
  else if (totalCliches <= 5) rawScore = 4;
  else rawScore = 1;
  return {
    name: "Anti-Homogeneization",
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: totalCliches === 0 ? "0 cliches detected \u2014 clean" : `${totalCliches} cliche(s) detected: ${found.join(", ")}`
  };
}
function evaluateFormatting(offerPath) {
  const productionContent = readProductionFiles(offerPath);
  if (!productionContent.trim()) {
    return {
      name: "Formatting",
      weight: 5,
      raw_score: 0,
      weighted_score: 0,
      details: "No production files found"
    };
  }
  const hasTemplateHeader = />\s*\*\*Template\s+usado\s*:\*\*/i.test(productionContent);
  const rawScore = hasTemplateHeader ? 10 : 0;
  return {
    name: "Formatting",
    weight: 5,
    raw_score: rawScore,
    weighted_score: rawScore * 5 / 10,
    details: hasTemplateHeader ? "Template header present in production files" : 'Missing "> **Template usado:**" header in production files'
  };
}
async function evaluateHelixCompleteness(offerPath) {
  const helixPath = (0, import_path.join)(offerPath, "helix-state.yaml");
  const content = safeReadFile(helixPath);
  if (!content) {
    return {
      name: "HELIX Completeness",
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: "helix-state.yaml not found"
    };
  }
  let phasesCompleted = 0;
  const briefingPhasesMatch = content.match(/phases_completed\s*:\s*(\d+)/);
  if (briefingPhasesMatch) {
    phasesCompleted = parseInt(briefingPhasesMatch[1], 10);
  } else {
    const completedMatches = content.match(/status:\s*completed/g);
    phasesCompleted = completedMatches ? completedMatches.length : 0;
  }
  const totalPhases = 10;
  const completionPct = Math.min(100, phasesCompleted / totalPhases * 100);
  let rawScore;
  if (phasesCompleted >= 10) rawScore = 10;
  else if (phasesCompleted >= 8) rawScore = 8;
  else if (phasesCompleted >= 6) rawScore = 6;
  else if (phasesCompleted >= 4) rawScore = 4;
  else if (phasesCompleted >= 2) rawScore = 2;
  else rawScore = 0;
  return {
    name: "HELIX Completeness",
    weight: 30,
    raw_score: rawScore,
    weighted_score: rawScore * 30 / 10,
    details: `${phasesCompleted}/${totalPhases} phases completed (${completionPct.toFixed(0)}%)`
  };
}
async function evaluateMupQuality(offerPath) {
  const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
  const content = safeReadFile(mecPath);
  if (!content) {
    return {
      name: "MUP Quality",
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: "mecanismo-unico.yaml not found"
    };
  }
  let blindCriticScore = 0;
  const mecScoreMatch = content.match(/blind_critic_mup\s*:\s*([\d.]+)/);
  if (mecScoreMatch) {
    blindCriticScore = parseFloat(mecScoreMatch[1]);
  } else {
    const helixContent = safeReadFile((0, import_path.join)(offerPath, "helix-state.yaml"));
    const helixScoreMatch = helixContent.match(/blind_critic_mup[_\s]*score\s*:\s*([\d.]+)/);
    if (helixScoreMatch) {
      blindCriticScore = parseFloat(helixScoreMatch[1]);
    }
  }
  const stateMatch = content.match(/^state\s*:\s*["']?(\w+)["']?/m);
  const mecState = stateMatch ? stateMatch[1].toUpperCase() : "UNKNOWN";
  const hasMupNewCause = /new_cause\s*:/.test(content) && content.match(/new_cause\s*:\s*["']?.{10,}/)?.[0] !== void 0;
  const hasMupParadigmShift = /paradigm_shift\s*:/.test(content) && content.match(/paradigm_shift\s*:\s*["']?.{10,}/)?.[0] !== void 0;
  let rawScore = 0;
  if (blindCriticScore >= 9) rawScore += 6;
  else if (blindCriticScore >= 8) rawScore += 5;
  else if (blindCriticScore >= 7) rawScore += 4;
  else if (blindCriticScore >= 6) rawScore += 3;
  else if (blindCriticScore > 0) rawScore += 1;
  if (mecState === "APPROVED") rawScore += 2;
  else if (mecState === "VALIDATED") rawScore += 1.5;
  else if (mecState === "DRAFT") rawScore += 0.5;
  if (hasMupNewCause) rawScore += 1;
  if (hasMupParadigmShift) rawScore += 1;
  rawScore = Math.min(10, Math.round(rawScore * 10) / 10);
  return {
    name: "MUP Quality",
    weight: 25,
    raw_score: rawScore,
    weighted_score: rawScore * 25 / 10,
    details: `State: ${mecState}, blind_critic_mup: ${blindCriticScore || "N/A"}, new_cause: ${hasMupNewCause ? "YES" : "NO"}, paradigm_shift: ${hasMupParadigmShift ? "YES" : "NO"}`
  };
}
async function evaluateMusQuality(offerPath) {
  const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
  const content = safeReadFile(mecPath);
  if (!content) {
    return {
      name: "MUS Quality",
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: "mecanismo-unico.yaml not found"
    };
  }
  let blindCriticScore = 0;
  const mecScoreMatch = content.match(/blind_critic_mus\s*:\s*([\d.]+)/);
  if (mecScoreMatch) {
    blindCriticScore = parseFloat(mecScoreMatch[1]);
  } else {
    const helixContent = safeReadFile((0, import_path.join)(offerPath, "helix-state.yaml"));
    const helixScoreMatch = helixContent.match(/blind_critic_mus[_\s]*score\s*:\s*([\d.]+)/);
    if (helixScoreMatch) {
      blindCriticScore = parseFloat(helixScoreMatch[1]);
    }
  }
  const musSection = content.match(/mus:([\s\S]*?)(?=\n\w|\n  \w{2,}:(?!\s+-)|\n---|\Z)/)?.[1] || "";
  const hasHeroIngredient = /hero_ingredient\s*:/.test(content) && content.match(/hero_ingredient[\s\S]{5,}/)?.[0] !== void 0;
  const hasGimmickName = /gimmick_name\s*:/.test(content);
  const hasNewOpportunity = /new_opportunity\s*:/.test(content) && content.match(/new_opportunity\s*:\s*.{5,}/)?.[0] !== void 0;
  let rawScore = 0;
  if (blindCriticScore >= 9) rawScore += 6;
  else if (blindCriticScore >= 8) rawScore += 5;
  else if (blindCriticScore >= 7) rawScore += 4;
  else if (blindCriticScore >= 6) rawScore += 3;
  else if (blindCriticScore > 0) rawScore += 1;
  if (hasHeroIngredient) rawScore += 1.5;
  if (hasGimmickName) rawScore += 1.5;
  if (hasNewOpportunity) rawScore += 1;
  rawScore = Math.min(10, Math.round(rawScore * 10) / 10);
  return {
    name: "MUS Quality",
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `blind_critic_mus: ${blindCriticScore || "N/A"}, hero_ingredient: ${hasHeroIngredient ? "YES" : "NO"}, gimmick_name: ${hasGimmickName ? "YES" : "NO"}, new_opportunity: ${hasNewOpportunity ? "YES" : "NO"}`
  };
}
async function evaluateVocAlignment(offerPath) {
  const synthesisPath = (0, import_path.join)(offerPath, "research", "synthesis.md");
  const content = safeReadFile(synthesisPath);
  if (!content || !content.trim()) {
    return {
      name: "VOC Alignment",
      weight: 15,
      raw_score: 0,
      weighted_score: 0,
      details: "research/synthesis.md not found or empty"
    };
  }
  const wordCount = countWords(content);
  const lowerContent = content.toLowerCase();
  const hasDRE = /dre|emocao dominante|emoção dominante|dominant emotion/i.test(content);
  const hasAvatar = /avatar|persona|perfil do/i.test(content);
  const hasQuotes = /[""].{10,}[""]/.test(content) || /^>\s*.{10,}/m.test(content);
  const hasInsights = /insight|descoberta|finding/i.test(content);
  const hasConfidence = /confidence|confianca|confiança/i.test(content);
  const sectionsFound = [hasDRE, hasAvatar, hasQuotes, hasInsights, hasConfidence].filter(Boolean).length;
  let rawScore = 0;
  if (wordCount >= 2e3) rawScore += 4;
  else if (wordCount >= 1e3) rawScore += 3;
  else if (wordCount >= 500) rawScore += 2;
  else if (wordCount >= 100) rawScore += 1;
  rawScore += sectionsFound * 1.2;
  rawScore = Math.min(10, Math.round(rawScore * 10) / 10);
  return {
    name: "VOC Alignment",
    weight: 15,
    raw_score: rawScore,
    weighted_score: rawScore * 15 / 10,
    details: `synthesis.md: ${wordCount} words, ${sectionsFound}/5 key sections present. Sections: DRE=${hasDRE}, Avatar=${hasAvatar}, Quotes=${hasQuotes}, Insights=${hasInsights}, Confidence=${hasConfidence}`
  };
}
async function evaluateMecanismoState(offerPath) {
  const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
  const content = safeReadFile(mecPath);
  if (!content) {
    return {
      name: "Mecanismo State",
      weight: 10,
      raw_score: 0,
      weighted_score: 0,
      details: "mecanismo-unico.yaml not found"
    };
  }
  const stateMatch = content.match(/^state\s*:\s*["']?(\w+)["']?/m);
  const mecState = stateMatch ? stateMatch[1].toUpperCase() : "UNKNOWN";
  let rawScore;
  let pct;
  if (mecState === "APPROVED") {
    rawScore = 10;
    pct = 100;
  } else if (mecState === "VALIDATED") {
    rawScore = 8;
    pct = 80;
  } else if (mecState === "DRAFT") {
    rawScore = 4;
    pct = 40;
  } else {
    rawScore = 0;
    pct = 0;
  }
  return {
    name: "Mecanismo State",
    weight: 10,
    raw_score: rawScore,
    weighted_score: rawScore * 10 / 10,
    details: `State: ${mecState} (${pct}%)`
  };
}
async function evaluateBriefingGate(offerRelativePath) {
  const resolved = resolveOfferPath(offerRelativePath);
  const criteria = await Promise.all([
    evaluateHelixCompleteness(resolved),
    evaluateMupQuality(resolved),
    evaluateMusQuality(resolved),
    evaluateVocAlignment(resolved),
    evaluateMecanismoState(resolved)
  ]);
  const totalWeighted = criteria.reduce((sum, c) => sum + c.weighted_score, 0);
  const total = Math.round(totalWeighted * 10) / 10;
  let verdict;
  if (total >= 75) verdict = "PASSED";
  else if (total >= 50) verdict = "NEEDS_REVIEW";
  else verdict = "FAILED";
  return { total_weighted: total, verdict, criteria };
}
function evaluateResearchGate(offerPath) {
  const resolved = resolveOfferPath(offerPath);
  const criteria = [
    evaluateVocDepth(resolved),
    evaluateCompetitorAnalysis(resolved),
    evaluateMechanismDiscovery(resolved),
    evaluateAvatarDefinition(resolved),
    evaluateStructureCompliance(resolved)
  ];
  const totalWeighted = criteria.reduce((sum, c) => sum + c.weighted_score, 0);
  return {
    gate: "research",
    total_weighted: Math.round(totalWeighted * 10) / 10,
    verdict: computeVerdict(totalWeighted),
    criteria
  };
}
function evaluateProductionGate(offerPath) {
  const resolved = resolveOfferPath(offerPath);
  const criteria = [
    evaluateEmotionalImpact(resolved),
    evaluateSpecificity(resolved),
    evaluateMupMusAlignment(resolved),
    evaluateAntiHomogeneization(resolved),
    evaluateFormatting(resolved)
  ];
  const totalWeighted = criteria.reduce((sum, c) => sum + c.weighted_score, 0);
  return {
    gate: "production",
    total_weighted: Math.round(totalWeighted * 10) / 10,
    verdict: computeVerdict(totalWeighted),
    criteria
  };
}
function formatGateReport(score) {
  const divider = "\u2550".repeat(60);
  const thinDivider = "\u2500".repeat(60);
  const verdictEmoji = score.verdict === "PASSED" ? "PASSED" : score.verdict === "NEEDS_REVIEW" ? "NEEDS REVIEW" : "FAILED";
  const lines = [
    divider,
    `  WEIGHTED ${score.gate.toUpperCase()} GATE \u2014 ${verdictEmoji}`,
    `  Total Score: ${score.total_weighted.toFixed(1)} / 100`,
    divider,
    ""
  ];
  for (const c of score.criteria) {
    const bar = "\u2588".repeat(Math.round(c.raw_score)) + "\u2591".repeat(10 - Math.round(c.raw_score));
    lines.push(`  ${c.name} (${c.weight}%)`);
    lines.push(`    Raw: ${c.raw_score}/10  |  Weighted: ${c.weighted_score.toFixed(1)}/${c.weight}`);
    lines.push(`    ${bar}`);
    lines.push(`    ${c.details}`);
    lines.push("");
  }
  lines.push(thinDivider);
  lines.push(`  Verdict: ${score.verdict} (>=85 PASSED | 70-84 NEEDS_REVIEW | <70 FAILED)`);
  lines.push(thinDivider);
  return lines.join("\n");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  evaluateBriefingGate,
  evaluateProductionGate,
  evaluateResearchGate,
  formatGateReport
});
