import type { Requirement } from '../types/contracts.js';
import { readJsonFile } from '../utils/fs.js';

interface RequirementFile {
  requirements: Requirement[];
}

export async function loadRequirements(
  requirementPath: string,
): Promise<Requirement[]> {
  const content = await readJsonFile<RequirementFile>(requirementPath);
  return content.requirements.map(validateRequirement);
}

function validateRequirement(requirement: Requirement): Requirement {
  if (!requirement.id || !requirement.title || !requirement.source) {
    throw new Error('Each requirement must include id, title, and source.');
  }

  if (
    !Array.isArray(requirement.acceptanceCriteria) ||
    requirement.acceptanceCriteria.length === 0
  ) {
    throw new Error(
      `Requirement ${requirement.id} must include at least one acceptance criterion.`,
    );
  }

  return requirement;
}
