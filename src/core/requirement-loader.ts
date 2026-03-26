import path from 'node:path';

import type { Requirement } from '../types/contracts.js';
import { readJsonFile } from '../utils/fs.js';

interface RequirementFile {
  requirements: Requirement[];
}

export async function loadRequirements(projectRoot: string): Promise<Requirement[]> {
  const configuredPath =
    process.env.APERCa_REQUIREMENTS_PATH ?? './config/requirements.sample.json';
  const requirementPath = path.resolve(projectRoot, configuredPath);
  const content = await readJsonFile<RequirementFile>(requirementPath);
  return content.requirements;
}
