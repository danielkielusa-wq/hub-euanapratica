import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Award, 
  Rocket, 
  FileText, 
  Globe, 
  GraduationCap, 
  MoreVertical, 
  Search,
  Copy, 
  Check,
  Plus,
  LayoutGrid,
  List as ListIcon,
  CreditCard,
  Hash
} from 'lucide-react';
import { mockProducts } from './data';
import { Product, ProductModality } from './types';
import { Badge } from './components/Badge';
import { Tabs } from './components/Tabs';
import { Switch } from './components/Switch';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const ProductIcon = ({ icon, className }: { icon?: string, className?: string }) => {
  const Icon = useMemo(() => {
    switch (icon) {
      case 'briefcase': return Briefcase;
      case 'ribbon': return Award;
      case 'rocket': return Rocket;
      case 'file-text': return FileText;
      case 'globe': return Globe;
      case 'graduation-cap': return GraduationCap;
      default: return Briefcase;
    }
  }, [icon]);

  return <Icon className={className} />;
};

const CopyButton = ({ text, label }: { text: string, label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-xs text-slate-500"
      title={`Copy ${label}: ${text}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />}
      <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' 
        ? true 
        : activeTab === 'visible' 
          ? product.status === 'visible'
          : product.status === 'hidden';
      
      return matchesSearch && matchesTab;
    });
  }, [products, searchQuery, activeTab]);

  const stats = useMemo(() => ({
    all: products.length,
    visible: products.filter(p => p.status === 'visible').length,
    hidden: products.filter(p => p.status === 'hidden').length
  }), [products]);

  const toggleStatus = (id: string) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, status: p.status === 'visible' ? 'hidden' : 'visible' } : p
    ));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">HubManager</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">System Operational</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Products & Services</h1>
            <p className="text-slate-500 max-w-2xl text-base leading-relaxed">
              Manage your product catalog, pricing strategies, and visibility across the platform.
            </p>
          </div>
          <button className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 ring-offset-2 focus:ring-2 focus:ring-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            New Product
          </button>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Tabs 
            activeTab={activeTab} 
            onChange={setActiveTab}
            tabs={[
              { id: 'all', label: 'All Products', count: stats.all },
              { id: 'visible', label: 'Active', count: stats.visible },
              { id: 'hidden', label: 'Archived', count: stats.hidden },
            ]} 
          />

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'list' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === 'grid' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        <motion.div 
          layout 
          className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "group bg-white border border-slate-200 hover:border-blue-300/50 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden",
                  viewMode === 'list' ? "p-4 flex flex-col sm:flex-row items-center gap-6" : "p-6 flex flex-col gap-6"
                )}
              >
                {/* Icon & Identity */}
                <div className={cn("flex items-center gap-4", viewMode === 'list' ? "flex-1 min-w-[240px]" : "w-full")}>
                  <div className={cn(
                    "relative flex-shrink-0 flex items-center justify-center rounded-2xl transition-colors",
                    viewMode === 'list' ? "w-12 h-12" : "w-14 h-14",
                    product.status === 'visible' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <ProductIcon icon={product.icon} className={viewMode === 'list' ? "w-6 h-6" : "w-7 h-7"} />
                    {product.status === 'visible' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn("font-bold text-slate-900 truncate", product.status === 'hidden' && "text-slate-500")}>
                        {product.name}
                      </h3>
                      {product.badges?.map(badge => (
                        <Badge key={badge} variant={badge === 'POPULAR' ? 'purple' : 'blue'} size="sm" className="hidden sm:inline-flex">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-medium">{product.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="capitalize">{product.modality.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Meta Data (Price & IDs) */}
                <div className={cn(
                  "flex items-center gap-6", 
                  viewMode === 'list' ? "flex-[2] justify-center sm:justify-start" : "w-full justify-between border-t border-slate-100 pt-4"
                )}>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Price</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div className="flex flex-col gap-2">
                    <CopyButton text={product.stripeId} label="Stripe" />
                    {product.tictoId && <CopyButton text={product.tictoId} label="Ticto" />}
                  </div>
                </div>

                {/* Actions */}
                <div className={cn(
                  "flex items-center gap-4",
                  viewMode === 'list' ? "w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0" : "w-full justify-between items-center"
                )}>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-medium transition-colors", product.status === 'visible' ? "text-blue-600" : "text-slate-400")}>
                      {product.status === 'visible' ? 'Active' : 'Hidden'}
                    </span>
                    <Switch checked={product.status === 'visible'} onCheckedChange={() => toggleStatus(product.id)} />
                  </div>
                  
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No products found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

      </main>
    </div>
  );
}
