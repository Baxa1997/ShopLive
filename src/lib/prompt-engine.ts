import { ComponentOption } from './ui-builder-config';

export function assemblePrompt(
  selectedComponent: ComponentOption,
  userChoices: Record<string, string | boolean>
): string {
  let prompt = `Act as a Senior Frontend Developer. Create a ${selectedComponent.label} using React, Tailwind, and Framer Motion.\n`;


  const validFeatureIds = selectedComponent.features.map(f => f.id);
  
  Object.entries(userChoices).forEach(([featureId, value]) => {
    if (!validFeatureIds.includes(featureId)) return;

    const feature = selectedComponent.features.find(f => f.id === featureId);
    if (!feature) return;

    if (typeof value === 'boolean') {
        if (value === true) {
            prompt += `Include ${feature.label}.\n`;
        }
    } else if (typeof value === 'string') {
        prompt += `Use a ${value} style for ${feature.label}.\n`;
    }
  });

  prompt += `Ensure fully responsive design and accessible ARIA attributes.`;
  
  return prompt;
}
