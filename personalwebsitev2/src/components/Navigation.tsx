import logo from '/src/assets/edsuw-logo.png'

const Navigation = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-16 w-auto scale-150 transform origin-left" 
          />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a 
            href="#about" 
            className="text-warm-brown hover:text-sage transition-colors font-montserrat font-semibold"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            About
          </a>
          <a 
            href="#experience" 
            className="text-warm-brown hover:text-sage transition-colors font-montserrat font-semibold"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Experience
          </a>
          <a 
            href="#hobbies" 
            className="text-warm-brown hover:text-sage transition-colors font-montserrat font-semibold"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('hobbies')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Hobbies
          </a>
        </div>

        {/* Social Links */}
        <div className="flex items-center space-x-3 text-slate-700">
          <a href="http://github.com/edbertswd/myprojects" className="p-2 hover:text-sage transition-colors">
            {/* GitHub Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 
              12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 
              0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.083-.729.083-.729 
              1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 
              3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.466-1.332-5.466-5.93 
              0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.527.105-3.176 
              0 0 1.005-.322 3.3 1.23a11.48 11.48 0 013.003-.404c1.018.005 
              2.045.138 3.003.404 2.28-1.552 3.285-1.23 
              3.285-1.23.645 1.649.24 2.873.12 3.176.765.84 
              1.23 1.91 1.23 3.22 0 4.61-2.805 5.62-5.475 
              5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 
              3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 
              24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
          </a>

          <a href="https://www.linkedin.com/in/edbert-suwandi" className="p-2 hover:text-sage transition-colors">
            {/* LinkedIn Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452H16.89v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 
              0-2.136 1.445-2.136 2.939v5.667H9.345V9h3.41v1.561h.049c.476-.9 
              1.637-1.852 3.37-1.852 3.605 0 4.268 2.373 4.268 
              5.456v6.287zM5.337 7.433a1.986 1.986 
              0 110-3.972 1.986 1.986 0 010 3.972zM6.813 
              20.452H3.861V9h2.952v11.452zM22.225 
              0H1.771C.792 0 0 .774 0 1.729v20.542C0 
              23.227.792 24 1.771 24h20.451C23.2 24 
              24 23.227 24 22.271V1.729C24 .774 23.2 
              0 22.222 0z"/>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
