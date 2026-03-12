/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";

export default function App() {
  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Dashboard />
          </div>
        </main>
      </div>
    </div>
  );
}
