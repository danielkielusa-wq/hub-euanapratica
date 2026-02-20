import React from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { Feed } from './components/Feed';
import { RightSidebar } from './components/RightSidebar';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-3">
            <LeftSidebar />
          </aside>

          {/* Main Feed */}
          <section className="col-span-1 md:col-span-6">
            <Feed />
          </section>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <RightSidebar />
          </aside>
        </div>
      </main>
    </div>
  );
}
