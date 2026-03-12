import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Bookmark, 
  Share2, 
  ChevronRight,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  initial: string;
  initialColor: string;
  tags: { label: string; type: 'remote' | 'contract' | 'fulltime' | 'level' | 'other' }[];
  salary: string;
  postedAt: string;
  applications: number;
  isUrgent: boolean;
  isVisited: boolean;
  description?: string;
  requirements?: string[];
}

interface PrimeJobDetailsProps {
  job: Job;
  onBack: () => void;
}

export default function PrimeJobDetails({ job, onBack }: PrimeJobDetailsProps) {
  const [activeTab, setActiveTab] = useState<'Description' | 'Company' | 'Review'>('Description');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-white font-sans pb-32"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center justify-between text-sm text-gray-500 mb-8">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${job.initialColor}`}>
              {job.initial}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">{job.title}</h1>
              <p className="text-gray-500 text-sm">{job.company} • {job.location}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-900 transition-colors">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {job.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium"
            >
              {tag.label}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 p-1 rounded-full flex mb-8">
          {['Description', 'Company', 'Review'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'Description' && (
            <motion.div
              key="Description"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About this role</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {job.description || "An Accountant plays a key role in managing and overseeing the financial activities of an organization. This includes preparing financial reports, maintaining accurate financial records, conducting audits..."}
                  <button className="text-blue-600 font-medium ml-1">Read more</button>
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Qualifications</h2>
                <ul className="space-y-4 text-sm text-gray-600 leading-relaxed list-disc pl-5">
                  {job.requirements ? job.requirements.map((req, i) => (
                    <li key={i} className="pl-1">{req}</li>
                  )) : (
                    <>
                      <li className="pl-1">Bachelor's degree in Accounting, Finance, or a related field.</li>
                      <li className="pl-1">Certification as a CPA (Certified Public Accountant) or equivalent is a plus. Strong understanding of accounting principles and financial reporting standards (GAAP/IFRS).</li>
                      <li className="pl-1">Proficient in accounting software (e.g., QuickBooks, SAP) and Microsoft Excel.</li>
                      <li className="pl-1">Excellent analytical and problem-solving skills.</li>
                      <li className="pl-1">Attention to detail and high level of accuracy in financial reporting.</li>
                      <li className="pl-1">Strong organizational and time management skills to meet deadlines.</li>
                    </>
                  )}
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === 'Company' && (
            <motion.div
              key="Company"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-600 text-sm leading-relaxed"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About {job.company}</h2>
              <p>
                We are a fast-growing company focused on delivering the best experience for our customers. 
                Our team is distributed across the globe, and we value autonomy, clear communication, and a strong work ethic.
              </p>
            </motion.div>
          )}

          {activeTab === 'Review' && (
            <motion.div
              key="Review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-gray-600 text-sm leading-relaxed"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-3">ENP Match Analysis</h2>
              <p className="mb-4">Based on your profile, here is how you match this role:</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Overall Match</span>
                  <span className="font-bold text-blue-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 sm:p-6 z-50">
        <div className="max-w-3xl mx-auto">
          <button className="w-full py-4 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-full font-semibold text-base transition-colors shadow-lg shadow-blue-500/30">
            Apply this job
          </button>
        </div>
      </div>
    </motion.div>
  );
}
