import React from 'react';
import { Search, Bell, Grid, Moon, Globe, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="h-[64px] px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-gray-400 bg-transparent hover:bg-gray-100 px-3 py-2 rounded-md transition-colors cursor-pointer w-64">
          <Search className="w-4 h-4" />
          <span className="text-sm">Search (Ctrl+/)</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton icon={Globe} />
        <IconButton icon={Moon} />
        <IconButton icon={Grid} />
        <div className="relative">
          <IconButton icon={Bell} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </div>
        
        <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-700">Daniel SAP</div>
            <div className="text-[11px] text-gray-500">Admin</div>
          </div>
          <div className="relative">
            <img 
              src="https://picsum.photos/seed/user/100/100" 
              alt="User" 
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function IconButton({ icon: Icon }: { icon: any }) {
  return (
    <button className="p-2 text-gray-500 hover:bg-gray-100 hover:text-[#7367F0] rounded-full transition-colors">
      <Icon className="w-5 h-5" />
    </button>
  );
}
