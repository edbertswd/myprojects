import { Github, Linkedin, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer 
      className="relative py-12 text-center"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#effcf5"
      }}
    >
      {/* Subtle pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--sage)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-2xl mx-auto px-4 relative">
        

        {/* Contact Links */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <a 
            href="https://github.com/edbertswd" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-sm"
            style={{
              backgroundColor: "hsl(var(--sage))",
              color: "white"
            }}
          >
            <Github className="w-4 h-4" />
            <span className="text-sm font-medium">GitHub</span>
          </a>
          
          <a 
            href="https://www.linkedin.com/in/edbert-suwandi/" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:shadow-sm"
            style={{
              borderColor: "hsl(var(--primary))",
              color: "hsl(var(--primary))"
            }}
          >
            <Linkedin className="w-4 h-4" />
            <span className="text-sm font-medium">LinkedIn</span>
          </a>
          
          <a 
            href="mailto:edbertswd@gmail.com" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-sm"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "white"
            }}
          >
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">Email</span>
          </a>
        </div>


        {/* Copyright */}
        <div className="space-y-2 text-xs text-gray-500">
          <p>© 2024 Edbert Suwandi. Built with React & Tailwind CSS.</p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;