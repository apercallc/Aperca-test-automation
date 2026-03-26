export interface Requirement {
  id: string;
  title: string;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  acceptanceCriteria: string[];
}

export interface GeneratedTestCase {
  id: string;
  requirementId: string;
  title: string;
  type: 'positive' | 'negative' | 'edge';
  preconditions: string[];
  steps: string[];
  assertions: string[];
  tags: string[];
}

export interface WorkflowSummary {
  runId: string;
  mode: 'plan' | 'generate' | 'execute';
  startedAt: string;
  finishedAt: string;
  requirements: number;
  generatedCases: number;
  generatedSpecs: string[];
  execution?: {
    passed: number;
    failed: number;
    flaky: number;
    command: string;
  };
  defects: DefectDraft[];
}

export interface DefectDraft {
  title: string;
  severity: 'low' | 'medium' | 'high';
  requirementId?: string;
  summary: string;
  evidence: string[];
}
