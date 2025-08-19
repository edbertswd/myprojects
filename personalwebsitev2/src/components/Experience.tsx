import React, { useState } from 'react';
import { Calendar, ExternalLink, Code, Database, Zap, TrendingUp, Users, CheckCircle } from 'lucide-react';

const Experience = () => {
  const [isHovered, setIsHovered] = useState(false);

  const skills = [
    { name: "Node.js" },
    { name: "React" },
    { name: "TypeScript" },
    { name: "E-commerce" }
  ];

  const achievements = [
    {
      icon: <Database className="w-5 h-5" />,
      title: "20,000+ SKUs Managed",
      description: "Streamlined inventory across multiple platforms",
      metric: "100% accuracy"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "API Integration",
      description: "Automated updates from hours to minutes",
      metric: "95% efficiency"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Customer Experience",
      description: "Built review system prototype",
      metric: "Enhanced UX"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Smart Algorithm",
      description: "Optimized purchasing decisions",
      metric: "Reduced waste"
    }
  ];

  return (
    <section id="experience" className="py-24 bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-6">
            <Code className="w-4 h-4" />
            Professional Journey
          </div>
          <h2 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
            Work Experience
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Building innovative solutions in the e-commerce ecosystem
          </p>
        </div>

        {/* Main Experience Card */}
        <div 
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-sage rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary to-accent p-8">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Company Logo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-background shadow-lg border-4 border-background transform transition-transform group-hover:scale-105">
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-xl">EE</span>
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-bold text-primary-foreground mb-2">
                        Europe Enchanting
                      </h3>
                      <p className="text-primary-foreground/80 text-xl font-semibold">Software Engineer Intern</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                        <Calendar className="w-4 h-4 text-primary-foreground" />
                        <span className="text-primary-foreground font-medium">June 2024</span>
                      </div>
                      <a 
                        href="https://europeenchanting.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-background text-primary px-4 py-2 rounded-full font-medium hover:bg-muted transition-all transform hover:scale-105"
                      >
                        Visit Site
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
              {/* Key Achievements Grid */}
              <div className="mb-10">
                <h4 className="text-2xl font-bold text-foreground mb-6">Key Impact & Achievements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-br from-muted/50 to-card p-6 rounded-xl border border-border hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-accent/20 rounded-lg text-accent-foreground">
                          {achievement.icon}
                        </div>
                        <div className="text-sage font-bold text-sm">{achievement.metric}</div>
                      </div>
                      <h5 className="font-semibold text-foreground mb-2">{achievement.title}</h5>
                      <p className="text-muted-foreground text-sm">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Accomplishments */}
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-foreground mb-6">Technical Accomplishments</h4>
                <div className="space-y-4">
                  {[
                    {
                      title: "Multi-Platform Inventory Management",
                      description: "Streamlined real-time inventory and pricing for 20,000+ premium SKUs across Tokopedia, Shopee, Lazada, and Shopify using the Ginee platform—ensuring luxury products were accurately presented and consistently available.",
                      impact: "Enhanced brand confidence"
                    },
                    {
                      title: "Shopify REST API Integration",
                      description: "Engineered a full-fledged API integration that automated product, pricing, and stock updates—eliminating manual bottlenecks and accelerating update cadence from hours to minutes.",
                      impact: "95% time reduction"
                    },
                    {
                      title: "Customer Review System",
                      description: "Designed and deployed a React.js + Node.js prototype for transparent customer feedback, laying the groundwork for enterprise-level analytics and customer loyalty programs.",
                      impact: "Improved UX foundation"
                    },
                    {
                      title: "Intelligent Purchasing Algorithm",
                      description: "Devised a data-driven purchasing algorithm using multi-platform sales data to optimize restocking decisions and prevent inventory issues.",
                      impact: "Optimized stock management"
                    }
                  ].map((accomplishment, index) => (
                    <div key={index} className="flex gap-4 p-6 bg-gradient-to-r from-muted/30 to-card rounded-xl border border-border hover:shadow-card transition-all duration-300">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 mb-3">
                          <h5 className="font-semibold text-foreground text-lg">{accomplishment.title}</h5>
                          <span className="px-3 py-1 bg-sage/20 text-sage rounded-full text-sm font-medium">
                            {accomplishment.impact}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{accomplishment.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="text-2xl font-bold text-foreground mb-6">Technologies & Skills</h4>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden px-6 py-3 rounded-full text-primary-foreground font-semibold transform hover:scale-105 transition-all duration-300 cursor-default bg-gradient-to-r from-primary to-accent"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>
                      <span className="relative z-10">{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;