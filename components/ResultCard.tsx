import React, { useState } from 'react';
import { ParsedResult } from '../types';
import { Copy, Check } from 'lucide-react';

interface ResultCardProps {
  result: ParsedResult;
  index: number;
  total: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index, total }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-3 sm:p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold px-2 py-1 rounded leading-tight">
              Ca {index + 1} <span className="font-normal opacity-80">(trong tổng {total} ca làm trong ngày)</span>
            </span>
          </div>
          <button 
            onClick={handleCopy}
            className="text-gray-400 hover:text-blue-600 transition-colors ml-2 flex-shrink-0"
            title="Sao chép kết quả"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>

        <div>
          <p className="text-sm sm:text-lg font-medium text-gray-900 break-words font-mono bg-gray-50 p-3 rounded border border-gray-100 leading-relaxed">
            {result.formatted}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;