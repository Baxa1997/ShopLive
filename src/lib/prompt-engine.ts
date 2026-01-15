import { ComponentOption } from './ui-builder-config';

export function assemblePrompt(
  selectedComponent: ComponentOption,
  userChoices: Record<string, string | boolean>
): string {
  let prompt = `Act as a Senior Frontend Developer. Create a ${selectedComponent.label} using React, Tailwind, and Framer Motion.\n`;

  // Filter keys that belong to the selected component's features to avoid stale state issues
  const validFeatureIds = selectedComponent.features.map(f => f.id);
  
  Object.entries(userChoices).forEach(([featureId, value]) => {
    if (!validFeatureIds.includes(featureId)) return;

    const feature = selectedComponent.features.find(f => f.id === featureId);
    if (!feature) return;

    if (typeof value === 'boolean') {
        // Only mention if true or specifically needed. 
        // Logic: If true boolean: "Include [Feature Label]."
        if (value === true) {
            prompt += `Include ${feature.label}.\n`;
        }
    } else if (typeof value === 'string') {
        // Logic: If select string: "Use a [Selected Value] style for [Feature Label]."
        prompt += `Use a ${value} style for ${feature.label}.\n`;
    }
  });

  prompt += `Ensure fully responsive design and accessible ARIA attributes.`;
  
  return prompt;
}
