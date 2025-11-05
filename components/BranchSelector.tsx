import React from 'react';
import { Branch } from '../types';
import { branchTranslations } from '../constants';

interface BranchSelectorProps {
    selectedBranch: Branch;
    onSelectBranch: (branch: Branch) => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ selectedBranch, onSelectBranch }) => {
    return (
        <div>
            <label htmlFor="prompt-branch-selector" className="block text-sm font-medium text-slate-300 mb-2">
                 <i className="fa-solid fa-sitemap mr-2 text-indigo-400"></i>Chọn nhánh chủ đề chính:
            </label>
            <select 
                id="prompt-branch-selector" 
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={selectedBranch}
                onChange={(e) => onSelectBranch(e.target.value as Branch)}
            >
                {Object.entries(branchTranslations).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                ))}
            </select>
        </div>
    );
};

export default BranchSelector;
