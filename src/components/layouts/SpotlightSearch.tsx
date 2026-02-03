import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar, ClipboardList, LayoutGrid, Compass, Users, BookOpen, ShoppingBag, User, LifeBuoy, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: string;
  label: string;
  category: 'pages' | 'espacos' | 'agenda' | 'tarefas' | 'servicos';
  href: string;
  icon: React.ElementType;
}

// Static pages for search
const staticPages: SearchResult[] = [
  { id: 'inicio', label: 'Início', category: 'pages', href: '/dashboard/hub', icon: Compass },
  { id: 'comunidade', label: 'Comunidade', category: 'pages', href: '/comunidade', icon: Users },
  { id: 'agenda', label: 'Agenda', category: 'pages', href: '/dashboard/agenda', icon: Calendar },
  { id: 'catalogo', label: 'Catálogo', category: 'pages', href: '/dashboard/hub', icon: Search },
  { id: 'espacos', label: 'Meus Espaços', category: 'pages', href: '/dashboard/espacos', icon: LayoutGrid },
  { id: 'dashboard', label: 'Dashboard', category: 'pages', href: '/dashboard', icon: FileText },
  { id: 'biblioteca', label: 'Biblioteca', category: 'pages', href: '/biblioteca', icon: BookOpen },
  { id: 'tarefas', label: 'Tarefas', category: 'pages', href: '/dashboard/tarefas', icon: ClipboardList },
  { id: 'resumepass', label: 'ResumePass AI', category: 'servicos', href: '/curriculo', icon: FileSearch },
  { id: 'perfil', label: 'Perfil', category: 'pages', href: '/perfil', icon: User },
  { id: 'pedidos', label: 'Meus Pedidos', category: 'pages', href: '/meus-pedidos', icon: ShoppingBag },
  { id: 'suporte', label: 'Suporte', category: 'pages', href: '/dashboard/suporte', icon: LifeBuoy },
];

const categoryLabels: Record<string, string> = {
  pages: 'Páginas',
  espacos: 'Espaços',
  agenda: 'Agenda',
  tarefas: 'Tarefas',
  servicos: 'Serviços',
};

interface SpotlightSearchProps {
  onNavigate?: () => void;
}

export function SpotlightSearch({ onNavigate }: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const filtered = staticPages.filter(page =>
      page.label.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle navigation with keyboard
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        navigate(selected.href);
        setQuery('');
        setIsOpen(false);
        onNavigate?.();
      }
    }
  }, [results, selectedIndex, navigate, onNavigate]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href);
    setQuery('');
    setIsOpen(false);
    onNavigate?.();
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="relative px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Busca rápida..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyNavigation}
          className="w-full pl-10 pr-16 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-200 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 bg-gray-100 rounded-md">
          <span className="text-[10px] font-medium text-gray-500">⌘</span>
          <span className="text-[10px] font-medium text-gray-500">K</span>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50 max-h-[300px] overflow-y-auto">
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                {categoryLabels[category]}
              </div>
              {items.map((result, idx) => {
                const globalIdx = results.indexOf(result);
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors",
                      globalIdx === selectedIndex
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{result.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
