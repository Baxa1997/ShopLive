import { AppWindow, Menu, LayoutTemplate, List, AlignJustify, PanelBottom } from 'lucide-react';
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
    icon: LayoutTemplate, 
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
  },
  {
      id: 'cascading-menu',
      label: 'Cascading Menu',
      icon: List,
      features: [
        { id: 'trigger', label: 'Trigger', type: 'select', options: ['Hover', 'Click'] },
        { id: 'depth', label: 'Max Depth', type: 'select', options: ['2 Levels', 'Unlimited'] },
        { id: 'icons', label: 'Menu Icons', type: 'boolean' }
      ]
  },
  {
      id: 'menu',
      label: 'Simple Menu',
      icon: AlignJustify,
      features: [
        { id: 'orientation', label: 'Orientation', type: 'select', options: ['Horizontal', 'Vertical'] },
        { id: 'divider', label: 'Dividers', type: 'boolean' },
        { id: 'activeState', label: 'Active Style', type: 'select', options: ['Underline', 'Background'] }
      ]
  },
  {
      id: 'footer',
      label: 'Site Footer',
      icon: PanelBottom,
      features: [
        { id: 'columns', label: 'Columns', type: 'select', options: ['3', '4', 'Massive'] },
        { id: 'newsletter', label: 'Newsletter', type: 'boolean' },
        { id: 'socials', label: 'Social Icons', type: 'boolean' }
      ]
  }
];
