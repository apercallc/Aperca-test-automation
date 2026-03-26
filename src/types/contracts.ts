export interface Requirement {
  id: string;
  title: string;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  acceptanceCriteria: string[];
  description?: string;
  labels?: string[];
  jiraIssueKey?: string;
}

export interface EnvironmentConfig {
  name: string;
  baseUrl: string;
  browser: string;
  headless: boolean;
}

export interface TestConfig {
  parallel: boolean;
  maxThreads: number;
  retryCount: number;
  flakeDetection: boolean;
  timeoutMs: number;
  failureScreenshot: boolean;
  artifactsDir: string;
  archiveHistory: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  safeMode: boolean;
  redactSensitiveData: boolean;
  persistRawArtifacts: boolean;
  exportCsv: boolean;
  createJiraDefects: boolean;
  syncZephyr: boolean;
  requireEnvironmentReady: boolean;
  executeStable: boolean;
  executeGenerated: boolean;
}

export interface SecretConfig {
  jira?: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey?: string;
    bugIssueType?: string;
    requirementsJql?: string;
    zephyrProjectKey?: string;
    zephyrFolder?: string;
  };
  github?: {
    token: string;
    repository: string;
  };
  notifications?: {
    slack?: {
      webhookUrl: string;
      channel?: string;
      username?: string;
    };
  };
  apiKeys?: {
    openai?: string;
    anthropic?: string;
    apercaInternal?: string;
  };
  credentials?: {
    defaultUser?: string;
    defaultPassword?: string;
  };
}

export interface ResolvedConfig {
  environment: EnvironmentConfig;
  test: TestConfig;
  secrets: SecretConfig;
  projectRoot: string;
  outputDir: string;
  secretsPath: string;
  requirementsPath: string;
  requirementsSource: 'file' | 'jira';
  notifications: {
    slackEnabled: boolean;
  };
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
  environment: {
    name: string;
    baseUrl: string;
  };
  readiness?: EnvironmentReadiness;
  requirements: number;
  generatedCases: number;
  generatedSpecs: string[];
  configuration: {
    slackEnabled: boolean;
    archiveHistory: boolean;
    requirementsPath: string;
    requirementsSource: 'file' | 'jira';
    safeMode: boolean;
    redactSensitiveData: boolean;
  };
  validation: {
    warnings: string[];
  };
  execution?: {
    passed: number;
    failed: number;
    flaky: number;
    command: string;
  };
  defects: DefectDraft[];
  exportedArtifacts?: {
    testCaseCsv?: string;
  };
  integrations?: {
    jiraDefectsCreated: JiraIssueReference[];
    zephyrSync: 'disabled' | 'csv-export-only';
  };
}

export interface DefectDraft {
  title: string;
  severity: 'low' | 'medium' | 'high';
  requirementId?: string;
  summary: string;
  evidence: string[];
  jiraIssueKey?: string;
}

export interface DoctorReport {
  ok: boolean;
  environment: {
    baseUrl: string;
    environmentName: string;
  };
  checks: Array<{
    name: string;
    ok: boolean;
    details: string;
  }>;
  warnings: string[];
}

export interface SecurityPosture {
  safeMode: boolean;
  redactSensitiveData: boolean;
  persistRawArtifacts: boolean;
  slackNotificationsEnabled: boolean;
  notes: string[];
}

export interface EnvironmentReadiness {
  ready: boolean;
  statusCode?: number;
  checkedUrl: string;
  details: string;
}

export interface JiraIssueReference {
  key: string;
  url: string;
}
