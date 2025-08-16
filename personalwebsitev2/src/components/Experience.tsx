import europeenchantingLogo from "@/assets/europeenchanting-logo.webp";

const Experience = () => {
  return (
    <section id="experience" className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-portfolio-dark mb-4">Work Experience</h2>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
                  <img 
                    src={europeenchantingLogo} 
                    alt="Europe Enchanting Logo" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              </div>

              {/* Experience Details */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Europe Enchanting
                    </h3>
                    <p className="text-orange-500 font-medium">Software Engineer Intern</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">June 2024</span>
                    <a 
                      href="https://europeenchanting.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <ul className="list-none text-gray-600 leading-relaxed text-justify">
                  <li className="mb-2 before:content-['→'] before:mr-2 before:text-portfolio-orange">
                    Streamlined real-time inventory and pricing for 20,000+ premium SKUs across Tokopedia, Shopee, Lazada, and Shopify using the Ginee platform—ensuring luxury products were accurately presented and consistently available, reinforcing customer confidence in Europe Enchanting's premium brand.
                  </li>
                  <li className="mb-2 before:content-['→'] before:mr-2 before:text-portfolio-orange">
                    Engineered a full-fledged Shopify REST API integration that automated product, pricing, and stock updates—eliminating manual bottlenecks, accelerating update cadence from hours to minutes, and safeguarding accurate display of a variety of products.
                  </li>
                  <li className="mb-2 before:content-['→'] before:mr-2 before:text-portfolio-orange">
                    Designed and deployed a React.js + Node.js “Reviews” prototype, enabling transparent customer feedback on quality products—laying the groundwork for enterprise-level analytics and potential loyalty drivers for upscale buyers.
                  </li>
                  <li className="before:content-['→'] before:mr-2 before:text-portfolio-orange">
                    Devised a purchasing algorithm using sales data from Shopee, Lazada, and Tokopedia to optimize restocking and prevent overstock or stockouts.
                  </li>
                </ul>


                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                    Node.js
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                    React
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                    TypeScript
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                    E-commerce industry
                  </span>
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