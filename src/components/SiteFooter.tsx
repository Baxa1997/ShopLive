'use client';

import { Package, Mail, Phone, Share2, Twitter, Github } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] bg-teal-500/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white mb-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xl font-heading font-bold tracking-tight">ShopsReady</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Empowering your focus with intelligence. From processing complex data to business automation, we provide the tools you need to stay ahead.
            </p>
          </div>

          {/* Links Column */}
          <div className="space-y-4">
            <h3 className="text-white font-heading font-semibold text-lg">Platform</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">All Tools</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Updates</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-heading font-semibold text-lg">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <Mail className="w-4 h-4" />
                </div>
                <a href="mailto:bahridnurullav@gmail.com" className="hover:text-emerald-400 transition-colors">bahridnurullav@gmail.com</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
                <a href="tel:+16289002850" className="hover:text-emerald-400 transition-colors">+1 (628) 900-2850</a>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Follow our progress</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 ShopsReady. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
