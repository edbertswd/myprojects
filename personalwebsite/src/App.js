import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [skills] = useState([
    { name: 'JavaScript', level: 85 },
    { name: 'React', level: 80 },
    { name: 'Node.js', level: 75 },
    { name: 'UI/UX Design', level: 70 },
  ]);

  useEffect(() => {
    const handleScroll = () => {
      document.querySelectorAll('.fade-in').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="portfolio-container">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Hi, I'm Edbert Suwandi. </h1>
          <p className="hero-subtitle">I am a Third Year Software Engineer Honours student at the University of Sydney. </p>
          <a href="#projects" className="cta-button">Explore My Work</a>
        </div>
        <div className="hero-image">
          <img src="https://via.placeholder.com/400" alt="Hero Visual" />
        </div>
      </header>

      {/* Projects Section */}
      <main>
        <section id="projects" className="projects-section">
          <h2 className="section-title">Featured Projects</h2>
          <div className="projects-grid">
            <div className="project-card fade-in">
              <img src="https://via.placeholder.com/300" alt="Project 1" />
              <h3>SQL database</h3>
              <p>Project 1.</p>
              <button className="view-button">View Project</button>
            </div>
            <div className="project-card fade-in">
              <img src="https://via.placeholder.com/300" alt="Project 2" />
              <h3>Portfolio Website</h3>
              <p>Responsive, modern design with animations and dynamic content.</p>
              <button className="view-button">View Project</button>
            </div>
            <div className="project-card fade-in">
              <img src="https://via.placeholder.com/300" alt="Project 3" />
              <h3>Game Development</h3>
              <p>Designed a Pac-Man inspired game with dynamic behavior.</p>
              <button className="view-button">View Project</button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about-section">
          <h2 className="section-title">About Me</h2>
          <div className="about-content">
            <p>
              I’m a passionate developer specializing in creating interactive, user-focused applications. 
              With expertise in front-end and back-end development, I aim to merge design and functionality seamlessly. 
            </p>
            <img src="https://via.placeholder.com/200" alt="About Me" className="about-image" />
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="skills-section">
          <h2 className="section-title">My Skillset</h2>
          <div className="skills-grid">
            {skills.map((skill, index) => (
              <div key={index} className="skill-card fade-in">
                <h3>{skill.name}</h3>
                <div className="progress-wrapper">
                  <div
                    className="progress-bar"
                    style={{ width: `${skill.level}%` }}
                  >
                    <span>{skill.level}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 Edbert. All Rights Reserved.</p>
        <div className="social-links">
          <a href="https://github.com/edbertswd/myprojects" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/edbert-suwandi/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
