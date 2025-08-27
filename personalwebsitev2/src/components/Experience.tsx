import React from 'react';
import europeEnchantingLogo from '/src/assets/europeenchanting-logo.webp'
import { Calendar, ExternalLink, Code, Database, Zap, Users, CheckCircle, Github, Monitor, Brain, Gamepad2, Smartphone, Clock } from 'lucide-react';

const ExperienceAndProjects = () => {
  const achievements = [
    { icon: <Database className="w-3 h-3" />, title: "20,000+ SKUs", metric: "100% accuracy" },
    { icon: <Zap className="w-3 h-3" />, title: "API Automation", metric: "Hours to minutes" },
    { icon: <Users className="w-3 h-3" />, title: "Review System", metric: "Full-stack prototype" }
  ];

  const inDevProjects = [
    {
      title: "Personal Website V2",
      description: "This website! Full stack website with a proper working backend in Node.js and Vite & React frontend.",
      technologies: ["React", "Vite", "TailwindCSS", "TypeScript", "Framer Motion", "Node.js", "RESTful API"],
      timeline: "In Progress",
      highlight: "Redesigned with a working backend handled in a Node.js server and a reactive frontend.",
      githubUrl: "https://github.com/edbertswd/myprojects/personalwebsitev2",
      teamSize: "Solo Project"
    },
    {
      title: "Social Mood Mobile App",
      description: "Cross-platform social media app with AI mood detection for hackathon competition.",
      technologies: ["React Native", "TensorFlow Lite", "Flask", "PostgreSQL"],
      timeline: "Due Aug 31, 2025",
      highlight: "Real-time facial emotion recognition with Flask APIs and Docker deployment",
      githubUrl: "https://github.com/edbertswd/openxai",
      teamSize: "Team of 2"
    }
  ];

  const completedProjects = [
    {
      title: "Personal Website (First Version)",
      category: "Frontend",
      icon: <Monitor className="w-3 h-3" />,
      technologies: ["React", "Framer Motion"],
      highlight: "My first ever portfolio website. This was my first JS and ReactJS website.",
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/personalwebsite",
      liveUrl: "#",
      color: "hsl(var(--primary))"
    },
    {
      title: "ML Cancer Model",
      category: "Data Science",
      icon: <Brain className="w-3 h-3" />,
      technologies: ["Python", "Scikit-learn"],
      highlight: "Worked with a team of 4 TALENTED engineers to achieve: 83.7% accuracy on 50,000 patient records. This was one of my first dives into data science!",
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/MLLungCancerPredictor",
      color: "#8B5CF6",
    },
    {
      title: "Pacman Game",
      category: "Game Dev",
      icon: <Gamepad2 className="w-3 h-3" />,
      technologies: ["Java", "Gradle"],
      highlight: "This project helped me design a game that adheres to SOLID/GRASP principles. It was a really fun project honestly!",
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/PacmanGame",
      color: "#F59E0B"
    },
    {
      title: "Tower Defense",
      category: "Game Dev",
      icon: <Gamepad2 className="w-3 h-3" />,
      technologies: ["Java", "OOP"],
      highlight: "This was my very first Java x Gradle projects, and helped me solidify my understanding on OOP principles.",
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/TowerDefense",
      color: "#F59E0B"
    }
  ];

  return (
    <section 
      id="experience"
      className="relative overflow-hidden py-12"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#effcf5",
      }}
    >
      <div className="absolute inset-0 opacity-5">
        <div style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--sage)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} className="absolute inset-0" />
      </div>

      <div className="max-w-5xl mx-auto px-4 relative">
        
        {/* Work Experience - Hero Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div 
              className="inline-block px-4 py-2 mb-4 rounded-lg"
              style={{
                background: "linear-gradient(45deg, hsl(var(--sage)), hsl(var(--primary)))",
                border: "1px solid hsl(var(--sage))",
                color: "#fff"
              }}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-semibold">PROFESSIONAL EXPERIENCE</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Work Experience</h1>
          </div>

          <div 
            className="bg-white rounded-xl shadow-md"
            style={{ border: "1px solid hsl(var(--sage))" }}
          >
            <div 
              className="px-4 py-3"
              style={{
                background: "linear-gradient(135deg, hsl(var(--sage)) 0%, hsl(var(--primary)) 100%)",
                borderBottom: "1px solid hsl(var(--sage))",
                borderTopLeftRadius: "0.75rem",
                borderTopRightRadius: "0.75rem"
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white rounded-lg overflow-hidden flex items-center justify-center p-2">
                    <img 
                      src={europeEnchantingLogo} 
                      alt="Europe Enchanting Logo" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Europe Enchanting</h2>
                    <p className="text-white/90 text-sm">Software Engineer Intern</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                    <Calendar className="w-3 h-3 text-white" />
                    <span className="text-white text-xs">June 2024</span>
                  </div>
                  <a 
                    href="https://europeenchanting.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white text-gray-700 px-2 py-1 rounded-full text-xs hover:bg-gray-50 transition-colors"
                  >
                    Visit Site <ExternalLink className="w-2 h-2" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-gray-50"
                    style={{ border: "1px solid hsl(var(--sage))" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="p-1 rounded-full"
                        style={{ backgroundColor: "hsl(var(--sage))", color: "white" }}
                      >
                        {achievement.icon}
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{achievement.metric}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">{achievement.title}</h3>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {["Node.js", "React", "TypeScript", "E-commerce", "Shopify API"].map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "linear-gradient(45deg, hsl(var(--primary)), hsl(var(--sage)))",
                      color: "white"
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Projects */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-800">In Development</h2>
          </div>

          <div className="space-y-4">
            {inDevProjects.map((project, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm" style={{ border: "1px solid hsl(var(--sage))" }}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-xs text-orange-600 font-medium">{project.timeline}</div>
                      <div className="text-xs text-gray-500">{project.teamSize}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{project.highlight}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ backgroundColor: "hsl(var(--sage))", color: "white" }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <a 
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium hover:shadow-sm transition-all"
                      style={{ border: "1px solid hsl(var(--sage))", color: "hsl(var(--sage))" }}
                    >
                      <Github className="w-3 h-3" /> Code
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Projects */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Projects</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {completedProjects.map((project, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                style={{ border: `1px solid ${project.color}` }}
              >
                <div 
                  className="px-3 py-2"
                  style={{ 
                    backgroundColor: project.color, 
                    color: "white",
                    borderBottom: `1px solid ${project.color}`,
                    borderTopLeftRadius: "0.5rem",
                    borderTopRightRadius: "0.5rem"
                  }}
                >
                  <div className="flex items-center gap-2">
                    {project.icon}
                    <span className="text-xs font-semibold">{project.category}</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-gray-800 mb-3 text-base leading-tight">{project.title}</h3>
                  
                  <div className="flex items-start gap-2 mb-4 flex-grow">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 leading-relaxed">{project.highlight}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.map((tech, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs rounded-md font-medium"
                        style={{ backgroundColor: project.color, color: "white" }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <a 
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all hover:bg-gray-50"
                      style={{ border: `1px solid ${project.color}`, color: project.color }}
                    >
                      <Github className="w-4 h-4" /> View Code
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ExperienceAndProjects;