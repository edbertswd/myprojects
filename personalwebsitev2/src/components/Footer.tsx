import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      className="relative py-14 text-center"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "hsl(var(--section-bg))"
      }}
    >
      {/* Subtle pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--sage)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} className="absolute inset-0" />
      </div>

      <motion.div
        className="max-w-2xl mx-auto px-4 relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >

        {/* Contact Links */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <a
            href="https://github.com/edbertswd"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-md hover:scale-105"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-all duration-200 ease-out hover:shadow-md hover:scale-105 hover:bg-primary hover:text-white"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 ease-out hover:shadow-md hover:scale-105 hover:opacity-90"
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
        <div className="space-y-1 text-sm" style={{ color: "hsl(var(--taupe))" }}>
          <p>&copy; 2024 Edbert Suwandi. Built with React & Tailwind CSS.</p>
          <p>All rights reserved.</p>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
