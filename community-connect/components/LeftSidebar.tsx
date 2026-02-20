import React from 'react';
import { Settings, Twitter, Github, Apple } from 'lucide-react';

export const LeftSidebar = () => {
  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card p-6 text-center relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <Settings className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <img 
            src="https://picsum.photos/seed/user1/200/200" 
            alt="Avatar" 
            className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow-sm"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-lg font-bold">Erşad Başbağ</h2>
          <p className="text-xs font-medium text-blue-600 mb-4">Nivel 1 • Iniciante</p>
          
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>XP Atual</span>
              <span>60 / 100</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[60%]" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Faltam 40 XP para o Nivel 2</p>
          </div>
        </div>
      </div>

      {/* Canais */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canais</h3>
        </div>
        <div className="space-y-4">
          {[
            "Todas as Discussoes",
            "Vistos & Imigração",
            "Carreira & Jobs",
            "Networking",
            "Vida nos EUA"
          ].map((item) => (
            <div key={item} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
                <p className="text-sm font-bold group-hover:text-blue-600 transition-colors">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 text-[10px] text-gray-400 space-y-1">
        <div className="flex gap-2">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Advertising</a>
          <a href="#" className="hover:underline">Cookies</a>
        </div>
        <p>Talentswide © 2021</p>
      </div>
    </div>
  );
};
