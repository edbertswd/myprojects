import React, {useEffect } from 'react';
import './App.css';
import ValentineModal from "./ValentineModal";

const App = () => {
  const projectLinks = {
    TowerDefense: 'https://github.com/edbertswd/myprojects/tree/main/TowerDefense',
    portfolioWebsite: 'https://github.com/edbertswd/myprojects/tree/main/personalwebsite',
    pacmanGame: 'https://github.com/edbertswd/myprojects/tree/main/PacmanGame',
    MLmodel: 'https://github.com/edbertswd/myprojects/tree/main/MLLungCancerPredictor',
  };

  const workExperiences = [
    {
      name: 'PT. Bangunan Jaya Cemerlang',
      role: 'Software Engineer Intern',
      url: 'https://europeenchanting.com',
      logo: '/logo.png', // Replace with actual path to the logo
      location: 'Jakarta, Indonesia',
      startDate: 'June 2024',
      endDate: 'December 2024',
      responsibilities: [
        'Managed database operations on the Ginee platform, overseeing updates for product stock, pricing, and inventory across a catalog of over 1,000 SKUs.',
        'Led cross-category expansion efforts, integrating new product categories into the Ginee database using SQL scripts, resulting in a 40% increase in catalog size.',
        'Resolved product synchronization issues between online and offline stores by optimizing the data entry process, reducing operational delays by 50%.',
        'Automated inventory updates using Ginee’s bulk-editing tools, cutting manual errors by 25% and saving over 10 hours per week in data management tasks.',
      ],
    },
  ];

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
      {/* Navigation Panel */}
      <nav className="navigation-header">
        <div className="nav-container">
          <div className="logo">  
            <a href="#top">edsuw_</a>
          </div>
          <ul className="nav-links">
            <li><a href="#projects">Projects</a></li>
            <li><a href="#work-experience">Work Experience</a></li>
          </ul>
          <div className="nav-social-links">
            <a href="https://github.com/edbertswd/myprojects" target="_blank" rel="noopener noreferrer" className="social-logo-wrapper">
              <img src="/github-logo.png" alt="GitHub Logo" className="social-logo" />
            </a>
            <a href="https://www.linkedin.com/in/edbert-suwandi/" target="_blank" rel="noopener noreferrer" className="social-logo-wrapper">
              <img src="/linkedin-logo.png" alt="LinkedIn Logo" className="linkedin-logo" />
            </a>
            <a href="/EdbertSuwandi_Resume.pdf" download className="resume-link">
              Resume
          </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Hi, I'm Edbert Suwandi.</h1>
          <p className="hero-subtitle">
            I am a Third Year Software Engineer Honours Student at the University of Sydney.
            I recently finished interning as a Software Engineer at 
            <a 
              href="https://www.europeenchanting.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="company-link"
            >
              Europe Enchanting
            </a>. 
          </p>
        </div>
        <div className="hero-image">
          <img src="/myface.jpg" alt="Hero Visual" />
        </div>
      </header>


      {/* Projects Section */}
      <main>
        <section id="projects" className="projects-section">
          <div className="projects-header"> 
          <h2 className="section-title">Featured Projects</h2>
          <h3 className="section-subtitle"> 
            These are my completed projects that I have up on my Github repo.
          </h3>
          </div>
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
            <div className="project-card project-4 fade-in">
              <div className="project-content">
                <h3>ML Model for Predicting Lung Cancer </h3>
                <p>Developed a machine learning model to predict lung cancer survivability using real-world medical datasets.</p>
                <ul>
                  <li>
                    <strong>Things Learned:</strong> Machine learning concepts, feature engineering, and model evaluation techniques.
                  </li>
                  <li>
                    <strong>Utilities:</strong> Python, scikit-learn, Jupyter Notebooks, Pandas, Matplotlib
                  </li>
                </ul>
                <button
                  className="view-button"
                  onClick={() => window.open(projectLinks.MLmodel, '_blank')}
                >
                  View Project
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Work Experience Section */}
        <section id="work-experience" className="work-experience-section">
          <h2 className="work-experience-title">Work Experience</h2>
          <div className="experience-list">
            {workExperiences.map((experience, index) => (
              <div className="experience-item" key={index}>
                <div className="logo-wrapper">
                  <a href={experience.url} target="_blank" rel="noopener noreferrer">
                    <img src={experience.logo} alt={`${experience.name} Logo`} className="company-logo" />
                  </a>
                </div>
                <div className="experience-content">
                  <h3 className="company-name">
                    <a href={experience.url} target="_blank" rel="noopener noreferrer">
                      {experience.name}
                    </a>
                  </h3>
                  <p className="role">{experience.role}</p>
                  <p className="location">{experience.location}</p>
                  <p className="duration">
                    {experience.startDate} - {experience.endDate}
                  </p>
                  <ul className="responsibilities">
                    {experience.responsibilities.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      
      {/*Valentines Extension */}
      <div className="App">
        <ValentineModal />
      </div>

      
      {/*Get to Know Me */}
      <section className="get-to-know-section">
        <h2 className="get-to-know-title">Get to Know Me</h2>
          <div className="get-to-know-subsection">
            <div className="get-to-know-image twitch-image"></div>
            <div className="get-to-know-content">
              <h2 className="get-to-know-subtitle">Sharing Adventures, Building Connections</h2>
              <p>
                I’m all about sharing my journey and hearing about others’ adventures—because let’s face it, everyone’s story is unique and awesome!
                One of the coolest ways I’ve done this is as a <span className="get-to-know-highlight">Twitch content creator</span> 
                where I've had a blast of building a community of over <span className="get-to-know-highlight">1.8k followers</span>. 
                It’s been a wild ride full of fun, creativity, and connection!
              </p>
            </div>
          </div>
          <div className="get-to-know-subsection">
          <div className="get-to-know-content">
            <h2 className="get-to-know-subtitle">Collaboration is My Core</h2>
            <p>
              I love being a part of something <span className="get-to-know-highlight"> BIG.</span>
              Whether it’s <span className="get-to-know-highlight"> collaborating with a multidisciplinary team </span> to predict patient survival rates for
              lung cancer or <span className="get-to-know-highlight">teaming up with an esports squad </span> to clinch a tournament victory, 
              I thrive on the energy of collaboration and the spark of teamwork.
            </p>
          </div>
          <div className="get-to-know-image organization-image"></div>
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
