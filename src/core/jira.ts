import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  DefectDraft,
  JiraIssueReference,
  Requirement,
  ResolvedConfig,
} from '../types/contracts.js';
import { pathExists } from '../utils/fs.js';

interface JiraSearchResponse {
  issues: Array<{
    key: string;
    fields: {
      summary?: string;
      description?: JiraDescription;
      labels?: string[];
      priority?: {
        name?: string;
      };
    };
  }>;
}

interface JiraCreateIssueResponse {
  key: string;
}

interface JiraDescription {
  content?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}

export async function loadRequirementsFromJira(
  config: ResolvedConfig,
): Promise<Requirement[]> {
  if (
    !config.secrets.jira?.baseUrl ||
    !config.secrets.jira.email ||
    !config.secrets.jira.apiToken
  ) {
    throw new Error(
      'Jira credentials are required for Jira-backed requirement intake.',
    );
  }

  const jql =
    process.env.APERCA_JIRA_REQUIREMENTS_JQL ??
    config.secrets.jira.requirementsJql ??
    '';

  if (!jql) {
    throw new Error(
      'Jira requirement intake requires APERCA_JIRA_REQUIREMENTS_JQL or jira.requirementsJql.',
    );
  }

  const response = await jiraFetch<JiraSearchResponse>(
    config,
    '/rest/api/3/search',
    {
      method: 'POST',
      body: {
        jql,
        maxResults: 50,
        fields: ['summary', 'description', 'labels', 'priority'],
      },
    },
  );

  return response.issues.map((issue) => {
    const description = flattenJiraDescription(issue.fields.description);
    const acceptanceCriteria = extractAcceptanceCriteria(description);

    return {
      id: issue.key,
      jiraIssueKey: issue.key,
      title: issue.fields.summary ?? issue.key,
      source: 'jira',
      priority: normalizePriority(issue.fields.priority?.name),
      description,
      labels: issue.fields.labels ?? [],
      acceptanceCriteria:
        acceptanceCriteria.length > 0
          ? acceptanceCriteria
          : [
              'Requirement imported from Jira. Acceptance criteria need refinement.',
            ],
    };
  });
}

export async function createJiraDefects(
  config: ResolvedConfig,
  defects: DefectDraft[],
): Promise<JiraIssueReference[]> {
  if (!config.test.createJiraDefects || defects.length === 0) {
    return [];
  }

  if (
    !config.secrets.jira?.baseUrl ||
    !config.secrets.jira.email ||
    !config.secrets.jira.apiToken
  ) {
    return [];
  }

  if (!config.secrets.jira.projectKey) {
    return [];
  }

  const created: JiraIssueReference[] = [];

  for (const defect of defects) {
    const issueType = config.secrets.jira.bugIssueType ?? 'Bug';
    const description = [
      defect.summary,
      '',
      `Requirement: ${defect.requirementId ?? 'N/A'}`,
      `Evidence:`,
      ...defect.evidence.map((item) => `- ${item}`),
    ].join('\n');

    const response = await jiraFetch<JiraCreateIssueResponse>(
      config,
      '/rest/api/3/issue',
      {
        method: 'POST',
        body: {
          fields: {
            project: {
              key: config.secrets.jira.projectKey,
            },
            summary: defect.title,
            issuetype: {
              name: issueType,
            },
            description,
            labels: ['automation', 'playwright', 'generated-defect'],
          },
        },
      },
    );

    const url = `${config.secrets.jira.baseUrl}/browse/${response.key}`;
    defect.jiraIssueKey = response.key;
    created.push({ key: response.key, url });

    await attachEvidenceFiles(
      config,
      response.key,
      defect.evidence,
      config.projectRoot,
    );
  }

  return created;
}

async function attachEvidenceFiles(
  config: ResolvedConfig,
  issueKey: string,
  evidencePaths: string[],
  projectRoot: string,
): Promise<void> {
  for (const relativePath of evidencePaths) {
    const absolutePath = path.resolve(projectRoot, relativePath);
    if (!(await pathExists(absolutePath))) {
      continue;
    }

    const buffer = await readFile(absolutePath);
    const isImage = /\.(png|jpg|jpeg)$/i.test(absolutePath);
    const blob = new Blob([buffer], {
      type: isImage ? 'image/png' : 'application/json',
    });
    const formData = new FormData();
    formData.append('file', blob, path.basename(absolutePath));

    await jiraFetch(config, `/rest/api/3/issue/${issueKey}/attachments`, {
      method: 'POST',
      formData,
      additionalHeaders: {
        'X-Atlassian-Token': 'no-check',
      },
    });
  }
}

async function jiraFetch<T>(
  config: ResolvedConfig,
  route: string,
  options: {
    method: 'GET' | 'POST';
    body?: unknown;
    formData?: FormData;
    additionalHeaders?: Record<string, string>;
  },
): Promise<T> {
  const auth = Buffer.from(
    `${config.secrets.jira?.email ?? ''}:${config.secrets.jira?.apiToken ?? ''}`,
    'utf8',
  ).toString('base64');

  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    ...options.additionalHeaders,
  };

  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.body) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const requestInit: RequestInit = {
    method: options.method,
    headers,
  };

  if (body) {
    requestInit.body = body;
  }

  const response = await fetch(
    new URL(route, config.secrets.jira?.baseUrl).toString(),
    requestInit,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Jira request failed (${response.status}): ${message}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function flattenJiraDescription(description?: JiraDescription): string {
  const blocks = description?.content ?? [];
  const fragments: string[] = [];

  for (const block of blocks) {
    for (const item of block.content ?? []) {
      if (item.text) {
        fragments.push(item.text);
      }
    }
  }

  return fragments.join('\n').trim();
}

function extractAcceptanceCriteria(description: string): string[] {
  return description
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter((line) => line.length > 0);
}

function normalizePriority(priorityName?: string): Requirement['priority'] {
  const normalized = priorityName?.toLowerCase();
  if (normalized === 'highest' || normalized === 'critical') {
    return 'critical';
  }
  if (normalized === 'high') {
    return 'high';
  }
  if (normalized === 'medium') {
    return 'medium';
  }
  return 'low';
}
