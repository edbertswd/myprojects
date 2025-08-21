import React, { useState } from 'react';
import { Calendar, ExternalLink, Code, Database, Zap, Users, CheckCircle } from 'lucide-react';

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
      icon: <Database className="w-4 h-4" />,
      title: "20,000+ SKUs",
      metric: "100% accuracy between platforms"
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: "API Automation",
      metric: "Hours to minutes deployment"
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: "Review System",
      metric: "Full-stack prototype deployed"
    }
  ];

  return (
    <section id="experience" className="py-12 bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-4">
            <Code className="w-4 h-4" />
            Professional Journey
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Work Experience
          </h2>
          <p className="text-lg text-muted-foreground">
            Treasured experiences that shaped who I am today. 
          </p>
        </div>

        {/* Main Experience Card */}
        <div 
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-sage rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-card rounded-xl shadow-soft border border-border overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary to-accent p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                {/* Company Logo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-background shadow-lg border-2 border-background transform transition-transform group-hover:scale-105">
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <img src="europeenchanting-logo.webp" alt="Company Logo" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Company Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-bold text-primary-foreground mb-1">
                        Europe Enchanting
                      </h3>
                      <p className="text-primary-foreground/80 text-lg font-semibold">Software Engineer Intern</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <Calendar className="w-4 h-4 text-primary-foreground" />
                        <span className="text-primary-foreground text-sm font-medium">June 2024</span>
                      </div>
                      <a 
                        href="https://europeenchanting.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-background text-primary px-3 py-1 rounded-full text-sm font-medium hover:bg-muted transition-all transform hover:scale-105"
                      >
                        Visit Site
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Key Achievements */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-foreground mb-4">Key Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-br from-muted/50 to-card p-4 rounded-lg border border-border hover:shadow-hover transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-accent/20 rounded text-accent-foreground">
                          {achievement.icon}
                        </div>
                        <div className="text-sage font-bold text-xs">{achievement.metric}</div>
                      </div>
                      <h5 className="font-semibold text-foreground text-sm">{achievement.title}</h5>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accomplishments */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-foreground mb-4">Technical Accomplishments</h4>
                <div className="space-y-3">
                  {[
                    {
                      title: "Multi-Platform Inventory Management",
                      description: "Streamlined 20,000+ premium SKUs across Tokopedia, Shopee, Lazada, and Shopify using Ginee platform.",
                      impact: "Enhanced reliability"
                    },
                    {
                      title: "Shopify REST API Integration",
                      description: "Automated product and pricing updates, reducing manual work from hours to minutes.",
                      impact: "95% time reduction"
                    },
                    {
                      title: "Customer Review System",
                      description: "Built React.js + Node.js prototype for customer feedback and analytics foundation.",
                      impact: "Improved UX"
                    },
                  ].map((accomplishment, index) => (
                    <div key={index} className="flex gap-3 p-4 bg-gradient-to-r from-muted/30 to-card rounded-lg border border-border">
                      <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-1 mb-2">
                          <h5 className="font-semibold text-foreground">{accomplishment.title}</h5>
                          <span className="px-2 py-0.5 bg-sage/20 text-sage rounded-full text-xs font-medium flex-shrink-0">
                            {accomplishment.impact}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{accomplishment.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="text-lg font-bold text-foreground mb-4">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden px-4 py-2 rounded-full text-primary-foreground text-sm font-semibold transform hover:scale-105 transition-all duration-300 cursor-default bg-gradient-to-r from-primary to-accent"
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