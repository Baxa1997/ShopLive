'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Users, Package, TrendingUp } from 'lucide-react';

const STATS = [
  {
    label: 'Orders Completed',
    value: '300+',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100'
  },
  {
    label: 'Daily Clients',
    value: '100+',
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100'
  },
  {
    label: 'Products Added Daily',
    value: '200+',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100'
  },
  {
    label: 'Success Rate',
    value: '99.9%',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100'
  }
];

export default function ShopifyStats() {
  return (
    <section className="py-24 relative overflow-hidden bg-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight mb-4"
          >
            Empowering <span className="text-emerald-600">Shopify Merchants</span> Worldwide
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            LifeShop provides the intelligence and speed needed to scale your e-commerce operations instantly.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className={`p-8 rounded-[2rem] bg-white border ${stat.borderColor} shadow-xl shadow-slate-200/50 flex flex-col items-center text-center group transition-all duration-300`}
            >
              <div className={`p-4 rounded-2xl ${stat.bgColor} ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-heading font-black text-slate-900 mb-2 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-slate-500 font-medium tracking-wide text-sm uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
