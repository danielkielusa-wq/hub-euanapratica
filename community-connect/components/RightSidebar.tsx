import React from 'react';
import { 
  User, 
  RefreshCw, 
  Settings, 
  HelpCircle, 
  MessageSquare, 
  Twitter, 
  Apple, 
  Github,
  LogOut
} from 'lucide-react';

export const RightSidebar = () => {
  return (
    <div className="card p-6 space-y-8">
      {/* Top Helpers */}
      <div>
        <h3 className="text-sm font-bold mb-6">Top Helpers</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <img 
                src="https://picsum.photos/seed/helper1/100/100" 
                alt="Helper" 
                className="w-10 h-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-bold group-hover:text-blue-600 transition-colors">Aluno Kiel</p>
                <p className="text-[10px] text-gray-400 font-bold">125 XP</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-blue-600 text-white text-[10px] font-bold rounded-md flex items-center justify-center">MS</div>
          </div>

          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://picsum.photos/seed/helper2/100/100" 
                  alt="Helper" 
                  className="w-10 h-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">2</span>
              </div>
              <div>
                <p className="text-sm font-bold group-hover:text-blue-600 transition-colors">Mario Silva</p>
                <p className="text-[10px] text-gray-400 font-bold">60 XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-gray-100" />

      {/* Your Company */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Your Company</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Twitter className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold">Twitter</p>
              <p className="text-[10px] text-gray-400">Lorem ipsum dolor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Apple className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold">Apple</p>
              <p className="text-[10px] text-gray-400">Lorem ipsum dolor</p>
            </div>
          </div>
          <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
        </div>
      </div>

      {/* Your Projects */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Your Projects</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C2410C] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold">Twitter</p>
              <p className="text-[10px] text-gray-400">Lorem ipsum dolor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C2410C] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold">Twitter</p>
              <p className="text-[10px] text-gray-400">Lorem ipsum dolor</p>
            </div>
          </div>
          <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
        </div>
      </div>

      <div className="h-[1px] bg-gray-100" />

      {/* Sign Out */}
      <button className="flex items-center gap-4 w-full text-gray-700 hover:text-red-500 transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-bold">Sign Out</span>
      </button>
    </div>
  );
};
