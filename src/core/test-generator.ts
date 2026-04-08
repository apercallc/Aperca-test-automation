import type { GeneratedTestCase, Requirement } from '../types/contracts.js';

export function generateTestCases(
  requirements: Requirement[],
): GeneratedTestCase[] {
  return requirements.flatMap((requirement) => {
    const baseSlug = requirement.id.toLowerCase();
    const cases: GeneratedTestCase[] = [
      {
        id: `${baseSlug}-positive`,
        requirementId: requirement.id,
        title: `${requirement.title} behaves as expected`,
        type: 'positive',
        preconditions: ['User can access the public site'],
        steps: ['Open the target page', 'Observe the primary user path'],
        assertions: requirement.acceptanceCriteria,
        tags: [requirement.priority, 'generated', 'positive'],
      },
      {
        id: `${baseSlug}-edge`,
        requirementId: requirement.id,
        title: `${requirement.title} remains stable under edge conditions`,
        type: 'edge',
        preconditions: ['Network and page resources are available'],
        steps: [
          'Open the target page',
          'Validate fallback or structural resilience',
        ],
        assertions: [
          'Core content remains visible',
          'No critical console or page crash occurs',
        ],
        tags: [requirement.priority, 'generated', 'edge'],
      },
    ];

    if (requirement.acceptanceCriteria.length > 1) {
      cases.push({
        id: `${baseSlug}-negative`,
        requirementId: requirement.id,
        title: `${requirement.title} rejects invalid or incomplete paths`,
        type: 'negative',
        preconditions: ['A visitor starts from the public site'],
        steps: ['Attempt a partial or invalid user path'],
        assertions: [
          'The application fails safely without blank or broken critical UI',
        ],
        tags: [requirement.priority, 'generated', 'negative'],
      });
    }

    return cases;
  });
}
