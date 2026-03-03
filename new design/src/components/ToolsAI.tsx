import React from 'react';
import { Wrench, FileText, Languages, Briefcase } from 'lucide-react';

interface ToolsAIProps {
  toolName: string;
}

export default function ToolsAI({ toolName }: ToolsAIProps) {
  const getIcon = () => {
    switch (toolName) {
      case 'ResumePass':
        return <FileText className="w-12 h-12 text-indigo-600" />;
      case 'Title Translator':
        return <Languages className="w-12 h-12 text-indigo-600" />;
      case 'Prime Jobs':
        return <Briefcase className="w-12 h-12 text-indigo-600" />;
      default:
        return <Wrench className="w-12 h-12 text-indigo-600" />;
    }
  };

  const getDescription = () => {
    switch (toolName) {
      case 'ResumePass':
        return 'Optimize your resume for ATS systems and get more interviews.';
      case 'Title Translator':
        return 'Translate your job titles to the US market equivalents.';
      case 'Prime Jobs':
        return 'Find the best job opportunities tailored to your profile.';
      default:
        return 'This tool is under development.';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-indigo-50 p-6 rounded-full mb-6 animate-bounce">
        {getIcon()}
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{toolName}</h1>
      <p className="text-gray-500 max-w-md text-lg mb-8">
        {getDescription()}
      </p>
      <button className="bg-[#7367F0] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200">
        Launch Tool
      </button>
    </div>
  );
}
