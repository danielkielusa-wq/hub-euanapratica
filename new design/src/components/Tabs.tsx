import * as React from "react"
import { cn } from "../lib/utils"
import { motion } from "motion/react"

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            activeTab === tab.id ? "text-slate-900" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] rounded-full",
                activeTab === tab.id ? "bg-slate-100 text-slate-900" : "bg-slate-200 text-slate-600"
              )}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
