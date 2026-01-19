'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ArrowRight, ChevronRight, Facebook, Twitter, Instagram } from 'lucide-react';
import { ComponentOption } from '@/lib/ui-builder-config';
import { useState, useEffect } from 'react';

interface ComponentPreviewModalProps {
  component: ComponentOption | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (component: ComponentOption) => void;
}

export function ComponentPreviewModal({ component, isOpen, onClose, onConfirm }: ComponentPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !component) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col md:flex-row">
              
              <div className="w-full md:w-2/3 bg-slate-100 p-8 flex flex-col justify-center relative min-h-[400px]">
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border border-slate-300/50">
                    Live Preview
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative w-full">
                   {component.id === 'modal' && <ModalPreview />}
                   {component.id === 'navbar' && <NavbarPreview />}
                   {component.id === 'hero' && <HeroPreview />}
                   {component.id === 'cascading-menu' && <CascadingMenuPreview />}
                   {component.id === 'menu' && <SimpleMenuPreview />}
                   {component.id === 'footer' && <FooterPreview />}
                </div>
              </div>

              <div className="w-full md:w-1/3 p-8 flex flex-col bg-white border-l border-slate-100">
                 <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        {(() => {
                            const Icon = component.icon;
                            return <Icon className="w-8 h-8 text-emerald-600" />;
                        })()}
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                 </div>

                 <h3 className="text-2xl font-bold text-slate-900 mb-2">{component.label}</h3>
                 <p className="text-slate-500 mb-8 leading-relaxed">
                    Instantly generate a production-ready {component.label.toLowerCase()} component. Customized with your specific preferences for layout, style, and behavior.
                 </p>

                 <div className="space-y-4 mb-8">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Available Features</h4>
                    <ul className="space-y-3">
                        {component.features.map(feature => (
                            <li key={feature.id} className="flex items-center gap-3 text-slate-600 text-sm">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span>{feature.label}</span>
                            </li>
                        ))}
                    </ul>
                 </div>

                 <div className="mt-auto">
                    <button 
                        onClick={() => onConfirm(component)}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group transition-all"
                    >
                         Use This Component <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Preview Subcomponents ---

function ModalPreview() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsOpen(prev => !prev);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-64 bg-slate-50 relative flex items-center justify-center p-4">
            <button 
                onClick={() => setIsOpen(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
                Open Modal
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 p-4"
                    >
                         <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
                             <h4 className="text-lg font-bold mb-2">Example Modal</h4>
                             <p className="text-slate-600 text-sm mb-4">This modal opens and closes automatically for demonstration.</p>
                             <div className="flex justify-end gap-2">
                                 <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                                 <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm">Confirm</button>
                             </div>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function NavbarPreview() {
    return (
        <div className="h-64 bg-slate-50 relative overflow-hidden flex flex-col">
            <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center shadow-sm">
                <div className="font-bold text-slate-800">Logo</div>
                <div className="flex gap-4 text-sm text-slate-500">
                    <span className="hover:text-emerald-500 cursor-pointer">Features</span>
                    <span className="hover:text-emerald-500 cursor-pointer">Pricing</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200" />
            </div>
            <div className="p-8 space-y-4">
                <div className="h-32 bg-slate-200/50 rounded-xl" />
                <div className="h-32 bg-slate-200/50 rounded-xl" />
            </div>
        </div>
    );
}

function HeroPreview() {
    return (
         <div className="h-64 bg-gradient-to-br from-slate-900 to-slate-800 relative flex items-center justify-center text-center p-8">
            <div className="relative z-10 w-full">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 block animate-pulse">New Feature</span>
                <h3 className="text-2xl font-bold text-white mb-2">Build Faster</h3>
                <p className="text-slate-400 text-sm mb-4 max-w-[200px] mx-auto">Create stunning interfaces with our automated tools.</p>
                <div className="flex gap-2 justify-center">
                    <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20">Get Started</button>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold">Learn More</button>
                </div>
            </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px]" />
        </div>
    );
}

function CascadingMenuPreview() {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setActive(prev => !prev);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-64 bg-slate-50 flex items-start justify-center p-8">
            <div className="relative">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium flex items-center gap-2 hover:bg-slate-50 text-slate-700">
                    Services <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {active && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20"
                        >
                            <div className="p-1">
                                {['Web Design', 'Development', 'Marketing', 'SEO'].map(item => (
                                    <div key={item} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-lg cursor-pointer flex justify-between items-center group">
                                        {item}
                                        {item === 'Development' && <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500" />}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function SimpleMenuPreview() {
    return (
        <div className="h-64 bg-white flex items-center justify-center p-8">
            <nav className="flex gap-6 items-center bg-slate-50 px-8 py-4 rounded-full border border-slate-200 shadow-sm">
                {['Home', 'About', 'Contact'].map((item, i) => (
                    <div key={item} className={`text-sm font-medium cursor-pointer relative ${i === 0 ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}>
                        {item}
                        {i === 0 && (
                            <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500" />
                        )}
                    </div>
                ))}
            </nav>
        </div>
    )
}

function FooterPreview() {
    return (
        <div className="h-64 bg-slate-50 flex flex-col justify-end">
            <div className="bg-slate-900 text-slate-300 p-6 pt-8">
                <div className="grid grid-cols-3 gap-8 mb-8">
                    <div>
                        <div className="font-bold text-white mb-4">Company</div>
                        <div className="space-y-2 text-xs">
                            <div className="w-16 h-2 bg-slate-800 rounded" />
                            <div className="w-20 h-2 bg-slate-800 rounded" />
                            <div className="w-12 h-2 bg-slate-800 rounded" />
                        </div>
                    </div>
                     <div>
                        <div className="font-bold text-white mb-4">Resources</div>
                        <div className="space-y-2 text-xs">
                            <div className="w-24 h-2 bg-slate-800 rounded" />
                            <div className="w-16 h-2 bg-slate-800 rounded" />
                        </div>
                    </div>
                     <div>
                        <div className="font-bold text-white mb-4">Follow Us</div>
                        <div className="flex gap-3">
                             <Facebook className="w-4 h-4" />
                             <Twitter className="w-4 h-4" />
                             <Instagram className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-xs text-slate-500">
                    <span>© 2024 Inc.</span>
                    <div className="w-24 h-2 bg-slate-800 rounded" />
                </div>
            </div>
        </div>
    )
}
