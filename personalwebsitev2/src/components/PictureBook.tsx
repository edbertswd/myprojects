import { useState } from 'react';
import rapunzelCastle from '@/assets/rapunzel-castle.png';

const PictureBook = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const pages = [
    // Cover page
    {
      type: 'cover',
      image: rapunzelCastle,
      title: "Alyssa's Fairy Tale",
      subtitle: "A Magical Story from Jakarta",
      text: "",
      quote: ""
    },
    // Story pages
    {
      type: 'story',
      image: rapunzelCastle,
      title: "Alyssa's Tale",
      text: "Once upon a time, in a kingdom far, far away, there lived a beautiful princess in all of Jakarta. Her name, is Alyssa. She had a heart full of love and a spirit as bright as the city lights.",
      quote: "\"In the heart of Jakarta...\""
    },
    {
      type: 'story',
      image: rapunzelCastle,
      title: "The Prince's Call",
      text: "Suddenly, a prince called her and said 'Punyukunyungkunyung...' His voice echoed through the magical towers of the city, carried by the evening breeze and the glow of a thousand lanterns.",
      quote: "\"Punyukunyungkunyung...\""
    },
    {
      type: 'story',
      image: rapunzelCastle,
      title: "A Love Story",
      text: "Their hearts connected across the bustling streets of Jakarta, where modern towers met ancient magic. The floating lanterns danced around them, celebrating their destined meeting under the twilight sky.",
      quote: "\"Hearts connected across the city...\""
    },
    {
      type: 'story',
      image: rapunzelCastle,
      title: "Magical Moments",
      text: "Together they explored the enchanted gardens hidden within the urban landscape. Every step they took was accompanied by glowing lanterns that seemed to understand the language of their love.",
      quote: "\"Love speaks in lantern light...\""
    },
    {
      type: 'story',
      image: rapunzelCastle,
      title: "Happily Ever After",
      text: "And so they lived happily ever after, their love illuminating Jakarta like the most beautiful constellation of floating lanterns, bringing magic to everyone who believed in fairy tales.",
      quote: "\"And they lived happily ever after...\""
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsAnimating(false);
      }, 400);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsAnimating(false);
      }, 400);
    }
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex !== currentPage && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(pageIndex);
        setIsAnimating(false);
      }, 400);
    }
  };

  const renderCoverPage = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br from-purple-800 via-blue-800 to-indigo-900 rounded-lg">
      <div className="relative mb-8">
        <img
          src={pages[0].image}
          alt="Book cover"
          className="w-48 h-48 object-cover rounded-full border-4 border-white/30 shadow-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-full" />
      </div>
      
      <h1 className="princess-title text-5xl mb-4 text-white drop-shadow-2xl">
        {pages[0].title}
      </h1>
      
      <p className="fairy-script text-3xl text-white/90 drop-shadow-lg">
        {pages[0].subtitle}
      </p>
      
      <div className="mt-12 text-center">
        <p className="text-white/70 text-lg italic">Click to open the book...</p>
      </div>
    </div>
  );

  const renderStoryPage = () => {
    const page = pages[currentPage];
    
    return (
      <div className="flex w-full h-full bg-gradient-to-br from-amber-50 to-purple-50">
        {/* Left page - Image */}
        <div className="w-1/2 h-full p-8 flex items-center justify-center border-r border-purple-200">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
            <img
              src={page.image}
              alt={`${page.title} illustration`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Page number */}
            <div className="absolute bottom-4 left-4 text-white/70 font-semibold text-sm bg-black/20 px-2 py-1 rounded">
              {(currentPage * 2) - 1}
            </div>
          </div>
        </div>
        
        {/* Right page - Text */}
        <div className="w-1/2 h-full p-8 flex flex-col justify-center">
          <div className="space-y-6">
            <h1 className="princess-title text-4xl text-center mb-8 text-purple-800">
              {page.title}
            </h1>
            
            <div className="magical-text text-lg leading-relaxed space-y-4 text-gray-800">
              <p className="first-letter:text-6xl first-letter:font-bold first-letter:text-purple-600 first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:font-serif">
                {page.text}
              </p>
            </div>
            
            <div className="mt-8 text-center">
              <p className="fairy-script text-2xl text-purple-600 italic">
                {page.quote}
              </p>
            </div>
            
            {/* Page number */}
            <div className="absolute bottom-4 right-4 text-gray-500 font-semibold text-sm">
              {currentPage * 2}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="book-container">
        <div className="book-3d mx-auto relative">
          {/* Book spine */}
          <div className="book-spine" />
          
          {/* Page stack effect */}
          <div className="page-stack" style={{
            width: `${Math.max(5, 15 - (currentPage * 2))}px`,
            opacity: currentPage === pages.length - 1 ? 0.3 : 1
          }} />
          
          {/* Book binding line */}
          <div className="book-binding" />
          
          {/* Main page content */}
          <div className={`book-page ${isAnimating ? 'flipped' : ''}`}>
            <div className="page-front rounded-lg overflow-hidden">
              {pages[currentPage]?.type === 'cover' ? renderCoverPage() : renderStoryPage()}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <button
            onClick={prevPage}
            disabled={currentPage === 0 || isAnimating}
            className="absolute -left-16 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-20 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1 || isAnimating}
            className="absolute -right-16 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-20 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Page indicator */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                disabled={isAnimating}
                className={`w-4 h-4 rounded-full transition-all shadow-md ${
                  index === currentPage 
                    ? 'bg-white scale-125 shadow-lg ring-2 ring-purple-300' 
                    : 'bg-white/60 hover:bg-white/80'
                } ${page.type === 'cover' ? 'border-2 border-yellow-400' : ''}`}
                title={page.type === 'cover' ? 'Cover' : `Page ${index}`}
              />
            ))}
          </div>
          
          {/* Book title on spine */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 rotate-90 text-white text-sm font-bold tracking-wider whitespace-nowrap">
            ALYSSA'S TALE
          </div>
        </div>
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-400 rounded-full animate-float-slow opacity-60 pointer-events-none shadow-lg" />
      <div className="absolute top-6 right-6 w-6 h-6 bg-pink-400 rounded-full animate-float-medium opacity-70 pointer-events-none shadow-lg" />
      <div className="absolute bottom-8 left-8 w-4 h-4 bg-purple-400 rounded-full animate-float-fast opacity-50 pointer-events-none shadow-lg" />
      <div className="absolute bottom-6 right-12 w-5 h-5 bg-blue-400 rounded-full animate-float-slow opacity-60 pointer-events-none shadow-lg" />
    </div>
  );
};

export default PictureBook;