import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ExecutionResult {
  command: string;
  passed: number;
  failed: number;
  flaky: number;
  stdout: string;
  stderr: string;
}

export async function executePlaywrightWorkflow(mode: 'execute'): Promise<ExecutionResult> {
  const command = 'npx playwright test';

  try {
    const { stdout, stderr } = await execFileAsync('npx', ['playwright', 'test'], {
      env: process.env,
      maxBuffer: 1024 * 1024 * 8,
    });

    return {
      command,
      passed: countPattern(stdout, /\bpassed\b/gi),
      failed: countPattern(stdout, /\bfailed\b/gi),
      flaky: countPattern(stdout, /\bflaky\b/gi),
      stdout,
      stderr,
    };
  } catch (error) {
    const typed = error as {
      stdout?: string;
      stderr?: string;
    };

    return {
      command,
      passed: countPattern(typed.stdout ?? '', /\bpassed\b/gi),
      failed: Math.max(1, countPattern(typed.stdout ?? '', /\bfailed\b/gi)),
      flaky: countPattern(typed.stdout ?? '', /\bflaky\b/gi),
      stdout: typed.stdout ?? '',
      stderr: typed.stderr ?? '',
    };
  }
}

function countPattern(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}
