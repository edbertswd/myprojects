import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [skills] = useState([
    { name: 'JavaScript', level: 85 },
    { name: 'React', level: 80 },
    { name: 'Node.js', level: 75 },
    { name: 'UI/UX Design', level: 70 },
  ]);

  const projectLinks = {
    TowerDefense: 'https://github.com/edbertswd/myprojects/tree/main/TowerDefense',
    portfolioWebsite: 'https://github.com/edbertswd/myprojects/tree/main/personalwebsite',
    pacmanGame: 'https://github.com/edbertswd/myprojects/tree/main/PacmanGame',
  };

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
          <h1 className="hero-title">Hi, I'm Edbert Suwandi.</h1>
          <p className="hero-subtitle">
            I am a Third Year Software Engineer Honours student at the University of Sydney.
          </p>
          <a href="#projects" className="cta-button">Explore My Work</a>
        </div>
        <div className="hero-image">
          <img src="/myface.jpg" alt="Hero Visual" />
        </div>
      </header>

      {/* Projects Section */}
      <main>
        <section id="projects" className="projects-section">
          <h2 className="section-title">Featured Projects</h2>
          <div className="projects-grid">
            <div className="project-card project-1 fade-in">
              <div className="project-content">
                <h3>Tower Defense Game</h3>
                <p> Tower Defense game implementing BFS Pathfinding for enemy navigation.</p>
                <ul>
                  <li>
                    <strong>Things Learned:</strong> Core Data Structures and Algorithms (BFS, DFS)
                  </li>
                  <li>
                    <strong>Utilities:</strong> JavaFX, Gradle
                  </li>
                </ul>
                <button
                  className="view-button"
                  onClick={() => window.open(projectLinks.TowerDefense, '_blank')}
                >
                  View Project
                </button>
              </div>
            </div>
            <div className="project-card project-2 fade-in">
              <div className="project-content">
                <h3>Portfolio Website</h3>
                <p>First React and JS project!</p>
                <ul>
                  <li>
                    <strong>Things Learned:</strong> Understanding React components, state management, and basic event handling.
                  </li>
                  <li>
                    <strong>Utilities:</strong> React, JavaScript, HTML, CSS
                  </li>
                </ul>
                <button
                  className="view-button"
                  onClick={() => window.open(projectLinks.portfolioWebsite, '_blank')}
                >
                  View Project
                </button>
              </div>
            </div>
            <div className="project-card project-3 fade-in">
              <div className="project-content">
                <h3>Pacman Game</h3>
                <p>Designed a traditional Pac-Man game.</p>
                <ul>
                  <li>
                    <strong>Things Learned:</strong> SOLID/GRASP Principles, GoF Design Patterns
                  </li>
                  <li>
                    <strong>Utilities:</strong> JavaFX, Gradle
                  </li>
                </ul>
                <button
                  className="view-button"
                  onClick={() => window.open(projectLinks.pacmanGame, '_blank')}
                >
                  View Project
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Work Experience Section */}
        <section id="work-experience" className="work-experience-section">
          <h2 className="section-title">Work Experience</h2>
          <div className="experience-grid">
            <div className="experience-card fade-in">
              <h3>Software Engineer Internship</h3>
              <p>
                <strong>Company:</strong> PT. Bangunan Jaya Cemerlang <br />
                <strong>Duration:</strong> Jun 2024 - Dec 2024 (7 months)
              </p>
              <ul>
                <li>Optimized Ginee database for warehouse management, improving query speed.</li>
                <li>Implemented indexing strategies and query optimization techniques.</li>
                <li>Collaborated on refactoring database schemas for scalability and maintainability.</li>
                <li>Developed automation scripts for routine database maintenance.</li>
                <li>Fixed platform integration delays, resulting in more reliable stock numbers.</li>
              </ul>
              <div className="card-animation"></div>
            </div>
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
