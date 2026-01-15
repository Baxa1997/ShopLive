import { AppWindow, Menu, LayoutTemplate } from 'lucide-react';
import { ElementType } from 'react';

export interface Feature {
  id: string;
  label: string;
  type: 'boolean' | 'select';
  options?: string[];
}

export interface ComponentOption {
  id: string;
  label: string;
  icon: ElementType;
  features: Feature[];
}

export const UI_COMPONENTS: ComponentOption[] = [
  {
    id: 'modal',
    label: 'Modal / Popup',
    icon: AppWindow,
    features: [
      {
        id: 'animation',
        label: 'Animation',
        type: 'select',
        options: ['Fade', 'Slide', 'Scale']
      },
      {
        id: 'backdrop',
        label: 'Backdrop',
        type: 'boolean'
      },
      {
        id: 'closeAction',
        label: 'Close Action',
        type: 'select',
        options: ['Button', 'Click Outside']
      }
    ]
  },
  {
    id: 'navbar',
    label: 'Navbar',
    icon: Menu,
    features: [
      {
        id: 'position',
        label: 'Position',
        type: 'select',
        options: ['Sticky', 'Fixed']
      },
      {
        id: 'style',
        label: 'Style',
        type: 'select',
        options: ['Glassmorphism', 'Solid']
      },
      {
        id: 'links',
        label: 'Links',
        type: 'select',
        options: ['Center', 'Right']
      }
    ]
  },
  {
    id: 'hero',
    label: 'Hero Section',
    icon: LayoutTemplate, // Using LayoutTemplate as a proxy for Hero Section generic icon
    features: [
      {
        id: 'layout',
        label: 'Layout',
        type: 'select',
        options: ['Split', 'Centered']
      },
      {
        id: 'background',
        label: 'Background',
        type: 'select',
        options: ['Image', 'Gradient', 'Video']
      },
      {
        id: 'ctaButtons',
        label: 'CTA Buttons',
        type: 'select',
        options: ['One', 'Two']
      }
    ]
  }
];
