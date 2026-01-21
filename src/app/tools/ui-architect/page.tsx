'use client';

import { useState } from 'react';
import { ComponentSelector } from '@/components/ui-builder/ComponentSelector';
import { FeatureForm } from '@/components/ui-builder/FeatureForm';
import { PromptOutput } from '@/components/ui-builder/PromptOutput';
import { ComponentOption } from '@/lib/ui-builder-config';
import { assemblePrompt } from '@/lib/prompt-engine';
import { Sparkles, ArrowRight, Package } from 'lucide-react';

import Link from 'next/link';

import { ComponentPreviewModal } from '@/components/ui-builder/ComponentPreviewModal';

export default function UIArchitectPage() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentOption | null>(null);
  const [choices, setChoices] = useState<Record<string, string | boolean>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Modal State
  const [previewComponent, setPreviewComponent] = useState<ComponentOption | null>(null);

  const handleComponentClick = (component: ComponentOption) => {
    setPreviewComponent(component);
  };

  const handleConfirmSelect = (component: ComponentOption) => {
    setSelectedComponent(component);
    setPreviewComponent(null);
    setChoices({}); // Reset choices
    setGeneratedPrompt(''); // Reset prompt
  };

  const handleFeatureChange = (featureId: string, value: string | boolean) => {
    setChoices((prev) => ({
      ...prev,
      [featureId]: value
    }));
  };

  const handleGenerate = () => {
    if (!selectedComponent) return;
    
    setIsGenerating(true);
    // The prompt is "accumulated" instantly in logic, but PromptOutput will animate it.
    const prompt = assemblePrompt(selectedComponent, choices);
    setGeneratedPrompt(prompt);
    
    // Reset generating state after a delay or let the child handle it via effect
    setTimeout(() => setIsGenerating(false), 500); 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans pb-20 relative">
      
      <ComponentPreviewModal 
        isOpen={!!previewComponent}
        component={previewComponent}
        onClose={() => setPreviewComponent(null)}
        onConfirm={handleConfirmSelect}
      />

      <div className="absolute top-6 left-6 z-10">
         <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-emerald-600/10 p-2 rounded-lg backdrop-blur-md border border-emerald-600/20 group-hover:bg-emerald-600/20 transition-all">
                <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-heading font-bold text-lg text-slate-800 tracking-tight hidden md:block">ShopsReady</span>
          </Link>
      </div>

      <header className="mb-12 text-center max-w-4xl mx-auto pt-10">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
             <Sparkles size={24} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Build your Interface
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          No-Code UI Architect: Select a component, customize its features, and instantly generate a professional AI prompt implementation.
        </p>
      </header>
      
      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Component Selector */}
        <section className="lg:col-span-3 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-4 border-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-sm">1</span>
                Select Component
            </h2>
            <ComponentSelector 
                selectedId={selectedComponent?.id || null} 
                onSelect={handleComponentClick} 
            />
        </section>

        {/* Center Column: Feature Form */}
        <section className="lg:col-span-4 flex flex-col gap-6">
            <h2 className={`text-xl font-bold text-slate-800 border-b pb-4 border-slate-200 flex items-center gap-2 ${!selectedComponent ? 'opacity-50' : ''}`}>
               <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-sm">2</span>
                Customize
            </h2>
             {selectedComponent ? (
                <div className="flex flex-col gap-6"> 
                   <FeatureForm 
                        component={selectedComponent}
                        choices={choices}
                        onChange={handleFeatureChange}
                    />
                    
                    <button
                        onClick={handleGenerate}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-emerald-200/50 transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg flex items-center justify-center gap-2 group"
                    >
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Generate Prompt
                    </button>
                </div>
            ) : (
                <div className="h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col gap-3 items-center justify-center text-slate-400 bg-slate-50/50">
                    <ArrowRight className="w-8 h-8 opacity-50" />
                    <span>Select a component first</span>
                </div>
            )}
        </section>

        {/* Right Column: Prompt Output */}
        <section className="lg:col-span-5 flex flex-col gap-6">
             <h2 className="text-xl font-bold text-slate-800 border-b pb-4 border-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-sm">3</span>
                Get Prompt
            </h2>
            <PromptOutput 
                prompt={generatedPrompt} 
                isGenerating={isGenerating} 
            />
        </section>

      </main>
    </div>
  );
}
