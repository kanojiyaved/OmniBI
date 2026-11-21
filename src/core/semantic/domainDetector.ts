import { BusinessDomain, ColumnProfile } from '../../types';
import { DOMAIN_ONTOLOGIES } from './domainOntology';

export interface DomainDetectionResult {
  domain: BusinessDomain;
  confidence: number; // 0 to 1
  reasoning: string[];
  domainLabel: string;
  allScores: Record<BusinessDomain, number>;
}

const normalize = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();

/**
 * Inspects a set of columns, inferred types, and profiles to accurately classify
 * the dataset into its primary business domain with transparent multi-factor reasoning.
 */
export const detectBusinessDomain = (
  columns: string[],
  profiles: Record<string, ColumnProfile> = {}
): DomainDetectionResult => {
  const domains: BusinessDomain[] = [
    'sales',
    'marketing',
    'finance',
    'ecommerce',
    'customer_analytics',
    'hr',
    'inventory',
    'operations',
    'saas',
    'healthcare',
  ];

  const scores: Record<BusinessDomain, number> = {
    sales: 0,
    marketing: 0,
    finance: 0,
    ecommerce: 0,
    customer_analytics: 0,
    hr: 0,
    inventory: 0,
    operations: 0,
    saas: 0,
    financial: 0,
    healthcare: 0,
    supply_chain: 0,
    general: 0.15, // Baseline fallback
  };

  const domainMatches: Record<BusinessDomain, string[]> = {
    sales: [],
    marketing: [],
    finance: [],
    ecommerce: [],
    customer_analytics: [],
    hr: [],
    inventory: [],
    operations: [],
    saas: [],
    financial: [],
    healthcare: [],
    supply_chain: [],
    general: [],
  };

  const normalizedCols = columns.map((c) => ({
    original: c,
    norm: normalize(c),
    profile: profiles[c],
  }));

  // Analyze each domain
  for (const domain of domains) {
    const ontology = DOMAIN_ONTOLOGIES[domain];

    for (const col of normalizedCols) {
      // 1. Primary Metrics Match (High Weight: +3.0)
      for (const pm of ontology.primaryMetrics) {
        if (col.norm === pm || col.norm.includes(pm)) {
          scores[domain] += 3.0;
          domainMatches[domain].push(`Primary KPI "${col.original}" matches ${pm.toUpperCase()}`);
          break;
        }
      }

      // 2. Secondary Metrics Match (Medium Weight: +1.5)
      for (const sm of ontology.secondaryMetrics) {
        if (col.norm === sm || col.norm.includes(sm)) {
          scores[domain] += 1.5;
          domainMatches[domain].push(`Secondary Metric "${col.original}" matches ${sm}`);
          break;
        }
      }

      // 3. Domain Dimensions Match (Medium Weight: +1.5)
      for (const dim of ontology.dimensions) {
        if (col.norm === dim || col.norm.includes(dim)) {
          scores[domain] += 1.5;
          domainMatches[domain].push(`Dimension "${col.original}" matches ${dim}`);
          break;
        }
      }

      // 4. Indicator Substring Match (+1.0)
      for (const ind of ontology.indicators) {
        if (col.norm.includes(ind)) {
          scores[domain] += 1.0;
          break;
        }
      }

      // 5. Domain Entities Match (+1.2)
      for (const ent of ontology.entities) {
        if (col.norm === ent || col.norm.includes(ent)) {
          scores[domain] += 1.2;
          domainMatches[domain].push(`Entity ID "${col.original}" matches ${ent}`);
          break;
        }
      }
    }
  }

  // Find the highest scoring domain
  let bestDomain: BusinessDomain = 'general';
  let highestScore = 0;

  for (const domain of domains) {
    if (scores[domain] > highestScore) {
      highestScore = scores[domain];
      bestDomain = domain;
    }
  }

  // Calculate normalized confidence score
  let confidence = 0.50;
  const reasoning: string[] = [];

  if (highestScore >= 3.0) {
    confidence = Math.min(0.98, Number((0.65 + (highestScore / (columns.length * 2.5))).toFixed(2)));
    const matchedItems = domainMatches[bestDomain].slice(0, 4);
    reasoning.push(
      `Detected ${DOMAIN_ONTOLOGIES[bestDomain].label} ontology (score: ${highestScore.toFixed(1)}).`
    );
    matchedItems.forEach((m) => reasoning.push(m));
  } else {
    bestDomain = 'general';
    confidence = 0.70;
    reasoning.push('Universal tabular dataset with general enterprise schema.');
    reasoning.push(`Identified ${columns.length} columns suitable for cross-functional KPI computation.`);
  }

  return {
    domain: bestDomain,
    confidence,
    reasoning,
    domainLabel: DOMAIN_ONTOLOGIES[bestDomain].label,
    allScores: scores,
  };
};
