'use client';

import { useState, useEffect } from 'react';
import { Copy, Terminal } from 'lucide-react';

interface PromptOutputProps {
  prompt: string;
  isGenerating: boolean;
  onGenerationComplete?: () => void;
}

export function PromptOutput({ prompt, isGenerating, onGenerationComplete }: PromptOutputProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!prompt) {
        setDisplayedText('');
        return;
    }

    setDisplayedText(''); 
    
    let i = -1;
    const speed = 20; 

    const intervalId = setInterval(() => {
        i++;
        setDisplayedText(prompt.slice(0, i + 1));
        
        if (i >= prompt.length) {
            clearInterval(intervalId);
            if(onGenerationComplete) onGenerationComplete();
        }
    }, speed);

    return () => clearInterval(intervalId);
  }, [prompt, onGenerationComplete]);


  const handleCopy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative sticky top-6">
      <div className="w-full bg-slate-800 rounded-t-xl flex items-center px-4 py-2 gap-2 border-b border-slate-700">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Terminal size={12} />
            <span>prompt_generator.exe</span>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-b-xl min-h-[400px] p-6 shadow-2xl relative overflow-hidden group border-x border-b border-slate-800">
        {prompt && (
             <button
                onClick={handleCopy}
                className="absolute top-4 right-4 z-10 p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-slate-700 flex items-center gap-2"
                title="Copy to clipboard"
            >
                {isCopied ? (
                    <>
                        <span className="text-emerald-400 font-bold text-xs">COPIED!</span>
                    </>
                ) : (
                    <>
                        <Copy className="w-4 h-4" />
                        <span className="text-xs font-medium">Copy</span>
                    </>
                )}
            </button>
        )}
       

        <div className="font-mono text-emerald-400 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            <span className="text-emerald-600 mr-2 select-none">$</span>
            {displayedText}
            <span className="animate-pulse inline-block w-2 h-4 bg-emerald-400 ml-1 align-middle"></span>
        </div>
        
        {!prompt && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-mono text-sm pointer-events-none select-none">
                Waiting for input...
            </div>
        )}
      </div>
    </div>
  );
}
