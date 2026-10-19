import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

const NoResultsFound = ({ message = 'No results match your search filters.', onReset }) => {
  return (
    <div className="py-16 px-6 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm max-w-xl mx-auto my-8">
      <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-1">No Results Found</h3>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        {message} Try adjusting your destination keyword, expanding your budget range, or clearing filters.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
        </button>
      )}
    </div>
  );
};

export default NoResultsFound;
