import type { RulesTestResult } from '../types';

interface PhaseData {
  phase: string;
  debug?: {
    rulesApplied?: string[];
  };
  data?: {
    rows?: unknown[];
    mappedRows?: unknown[];
  };
}

interface TestData {
  data?: {
    data?: {
      phases?: PhaseData[];
    };
  };
}

const extractRulesFromPhases = (phases: PhaseData[]): Array<{
  name: string;
  type: string;
  phase: string;
  target: string;
}> => {
  const allRulesApplied: Array<{
    name: string;
    type: string;
    phase: string;
    target: string;
  }> = [];

  phases.forEach((phase) => {
    if (phase.debug?.rulesApplied) {
      phase.debug.rulesApplied.forEach((ruleName: string) => {
        allRulesApplied.push({
          name: ruleName,
          type: 'Unknown',
          phase: phase.phase,
          target: 'Multiple',
        });
      });
    }
  });

  return allRulesApplied;
};

// Get first row data from phase
const getFirstRow = (phase: PhaseData | undefined): Record<string, unknown> => {
  if (!phase?.data?.rows?.[0]) return {};
  return phase.data.rows[0] as Record<string, unknown>;
};

// Get last row data (mapped or regular) from phase  
const getLastRow = (phase: PhaseData | undefined): Record<string, unknown> => {
  if (phase?.data?.mappedRows?.[0]) {
    return phase.data.mappedRows[0] as Record<string, unknown>;
  }
  return getFirstRow(phase);
};

const extractTestData = (phases: PhaseData[]): {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
} => {
  const firstPhase = phases[0];
  const lastPhase = phases[phases.length - 1];

  return {
    before: getFirstRow(firstPhase),
    after: getLastRow(lastPhase),
  };
};

// Default result helper - reduces complexity
const getDefaultResult = (): RulesTestResult => ({
  success: true,
  testData: { before: {}, after: {} },
  rulesApplied: [],
  processing: { errors: [], warnings: [] },
});

// Successful result helper - reduces complexity
const getSuccessfulResult = (phases: PhaseData[]): RulesTestResult => ({
  success: true,
  testData: extractTestData(phases),
  rulesApplied: extractRulesFromPhases(phases),
  processing: { errors: [], warnings: [] },
});

// Main extractor function - complexity under 7
export const extractTestResultFromData = (data: unknown): RulesTestResult => {
  const testData = data as TestData;
  const phases = testData?.data?.data?.phases;
  
  if (!Array.isArray(phases)) {
    return getDefaultResult();
  }

  return getSuccessfulResult(phases);
};