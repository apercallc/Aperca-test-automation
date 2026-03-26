import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface PlaywrightJsonReport {
  stats?: {
    expected?: number;
    skipped?: number;
    unexpected?: number;
    flaky?: number;
  };
}

export interface ExecutionResult {
  command: string;
  passed: number;
  failed: number;
  flaky: number;
  stdout: string;
  stderr: string;
}

export async function executePlaywrightWorkflow(testTargets: string[]): Promise<ExecutionResult> {
  const command = ['npx', 'playwright', 'test', ...testTargets].join(' ');
  const reportPath = path.resolve(
    process.cwd(),
    process.env.APERCA_OUTPUT_DIR ?? 'reports/latest',
    'playwright-report.json',
  );
  const args = ['playwright', 'test', ...testTargets];

  try {
    const { stdout, stderr } = await execFileAsync('npx', args, {
      env: process.env,
      maxBuffer: 1024 * 1024 * 8,
    });

    const stats = await readPlaywrightStats(reportPath);
    return {
      command,
      passed: stats.passed,
      failed: stats.failed,
      flaky: stats.flaky,
      stdout,
      stderr,
    };
  } catch (error) {
    const typed = error as {
      stdout?: string;
      stderr?: string;
    };

    const stats = await readPlaywrightStats(reportPath);
    return {
      command,
      passed: stats.passed,
      failed: stats.failed > 0 ? stats.failed : 1,
      flaky: stats.flaky,
      stdout: typed.stdout ?? '',
      stderr: typed.stderr ?? '',
    };
  }
}

async function readPlaywrightStats(
  reportPath: string,
): Promise<{ passed: number; failed: number; flaky: number }> {
  try {
    const raw = await readFile(reportPath, 'utf8');
    const report = JSON.parse(raw) as PlaywrightJsonReport;
    const expected = report.stats?.expected ?? 0;
    const skipped = report.stats?.skipped ?? 0;
    const failed = report.stats?.unexpected ?? 0;
    const flaky = report.stats?.flaky ?? 0;
    const passed = Math.max(0, expected - skipped - failed);
    return { passed, failed, flaky };
  } catch {
    return { passed: 0, failed: 0, flaky: 0 };
  }
}
