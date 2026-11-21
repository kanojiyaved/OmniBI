import { 
  ColumnProfile, 
  DatasetQualityReport, 
  BusinessDomain, 
  SemanticRole,
  ColumnSemanticMapping,
  DatasetUnderstandingReport
} from '../../types';
import { calculateColumnProfile } from './statisticalEngine';
import { generateDatasetQualityReport } from './dataQualityReport';
import { detectBusinessDomain, DomainDetectionResult } from '../semantic/domainDetector';
import { inferColumnSemanticRole } from '../semantic/semanticMapper';
import { generateDatasetUnderstandingReport } from '../semantic/datasetUnderstandingReport';

export interface ProfilePipelineResult {
  profiles: Record<string, ColumnProfile>;
  quality: DatasetQualityReport;
  detectedDomain: {
    domain: BusinessDomain;
    confidence: number;
    reasoning: string[];
    domainLabel: string;
  };
  semanticMappings: Record<string, ColumnSemanticMapping>;
  understandingReport: DatasetUnderstandingReport;
}

/**
 * Runs complete data profiling, quality assessment, domain detection, semantic column mapping,
 * and AI dataset understanding report generation.
 */
export const profileEntireDataset = (
  data: Record<string, any>[],
  columns: string[],
  forcedDomain?: BusinessDomain
): ProfilePipelineResult => {
  const profiles: Record<string, ColumnProfile> = {};

  // Step 1: Compute statistical profiles
  for (const col of columns) {
    profiles[col] = calculateColumnProfile(col, data);
  }

  // Step 2: Generate data quality report
  const quality = generateDatasetQualityReport(data, columns, profiles);

  // Step 3: Detect business domain
  const detectedDomainResult: DomainDetectionResult = forcedDomain
    ? {
        domain: forcedDomain,
        confidence: 1.0,
        reasoning: [`User manual domain override set to ${forcedDomain.toUpperCase()}`],
        domainLabel: forcedDomain.toUpperCase(),
        allScores: {} as any,
      }
    : detectBusinessDomain(columns, profiles);

  // Step 4: Map semantic roles for all columns based on the detected domain
  const semanticMappings: Record<string, ColumnSemanticMapping> = {};
  for (const col of columns) {
    const mapping = inferColumnSemanticRole(col, profiles[col], detectedDomainResult.domain);
    semanticMappings[col] = mapping;
    // Align profile semanticRole with the domain-aware mapping
    if (profiles[col]) {
      profiles[col].semanticRole = mapping.role as SemanticRole;
    }
  }

  // Step 5: Generate AI Dataset Understanding Report
  const partialDataset: any = {
    columns,
    rowCount: data.length,
    columnCount: columns.length,
    detectedDomain: {
      domain: detectedDomainResult.domain,
      confidence: detectedDomainResult.confidence,
      reasoning: detectedDomainResult.reasoning,
      domainLabel: detectedDomainResult.domainLabel,
    },
    semanticMappings,
  };
  const understandingReport = generateDatasetUnderstandingReport(partialDataset);

  return {
    profiles,
    quality,
    detectedDomain: {
      domain: detectedDomainResult.domain,
      confidence: detectedDomainResult.confidence,
      reasoning: detectedDomainResult.reasoning,
      domainLabel: detectedDomainResult.domainLabel,
    },
    semanticMappings,
    understandingReport,
  };
};
