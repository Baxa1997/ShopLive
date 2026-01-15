import { ReactNode } from 'react';

export type Category = 'All' | 'Work' | 'Development' | 'Home' | 'Social' | 'Writing';

export interface ToolInput {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'dropdown';
  options?: string[]; 
  placeholder?: string;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: ReactNode; 
  category: Category;
  href?: string;
  inputs: ToolInput[]; 
  systemPrompt: string;
}
