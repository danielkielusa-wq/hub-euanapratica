import React, { useState } from 'react';
import { 
  Search, 
  Folder, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Star, 
  Download, 
  MoreVertical, 
  Lock, 
  ChevronRight, 
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Filter,
  File,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---

type ResourceType = 'pdf' | 'video' | 'link' | 'doc' | 'image';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  size?: string;
  date: string;
  isFavorite: boolean;
  tags: string[];
}

interface FolderData {
  id: string;
  name: string;
  isLocked?: boolean;
  subfolders?: FolderData[];
  resources: Resource[];
}

// --- Mock Data ---

const MOCK_DATA: FolderData[] = [
  {
    id: '1',
    name: '01 Diagnóstico e Planejamento',
    resources: [
      { id: 'r1', title: 'Template de Diagnóstico Inicial', description: 'Planilha para mapeamento de carreira.', type: 'doc', size: '2.4 MB', date: '22 Fev 2024', isFavorite: true, tags: ['Planejamento', 'Carreira'] },
      { id: 'r2', title: 'Aula 1: Visão Geral', description: 'Introdução ao método de aceleração.', type: 'video', size: '15 min', date: '20 Fev 2024', isFavorite: false, tags: ['Aula'] },
      { id: 'r3', title: 'Checklist de Competências', description: 'PDF interativo para auto-avaliação.', type: 'pdf', size: '1.1 MB', date: '18 Fev 2024', isFavorite: false, tags: ['Checklist'] },
    ]
  },
  {
    id: '2',
    name: '02 Currículo Internacional',
    isLocked: true,
    resources: []
  },
  {
    id: '3',
    name: '03 LinkedIn e Presença Digital',
    isLocked: true,
    resources: []
  },
  {
    id: '4',
    name: '04 Inglês Profissional',
    resources: [
      { id: 'r4', title: 'Glossário Tech Terms', description: 'Os 100 termos mais usados em entrevistas.', type: 'pdf', size: '3.5 MB', date: '15 Fev 2024', isFavorite: true, tags: ['Inglês', 'Vocabulário'] },
      { id: 'r5', title: 'Mock Interview: Behavioral Questions', description: 'Gravação de simulação de entrevista.', type: 'video', size: '45 min', date: '12 Fev 2024', isFavorite: true, tags: ['Entrevista'] },
      { id: 'r6', title: 'Ferramentas de Tradução', description: 'Lista de ferramentas recomendadas.', type: 'link', date: '10 Fev 2024', isFavorite: false, tags: ['Tools'] },
    ]
  },
  {
    id: '5',
    name: '05 Entrevistas',
    isLocked: true,
    resources: []
  },
  {
    id: '6',
    name: '06 Mercado de Trabalho',
    subfolders: [
      { 
        id: '6-1', 
        name: '01 Onde Buscar Vagas', 
        isLocked: true, 
        resources: [] 
      },
      { 
        id: '6-2', 
        name: '02 Networking Estratégico', 
        resources: [
          { id: 'r7', title: 'Scripts de Abordagem', description: 'Modelos de mensagem para LinkedIn.', type: 'doc', size: '500 KB', date: '05 Fev 2024', isFavorite: false, tags: ['Networking'] },
        ] 
      }
    ],
    resources: []
  },
  {
    id: '7',
    name: '07 Visto e Documentação',
    isLocked: true,
    resources: []
  }
];

// --- Components ---

const FileIcon = ({ type }: { type: ResourceType }) => {
  switch (type) {
    case 'pdf': return <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText className="w-5 h-5" /></div>;
    case 'doc': return <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><File className="w-5 h-5" /></div>;
    case 'video': return <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Video className="w-5 h-5" /></div>;
    case 'link': return <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><LinkIcon className="w-5 h-5" /></div>;
    case 'image': return <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><ImageIcon className="w-5 h-5" /></div>;
    default: return <div className="p-2 bg-gray-50 text-gray-600 rounded-lg"><File className="w-5 h-5" /></div>;
  }
};

