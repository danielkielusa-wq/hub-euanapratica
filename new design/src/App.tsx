/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Agendamentos from './components/Agendamentos';
import Comunidade from './components/Comunidade';
import Explore from './components/Explore';
import Lives from './components/Lives';
import LiveDetails from './components/LiveDetails';
import MeusCursos from './components/MeusCursos';
import MinhaJornada from './components/MinhaJornada';
import ToolsAI from './components/ToolsAI';
import ResumePass from './components/ResumePass';
import TitleTranslator from './components/TitleTranslator';
import PrimeJobs from './components/PrimeJobs';
import Plans from './components/Plans';
import MyOrders from './components/MyOrders';
import MinhaAssinatura from './components/MinhaAssinatura';
import ContentStudio from './components/ContentStudio';
import PlanConfiguration from './components/PlanConfiguration';
import WeeklyPlanning from './components/WeeklyPlanning';
import AnalyticsGeral from './components/AnalyticsGeral';
import Biblioteca from './components/Biblioteca';
import Navbar from './components/Navbar';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('Meu Hub');

  const renderPage = () => {
    switch (currentPage) {
      case 'Meu Hub':
        return <Dashboard />;
      case 'Agenda Semanal':
        return <WeeklyPlanning />;
      case 'Analytics Geral':
        return <AnalyticsGeral />;
      case 'Biblioteca':
        return <Biblioteca />;
      case 'Agendamentos':
        return <Agendamentos />;
      case 'Comunidade':
        return <Comunidade />;
      case 'Explore':
        return <Explore />;
      case 'Lives':
        return <Lives onNavigate={setCurrentPage} />;
      case 'LiveDetails':
        return <LiveDetails onBack={() => setCurrentPage('Lives')} />;
      case 'Meus Cursos':
        return <MeusCursos />;
      case 'Minha Jornada':
        return <MinhaJornada />;
      case 'ResumePass':
        return <ResumePass />;
      case 'Title Translator':
        return <TitleTranslator />;
      case 'Prime Jobs':
        return <PrimeJobs />;
      case 'Content Studio':
        return <ContentStudio />;
      case 'Planos':
        return <Plans />;
      case 'Configurar Planos':
        return <PlanConfiguration />;
      case 'Meus Pedidos':
        return <MyOrders />;
      case 'Minha Assinatura':
        return <MinhaAssinatura />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f7fa] font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false); // Close sidebar on mobile after navigation
        }}
      />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen transition-all duration-300">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
