import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar, ClipboardList, LayoutGrid, Compass, Users, BookOpen, ShoppingBag, User, LifeBuoy, FileSearch, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useHubServices } from '@/hooks/useHubServices';

interface SearchResult {
  id: string;
  label: string;
  category: 'pages' | 'espacos' | 'agenda' | 'tarefas' | 'servicos' | 'comunidade';
  href: string;
  icon: React.ElementType;
  external?: boolean;
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
  comunidade: 'Comunidade',
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
  const { data: services } = useHubServices();

  // Filter results based on query
  useEffect(() => {
    let isCancelled = false;
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setSelectedIndex(0);
      return () => undefined;
    }

    const timeout = setTimeout(async () => {
      const normalizedQuery = trimmedQuery.toLowerCase();
      const staticMatches = staticPages.filter(page =>
        page.label.toLowerCase().includes(normalizedQuery)
      );

      const serviceMatches = (services || [])
        .filter(service => {
          if (service.status === 'coming_soon') return false;
          const nameMatch = service.name.toLowerCase().includes(normalizedQuery);
          const descriptionMatch = service.description?.toLowerCase().includes(normalizedQuery);
          const categoryMatch = service.category?.toLowerCase().includes(normalizedQuery);
          return nameMatch || descriptionMatch || categoryMatch;
        })
        .map(service => {
          const href = service.route || service.redirect_url || service.ticto_checkout_url || '/dashboard/hub';
          const external = Boolean(service.redirect_url || service.ticto_checkout_url);
          return {
            id: `service-${service.id}`,
            label: service.name,
            category: 'servicos' as const,
            href,
            icon: ShoppingBag,
            external,
          };
        });

      let communityMatches: SearchResult[] = [];
      if (user && trimmedQuery.length >= 2) {
        const { data, error } = await supabase
          .from('community_posts')
          .select('id, title')
          .or(`title.ilike.%${trimmedQuery}%,content.ilike.%${trimmedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          communityMatches = data.map(post => ({
            id: `community-${post.id}`,
            label: post.title,
            category: 'comunidade',
            href: `/comunidade/${post.id}`,
            icon: MessageSquare,
          }));
        }
      }

      if (isCancelled) return;
      setResults([...staticMatches, ...serviceMatches, ...communityMatches]);
      setSelectedIndex(0);
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [query, services, user]);

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
        if (selected.external && selected.href.startsWith('http')) {
          window.open(selected.href, '_blank');
        } else {
          navigate(selected.href);
        }
        setQuery('');
        setIsOpen(false);
        onNavigate?.();
      }
    }
  }, [results, selectedIndex, navigate, onNavigate]);

  const handleResultClick = (result: SearchResult) => {
    if (result.external && result.href.startsWith('http')) {
      window.open(result.href, '_blank');
    } else {
      navigate(result.href);
    }
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
          <span className="text-[10px] font-medium text-gray-500">Ctrl</span>
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