const ResourceCard = ({ resource }: { resource: Resource }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    whileHover={{ y: -2, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group cursor-pointer flex flex-col h-full"
  >
    <div className="flex justify-between items-start mb-3">
      <FileIcon type={resource.type} />
      <button className={`text-gray-300 hover:text-amber-400 transition-colors ${resource.isFavorite ? 'text-amber-400' : ''}`}>
        <Star className="w-4 h-4 fill-current" />
      </button>
    </div>
    
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
        {resource.title}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
        {resource.description}
      </p>
    </div>

    <div className="flex flex-wrap gap-1 mb-4">
      {resource.tags.map(tag => (
        <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wide font-medium rounded-full">
          {tag}
        </span>
      ))}
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
      <div className="flex items-center text-xs text-gray-400 gap-2">
        {resource.size && <span>{resource.size}</span>}
        {resource.type === 'link' && <span>URL Externa</span>}
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>{resource.date}</span>
      </div>
      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
        <Download className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

const SidebarItem = ({ 
  folder, 
  isActive, 
  onClick, 
  depth = 0 
}: { 
  folder: FolderData, 
  isActive: boolean, 
  onClick: (folder: FolderData) => void,
  depth?: number
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (folder.isLocked) return;
    onClick(folder);
    if (hasSubfolders) setIsOpen(!isOpen);
  };

  return (
    <div className="mb-1">
      <div 
        onClick={handleClick}
        className={`
          flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
          ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}
          ${folder.isLocked ? 'opacity-60 cursor-not-allowed hover:bg-transparent' : ''}
        `}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {folder.isLocked ? (
            <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <Folder className={`w-4 h-4 flex-shrink-0 ${isActive ? 'fill-indigo-200 text-indigo-600' : 'fill-gray-100 text-gray-400 group-hover:text-gray-500'}`} />
          )}
          <span className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
            {folder.name}
          </span>
        </div>
        
        {hasSubfolders && !folder.isLocked && (
          <div className="text-gray-400">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && hasSubfolders && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {folder.subfolders?.map(sub => (
              <SidebarItem 
                key={sub.id} 
                folder={sub} 
                isActive={false} // Logic for active subfolder would go here in a real app
                onClick={onClick}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Biblioteca() {
  const [activeFolder, setActiveFolder] = useState<FolderData | null>(MOCK_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | ResourceType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter resources based on search and active filter
  const filteredResources = activeFolder?.resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'all' 
      ? true 
      : activeFilter === 'favorites' 
        ? resource.isFavorite 
        : resource.type === activeFilter;
    
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-2rem)] flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
              <Folder className="w-6 h-6 text-white fill-white/20" />
            </div>
            Biblioteca
          </h1>
          <p className="text-gray-500 mt-1 ml-14">Acesse templates, ebooks, links e materiais de apoio.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar materiais..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-3 h-3" />
              Pastas
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {MOCK_DATA.map(folder => (
              <SidebarItem 
                key={folder.id} 
                folder={folder} 
                isActive={activeFolder?.id === folder.id} 
                onClick={setActiveFolder} 
              />
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {activeFolder?.resources.length || 0}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Arquivos nesta pasta</p>
                <p className="text-[10px] text-gray-500">Atualizado hoje</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
          
          {/* Filters Toolbar */}
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Filter className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            {[
              { id: 'all', label: 'Todos' },
              { id: 'favorites', label: 'Favoritos', icon: Star },
              { id: 'doc', label: 'Documentos', icon: FileText },
              { id: 'video', label: 'Vídeos', icon: Video },
              { id: 'link', label: 'Links', icon: LinkIcon },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border
                  ${activeFilter === filter.id 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                `}
              >
                {filter.icon && <filter.icon className={`w-3 h-3 ${activeFilter === filter.id ? 'fill-current' : ''}`} />}
                {filter.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {!activeFolder ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Folder className="w-16 h-16 mb-4 text-gray-200" />
                <p className="text-lg font-medium text-gray-600">Selecione uma pasta</p>
                <p className="text-sm">Navegue pelas pastas à esquerda para ver os materiais.</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-600">Nenhum arquivo encontrado</p>
                <p className="text-sm">Tente mudar os filtros ou buscar por outro termo.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-baseline justify-between">
                  <h2 className="text-lg font-bold text-gray-800">{activeFolder.name}</h2>
                  <span className="text-xs text-gray-500">{filteredResources.length} itens</span>
                </div>
                
                <motion.div 
                  layout
                  className={`
                    ${viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4' 
                      : 'flex flex-col gap-3'}
                  `}
                >
                  <AnimatePresence>
                    {filteredResources.map(resource => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
