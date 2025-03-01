import React, { useState, useEffect } from 'react';
import { Building2, Tag, Plus } from 'lucide-react';
import { CompanyData } from '../../types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from './ui/alert-dialog';

const CompanyContextFeature = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    description: '',
    tags: []
  });
  const [newTag, setNewTag
    
  ] = useState('');
  
  useEffect(() => {
    const savedData = localStorage.getItem('companyContext');
    if (savedData) {
      setCompanyData(JSON.parse(savedData));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('companyContext', JSON.stringify(companyData));
    setIsOpen(false);
  };

  const addTag = () => {
    if (newTag.trim() && !companyData.tags.includes(newTag.trim())) {
      setCompanyData({
        ...companyData,
        tags: [...companyData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCompanyData({
      ...companyData,
      tags: companyData.tags.filter((tag: string) => tag !== tagToRemove)
    });
  };

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-lg cursor-pointer
                   hover:shadow-xl transition-all hover:-translate-y-1"
      >
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-medium text-gray-800 dark:text-white mb-1">Company Context</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {companyData.name ? `${companyData.name} - ${companyData.tags.length} tags defined` : 'Set your company context'}
        </p>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Company Context</AlertDialogTitle>
            <AlertDialogDescription>
              Define your company details to personalize recruitment sequences
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyData.name}
                onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600
                         text-gray-800 dark:text-gray-200"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={companyData.description}
                onChange={(e) => setCompanyData({...companyData, description: e.target.value})}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600
                         text-gray-800 dark:text-gray-200"
                rows={3}
                placeholder="Brief company description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Culture Tags
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {companyData.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm flex items-center gap-1
                             text-blue-800 dark:text-blue-200"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600
                           text-gray-800 dark:text-gray-200"
                  placeholder="Add culture tag"
                />
                <button
                  onClick={addTag}
                  className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 
                           dark:hover:bg-blue-900/50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </button>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompanyContextFeature;