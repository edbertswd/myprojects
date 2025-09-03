import { useAtom } from 'jotai';
import { pageAtom, pages } from './UI';

export const BookUI = () => {
  const [page, setPage] = useAtom(pageAtom);

  const nextPage = () => {
    if (page < pages.length) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
        <button
          onClick={prevPage}
          disabled={page === 0}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex space-x-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setPage(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === page 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/40 hover:bg-white/60'
              } ${index === 0 ? 'border border-yellow-300' : ''}`}
              title={index === 0 ? 'Cover' : `Page ${index}`}
            />
          ))}
        </div>

        <button
          onClick={nextPage}
          disabled={page >= pages.length}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-white/70 text-sm">
          {page === 0 ? 'Cover' : `Page ${page}`} of {pages.length}
        </p>
        <p className="text-white/50 text-xs mt-1">
          Click on the book to turn pages or use controls below
        </p>
      </div>
    </div>
  );
};