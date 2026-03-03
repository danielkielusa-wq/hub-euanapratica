import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Calendar, 
  Video, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  ChevronRight,
  Receipt,
  ShoppingBag,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type OrderStatus = 'Pago' | 'Pendente' | 'Cancelado' | 'Reembolsado';
type OrderType = 'Mentoria' | 'Curso' | 'Consultoria' | 'Ebook';

interface Order {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: OrderType;
  orderId: string;
  status: OrderStatus;
  paymentMethod: string;
  invoiceUrl?: string;
  actionUrl?: string;
}

// --- Mock Data ---

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    title: 'Mentoria em Grupo ROTA EUA™ - Turma Abril',
    date: '2026-02-26T11:01:00',
    amount: 1947.00,
    type: 'Mentoria',
    orderId: 'ORD-772121707325',
    status: 'Pago',
    paymentMethod: 'Cartão de Crédito (**** 4242)',
    invoiceUrl: '#',
    actionUrl: '#'
  },
  {
    id: '2',
    title: 'Sessão Estratégica ROTA EUA – 60 min',
    date: '2026-02-26T10:27:00',
    amount: 579.00,
    type: 'Consultoria',
    orderId: 'ORD-772119653251',
    status: 'Pago',
    paymentMethod: 'PIX',
    invoiceUrl: '#',
    actionUrl: '#'
  },
  {
    id: '3',
    title: 'Curso Completo de Inglês para Negócios',
    date: '2026-02-25T14:47:00',
    amount: 297.00,
    type: 'Curso',
    orderId: 'ORD-772048829102',
    status: 'Pendente',
    paymentMethod: 'Boleto',
    invoiceUrl: '#'
  },
  {
    id: '4',
    title: 'Ebook: Guia Definitivo do Visto EB-2 NIW',
    date: '2026-01-15T09:30:00',
    amount: 47.90,
    type: 'Ebook',
    orderId: 'ORD-771029384756',
    status: 'Pago',
    paymentMethod: 'Cartão de Crédito (**** 1234)',
    invoiceUrl: '#',
    actionUrl: '#'
  },
  {
    id: '5',
    title: 'Consultoria de Carreira Internacional',
    date: '2025-12-10T16:20:00',
    amount: 890.00,
    type: 'Consultoria',
    orderId: 'ORD-769823746510',
    status: 'Cancelado',
    paymentMethod: 'Cartão de Crédito',
  }
];

// --- Components ---

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const styles = {
    'Pago': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Pendente': 'bg-amber-100 text-amber-700 border-amber-200',
    'Cancelado': 'bg-red-100 text-red-700 border-red-200',
    'Reembolsado': 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const icons = {
    'Pago': CheckCircle,
    'Pendente': Clock,
    'Cancelado': XCircle,
    'Reembolsado': FileText,
  };

  const Icon = icons[status];

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
      styles[status]
    )}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </div>
  );
};

const TypeIcon = ({ type }: { type: OrderType }) => {
  const styles = {
    'Mentoria': 'bg-purple-100 text-purple-600',
    'Curso': 'bg-blue-100 text-blue-600',
    'Consultoria': 'bg-emerald-100 text-emerald-600',
    'Ebook': 'bg-orange-100 text-orange-600',
  };

  const icons = {
    'Mentoria': ShoppingBag,
    'Curso': Video,
    'Consultoria': Calendar,
    'Ebook': FileText,
  };

  const Icon = icons[type];

  return (
    <div className={cn("p-3 rounded-xl flex items-center justify-center", styles[type])}>
      <Icon className="w-6 h-6" />
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend?: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {trend && <p className="text-xs text-emerald-600 mt-1 font-medium">{trend}</p>}
    </div>
    <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

// --- Main Page Component ---

export default function MyOrders() {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredOrders = MOCK_ORDERS.filter(order => {
    const matchesStatus = filterStatus === 'Todos' || order.status === filterStatus;
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats Calculation
  const totalSpent = MOCK_ORDERS
    .filter(o => o.status === 'Pago')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const activeOrders = MOCK_ORDERS.filter(o => o.status === 'Pago' || o.status === 'Pendente').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meus Pedidos</h1>
            <p className="text-gray-500 mt-1">Gerencie suas compras e histórico de pagamentos</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            label="Total Investido" 
            value={formatCurrency(totalSpent)} 
            icon={Receipt} 
            trend="+12% este mês"
          />
          <StatCard 
            label="Pedidos Realizados" 
            value={MOCK_ORDERS.length.toString()} 
            icon={ShoppingBag} 
          />
          <StatCard 
            label="Serviços Ativos" 
            value={activeOrders.toString()} 
            icon={CheckCircle} 
          />
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100/80 rounded-xl w-full md:w-auto overflow-x-auto">
            {(['Todos', 'Pago', 'Pendente', 'Cancelado'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  filterStatus === tab 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all p-5 flex flex-col md:flex-row gap-6 items-start md:items-center"
                >
                  {/* Icon & Main Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <TypeIcon type={order.type} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {order.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(order.date)}
                        </span>
                        <span className="text-gray-300 hidden md:inline">|</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          #{order.orderId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 md:gap-1 w-full md:w-auto pl-16 md:pl-0">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(order.amount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 hidden md:inline">{order.paymentMethod}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Actions Divider (Mobile) */}
                  <div className="w-full h-px bg-gray-100 md:hidden" />

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 w-full md:w-auto pl-16 md:pl-0">
                    {order.invoiceUrl && (
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Baixar Nota Fiscal"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    )}
                    
                    {order.status === 'Pago' && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95 whitespace-nowrap">
                        Acessar
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    
                    {order.status === 'Pendente' && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95 whitespace-nowrap">
                        Pagar Agora
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    <button className="md:hidden p-2 text-gray-400">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
              >
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Nenhum pedido encontrado</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
                <button 
                  onClick={() => { setFilterStatus('Todos'); setSearchQuery(''); }}
                  className="mt-6 text-blue-600 font-medium hover:underline"
                >
                  Limpar filtros
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
