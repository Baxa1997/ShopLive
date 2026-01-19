import { Tool } from '@/types';
import { Briefcase, Utensils, Mail, Zap, LayoutTemplate, ShoppingBag, Package } from 'lucide-react';

export const TOOLS: Tool[] = [
  {
      id: 'shopify-importer',
      title: 'Shopify Product Importer',
      description: 'Convert messy supplier data into perfect Shopify CSV files with our step-by-step wizard.',
      icon: <Package className="w-6 h-6" />,
      category: 'Work',
      href: '/tools/shopify-importer',
      systemPrompt: '',
      inputs: []
  },
  {
      id: 'amazon-generator',
      title: 'Amazon Listing Optimizer',
      description: 'Upload image & details to generate high-converting Amazon product copy.',
      icon: <ShoppingBag className="w-6 h-6" />,
      category: 'Work',
      href: '/tools/amazon-generator',
      systemPrompt: '',
      inputs: []
  },
  {
    id: 'bureaucracy-buster',
    title: 'Bureaucracy Buster',
    description: 'Transform complex official documents into plain English summaries.',
    icon: <Briefcase className="w-6 h-6" />,
    category: 'Work',
    systemPrompt: 'You are an expert at simplifying complex bureaucratic language. Summarize the following text in plain English.',
    inputs: [
      {
        id: 'document-text',
        label: 'Paste Document Text',
        type: 'textarea',
        placeholder: 'Paste the official letter or document content here...',
      },
    ],
  },
  {
    id: 'fridge-chef',
    title: 'Fridge Chef',
    description: 'Generate gourmet recipes from whatever ingredients you have left.',
    icon: <Utensils className="w-6 h-6" />,
    category: 'Home',
    systemPrompt: 'You are a creative chef. varied recipes based on the provided ingredients.',
    inputs: [
      {
        id: 'ingredients',
        label: 'Available Ingredients',
        type: 'textarea',
        placeholder: 'e.g., 2 eggs, milk, half a onion, soy sauce...',
      },
      {
        id: 'meal-type',
        label: 'Meal Type',
        type: 'dropdown',
        options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'],
      },
    ],
  },
  {
    id: 'email-polisher',
    title: 'Email Polisher',
    description: 'Turn rough notes into professional, polite, and effective emails.',
    icon: <Mail className="w-6 h-6" />,
    category: 'Work',
    systemPrompt: 'You are a professional communication expert. Rewrite the draft into a polished email.',
    inputs: [
      {
        id: 'draft-content',
        label: 'Draft / Notes',
        type: 'textarea',
        placeholder: 'e.g., tell bob i cant make it to the meeting bc im sick',
      },
      {
        id: 'tone',
        label: 'Desired Tone',
        type: 'dropdown',
        options: ['Professional', 'Friendly', 'Assertive', 'Apologetic'],
      },
    ],
  },
  {
    id: 'social-caption-creator',
    title: 'Caption Creator',
    description: 'Generate engaging captions for your social media posts.',
    icon: <Zap className="w-6 h-6" />,
    category: 'Social',
    systemPrompt: 'You are a social media manager. Create engaging captions for the described photo or topic.',
    inputs: [
      {
        id: 'platform',
        label: 'Platform',
        type: 'dropdown',
        options: ['Instagram', 'Twitter', 'LinkedIn', 'TikTok'],
      },
    ],
  },
  {
    id: 'story-spinner',
    title: 'Story Spinner',
    description: 'Overcome writer\'s block with creative story starters.',
    icon: <Zap className="w-6 h-6" />, // Or PenTool if imported
    category: 'Writing',
    systemPrompt: 'You are a creative writer. Generate a unique story starter based on the theme.',
    inputs: [
      {
        id: 'theme',
        label: 'Story Theme',
        type: 'text',
        placeholder: 'e.g., Cyberpunk detective...',
      },
      {
        id: 'genre',
        label: 'Genre',
        type: 'dropdown',
        options: ['Sci-Fi', 'Fantasy', 'Mystery', 'Romance'],
      },
    ],
  },
  {
    id: 'ui-architect',
    title: 'No-Code UI Architect',
    description: 'Select components and visually build your prompt for professional UI generation.',
    icon: <LayoutTemplate className="w-6 h-6" />,
    category: 'Development',
    href: '/tools/ui-architect',
    systemPrompt: '',
    inputs: []
  }
];
