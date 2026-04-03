import React from 'react';
import europeEnchantingLogo from '/src/assets/europeenchanting-logo.webp'
import biotechFuturesLogo from '/src/assets/biotechfutures.jpg'
import cathrxLogo from '/src/assets/cathrx.png'
import { Calendar, ExternalLink, Code, Database, Zap, Users, CheckCircle, Github, Monitor, Brain, Gamepad2, Smartphone, Clock, MapPin } from 'lucide-react';

const ExperienceAndProjects = () => {
  const workExperience = [{
      company: "CathRx",
      role: "Software Engineer Intern",
      logo: cathrxLogo,
      logoAlt: "CathRx Logo",
      date: "March 2026 - ongoing",
      location: "Sydney, AU",
      websiteUrl: "http://cathrx.com",
      bullets: [
        "Developed a 1-Wire EEPROM emulator using Arduino Mega and the OneWireHub library to emulate a DS2431 chip for a proprietary medical catheter test system",
        "Performed oscilloscope analysis (RIGOL DHO914) to debug protocol timing and signal integrity issues",
        "Investigated 3.3V/5V logic level mismatches and deep-dived into OneWireHub library internals to resolve communication failures",
        "Developed 10 new features on a CIRRIS Electrical Tester GUI",
        "Refactored 7,000+ lines of old and coupled legacy code to be more maintainable for future SWEs working on the project",
      ],
      skills: ["C++", "Luau", "Arduino", "Embedded Systems", "Technical Documentation"]
    },
    {
      company: "Biotech Futures",
      role: "Software Engineer Capstone Project",
      logo: biotechFuturesLogo,
      logoAlt: "Biotech Futures Logo",
      date: "July 2025 - Nov 2025",
      location: "Sydney, AU",
      websiteUrl: "https://www.biotechfutures.org/",
      bullets: [
        "Built a student-tutor mentoring platform serving 500+ active mentors and students using Python Django and Vue.js",
        "Deployed full-stack application to Microsoft Azure, handling authentication, REST API design, and database management",
        "Led development in a multi-led team of 7 backend engineers, 6 frontend, and 5 algorithm engineers, delivering the capstone project in under 13 weeks",
      ],
      skills: ["Python Django", "JavaScript", "Microsoft Azure", "Vue", "React"]
    },
    {
      company: "Europe Enchanting",
      role: "Software Engineer Intern",
      logo: europeEnchantingLogo,
      logoAlt: "Europe Enchanting Logo",
      date: "June 2024",
      location: "Sydney, AU",
      websiteUrl: "https://europeenchanting.com",
      bullets: [
        "Automated migration of 20,000+ product SKUs with 100% accuracy using Shopify API and Node.js scripts",
        "Reduced manual data entry time from hours to minutes through automated API workflows",
        "Prototyped a full-stack customer review system using React and TypeScript",
      ],
      skills: ["Node.js", "React", "TypeScript", "E-commerce", "Shopify API"]
    }
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
  ];

  const completedProjects = [
      {
        title: "CourtConnect",
        category: "Fullstack",
        icon: <Monitor className="w-3 h-3" />,
        technologies: ["Amazon EC2 Cloud Instance", "Python Django", "Vite", "PostgreSQL"],
        highlight: [
          "Full-stack court booking app for Australia",
          "AWS EC2 hosting + PostgreSQL",
          "RESTful API with Nominatim address autocomplete",
        ],
        githubUrl: "https://github.com/edbertswd/myprojects/tree/main/CourtConnectWebsite/app",
        color: "#a63d40",
      },
      {
      title: "Social Mood Mobile App",
      category: "Fullstack",
      icon: <Monitor className="w-3 h-3" />,
      technologies: ["React Native", "TensorFlow Lite", "Flask", "PostgreSQL"],
      highlight: [
        "Real-time facial emotion recognition",
        "Compact mobile TFLite model",
      ],
      githubUrl: "https://github.com/edbertswd/openxai",
      color: "#a63d40"
    },
    {
      title: "Personal Website (First Version)",
      category: "Frontend",
      icon: <Monitor className="w-3 h-3" />,
      technologies: ["React", "Framer Motion"],
      highlight: [
        "My first ever portfolio website",
        "First JS and ReactJS project",
      ],
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/personalwebsite",
      liveUrl: "#",
      color: "#5d576b"
    },
    {
      title: "ML Cancer Model",
      category: "Data Science",
      icon: <Brain className="w-3 h-3" />,
      technologies: ["Python", "Scikit-learn"],
      highlight: [
        "Team of 4 engineers",
        "83.7% accuracy on 50,000 patient records",
        "First dive into data science",
      ],
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/MLLungCancerPredictor",
      color: "#5d576b",
    },
    {
      title: "Pacman Game",
      category: "Game Dev",
      icon: <Gamepad2 className="w-3 h-3" />,
      technologies: ["Java", "Gradle"],
      highlight: [
        "Game design with SOLID/GRASP principles",
      ],
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/PacmanGame",
      color: "#5171a5"
    },
    {
      title: "Tower Defense",
      category: "Game Dev",
      icon: <Gamepad2 className="w-3 h-3" />,
      technologies: ["Java", "OOP"],
      highlight: [
        "First Java x Gradle project",
        "Solidified OOP understanding",
      ],
      githubUrl: "https://github.com/edbertswd/myprojects/tree/main/TowerDefense",
      color: "#5171a5"
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
            <p className="text-gray-600">My experiences in a professional setting.</p>
          </div>

          <div className="space-y-16">
            {workExperience.map((experience, idx) => (
            <div key={idx} className="relative">
              {/* Faded index number */}
              <span
                className="absolute top-8 right-0 text-8xl font-black leading-none select-none pointer-events-none"
                style={{ color: "hsl(var(--sage) / 0.1)" }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex items-stretch gap-4">
                  <div className="w-16 sm:w-24 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm p-1.5" style={{ border: "1px solid hsl(var(--sage))" }}>
                    <img
                      src={experience.logo}
                      alt={experience.logoAlt}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{experience.company}</h2>
                    <p className="text-sm sm:text-base font-medium text-gray-500">{experience.role}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />{experience.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />{experience.location}
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={experience.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium hover:underline flex-shrink-0 self-start"
                  style={{ color: "hsl(var(--sage))" }}
                >
                  Visit Site <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Bullets */}
              <ul className="space-y-2 mb-4">
                {experience.bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--sage))" }} />
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {experience.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: "hsl(var(--sage) / 0.2)",
                      color: "hsl(var(--primary-dark))",
                      border: "1px solid hsl(var(--sage) / 0.5)"
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            ))}
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
                  <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between mb-2 gap-1">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                    </div>
                    <div className="xs:text-right flex-shrink-0 xs:ml-4">
                      <div className="text-xs text-orange-600 font-medium">{project.timeline}</div>
                      <div className="text-xs text-gray-500">{project.teamSize}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{project.highlight}</span>
                  </div>

                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
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
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium hover:shadow-sm transition-all self-start xs:self-auto flex-shrink-0"
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedProjects.map((project, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col h-full"
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
                  
                  <div className="mb-4 flex-grow space-y-1">
                    {project.highlight.map((point, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                      </div>
                    ))}
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

                  <div className="mt-auto flex gap-2">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all hover:bg-gray-50"
                      style={{ border: `1px solid ${project.color}`, color: project.color }}
                    >
                      <Github className="w-4 h-4" /> View Code
                    </a>
                    {project.liveUrl && project.liveUrl !== "#" && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: project.color }}
                      >
                        <ExternalLink className="w-4 h-4" /> Live
                      </a>
                    )}
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