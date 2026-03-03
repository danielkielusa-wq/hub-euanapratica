import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Search, 
  Radio, 
  PlaySquare, 
  LayoutGrid, 
  ChevronRight,
  Circle,
  X
} from 'lucide-react';
import { SIDEBAR_ITEMS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ isOpen, onClose, currentPage, onNavigate }: SidebarProps) {
  return (
    <div className={`
      w-[260px] h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo Area */}
      <div className="h-[64px] flex items-center px-6 gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7367F0] rounded flex items-center justify-center text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-xl text-[#5d596c] tracking-tight">Vuexy</span>
        </div>
        
        {/* Mobile Close Button */}
        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <div className="ml-auto hidden lg:block">
          <Circle className="w-4 h-4 text-[#7367F0] fill-[#7367F0] opacity-20" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {SIDEBAR_ITEMS.map((section, idx) => (
          <div key={idx} className="mb-2">
            {section.category && (
              <div className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {section.category}
              </div>
            )}
            
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = currentPage === item.label;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => onNavigate(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-[15px] font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#7367F0] to-[#9e95f5] text-white shadow-md shadow-indigo-200' 
                        : 'text-[#5d596c] hover:bg-[#f3f3f4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-[#5d596c]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {!item.badge && (
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
