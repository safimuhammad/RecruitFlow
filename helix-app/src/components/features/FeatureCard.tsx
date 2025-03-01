import React from 'react';
import { FeatureCardProps } from '../../types';

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => (
  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-lg hover:shadow-xl 
                transform hover:-translate-y-1 transition-all duration-200 cursor-pointer
                hover:bg-gray-50 dark:hover:bg-gray-800">
    <div className={`w-10 h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <h3 className="font-medium text-gray-800 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
  </div>
);

export default FeatureCard; 