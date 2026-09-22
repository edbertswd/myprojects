import europeEnchantingLogo from "@/assets/europeenchanting-logo.webp";
import biotechFuturesLogo from "@/assets/biotechfutures.jpg";
import cathrxLogo from "@/assets/cathrx.png";

export type WorkExperience = {
  company: string;
  role: string;
  logo: string;
  logoAlt: string;
  date: string;
  location: string;
  websiteUrl: string;
  bullets: string[];
  skills: string[];
};

export type InDevProject = {
  title: string;
  description: string;
  technologies: string[];
  timeline: string;
  highlight: string;
  githubUrl?: string;
  teamSize: string;
};

export type ProjectCategory = "Fullstack" | "Frontend" | "Data Science" | "Game Dev";

export type CompletedProject = {
  title: string;
  category: ProjectCategory;
  technologies: string[];
  highlight: string[];
  githubUrl: string;
  liveUrl?: string;
};

export const workExperience: WorkExperience[] = [
  {
    company: "CathRx",
    role: "Software Engineer Intern",
    logo: cathrxLogo,
    logoAlt: "CathRx logo",
    date: "March 2026 – ongoing",
    location: "Sydney, AU",
    websiteUrl: "http://cathrx.com",
    bullets: [
      "Developed a 1-Wire EEPROM emulator using Arduino Mega and the OneWireHub library to emulate a DS2431 chip for a proprietary medical catheter test system",
      "Performed oscilloscope analysis (RIGOL DHO914) to debug protocol timing and signal integrity issues",
      "Investigated 3.3V/5V logic level mismatches and deep-dived into OneWireHub library internals to resolve communication failures",
      "Developed 10 new features on a CIRRIS Electrical Tester GUI",
      "Refactored 7,000+ lines of old and coupled legacy code to be more maintainable for future engineers",
    ],
    skills: ["C++", "Luau", "Arduino", "Embedded Systems", "Technical Documentation"],
  },
  {
    company: "Biotech Futures",
    role: "Software Engineer — Capstone",
    logo: biotechFuturesLogo,
    logoAlt: "Biotech Futures logo",
    date: "July 2025 – Nov 2025",
    location: "Sydney, AU",
    websiteUrl: "https://www.biotechfutures.org/",
    bullets: [
      "Built a student–tutor mentoring platform serving 500+ active mentors and students using Python Django and Vue.js",
      "Deployed the full-stack application to Microsoft Azure, handling authentication, REST API design and database management",
      "Led development in a multi-lead team of 7 backend, 6 frontend and 5 algorithm engineers, delivering the capstone in under 13 weeks",
    ],
    skills: ["Python Django", "JavaScript", "Microsoft Azure", "Vue", "React"],
  },
  {
    company: "Europe Enchanting",
    role: "Software Engineer Intern",
    logo: europeEnchantingLogo,
    logoAlt: "Europe Enchanting logo",
    date: "June 2024",
    location: "Sydney, AU",
    websiteUrl: "https://europeenchanting.com",
    bullets: [
      "Automated migration of 20,000+ product SKUs with 100% accuracy using the Shopify API and Node.js scripts",
      "Reduced manual data entry time from hours to minutes through automated API workflows",
      "Prototyped a full-stack customer review system using React and TypeScript",
    ],
    skills: ["Node.js", "React", "TypeScript", "E-commerce", "Shopify API"],
  },
];

export const inDevProjects: InDevProject[] = [
  {
    title: "Personal Website V2",
    description: "This website — a React Three Fiber front-end with a Node.js backend for live Spotify and Pokémon data.",
    technologies: ["React", "Three.js", "Vite", "Tailwind CSS", "TypeScript", "Motion", "Node.js", "REST API"],
    timeline: "In progress",
    highlight: "Rebuilt with real-time 3D scenes, a working backend and a reactive front-end.",
    githubUrl: "https://github.com/edbertswd/myprojects/tree/main/personalwebsitev2",
    teamSize: "Solo project",
  },
  {
    title: "Acknowledge Me — Game Development",
    description: "A Unity3D game with a unique ghost-themed concept.",
    technologies: ["Unity3D", "C#", "Game Development"],
    timeline: "In progress",
    highlight: "Adding to my experience with 3D game development.",
    teamSize: "Solo project",
  },
];

export const completedProjects: CompletedProject[] = [
  {
    title: "CourtConnect",
    category: "Fullstack",
    technologies: ["AWS EC2", "Python Django", "Vite", "PostgreSQL"],
    highlight: [
      "Full-stack court booking app for Australia",
      "AWS EC2 hosting + PostgreSQL",
      "RESTful API with Nominatim address autocomplete",
    ],
    githubUrl: "https://github.com/edbertswd/myprojects/tree/main/CourtConnectWebsite/app",
  },
  {
    title: "OpenxAI Hackathon Mobile App",
    category: "Fullstack",
    technologies: ["React Native", "TensorFlow Lite", "Flask", "PostgreSQL"],
    highlight: [
      "Real-time facial emotion recognition",
      "Compact mobile TFLite model",
      "Scans a user's face and determines their emotion in real time",
    ],
    githubUrl: "https://github.com/edbertswd/openxai",
  },
  {
    title: "Personal Website (First Version)",
    category: "Frontend",
    technologies: ["React", "Framer Motion"],
    highlight: ["My first ever portfolio website", "First JS and React project"],
    githubUrl: "https://github.com/edbertswd/myprojects/tree/main/personalwebsite",
  },
  {
    title: "ML Cancer Model",
    category: "Data Science",
    technologies: ["Python", "Scikit-learn"],
    highlight: ["Team of 4 engineers", "83.7% accuracy on 50,000 patient records", "First dive into data science"],
    githubUrl: "https://github.com/edbertswd/myprojects/tree/main/MLLungCancerPredictor",
  },
  {
    title: "Pacman Game",
    category: "Game Dev",
    technologies: ["Java", "Gradle"],
    highlight: ["Game design with SOLID/GRASP principles"],
    githubUrl: "https://github.com/edbertswd/myprojects/tree/main/PacmanGame",
  },
  {
    title: "Tower Defense",
    category: "Game Dev",
    technologies: ["Java", "OOP"],
    highlight: ["First Java × Gradle project", "Solidified OOP understanding"],
    githubUrl: "https://github.com/edbertswd/myprojects/tree/main/TowerDefense",
  },
];

/** Every distinct skill / technology mentioned above — feeds the 3D tech cloud. */
export const allSkills: string[] = Array.from(
  new Set([
    ...workExperience.flatMap((w) => w.skills),
    ...inDevProjects.flatMap((p) => p.technologies),
    ...completedProjects.flatMap((p) => p.technologies),
  ])
);
