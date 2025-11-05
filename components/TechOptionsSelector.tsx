import React from 'react';
import { TechOptions } from '../types';
import { techOptionsData, techOptionLabels, techOptionsTranslations } from '../constants';

interface TechOptionsSelectorProps {
    techOptions: TechOptions;
    setTechOptions: (options: TechOptions) => void;
}

const TechOptionsSelector: React.FC<TechOptionsSelectorProps> = ({ techOptions, setTechOptions }) => {
    
    const handleOptionChange = (category: keyof TechOptions, value: string) => {
        setTechOptions({
            ...techOptions,
            [category]: value === "Mặc định" ? undefined : value,
        });
    };

    return (
        <div>
            <h3 className="text-base font-semibold text-slate-200 mb-4 border-t border-slate-700 pt-4">
                <i className="fa-solid fa-sliders mr-2 text-indigo-400"></i>Tùy chọn Kỹ thuật (tùy chọn)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(techOptionsData).map(([key, options]) => (
                    <div key={key}>
                        <label htmlFor={`${key}-selector`} className="block text-sm font-medium text-slate-400 mb-1">
                            {techOptionLabels[key as keyof TechOptions]}
                        </label>
                        <select
                            id={`${key}-selector`}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            value={techOptions[key as keyof TechOptions] || 'Mặc định'}
                            onChange={(e) => handleOptionChange(key as keyof TechOptions, e.target.value)}
                        >
                            {options.map(option => (
                                <option key={option} value={option}>{techOptionsTranslations[option] || option}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TechOptionsSelector;
