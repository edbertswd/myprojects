import React, { useEffect } from "react";
import ReactFullpage from "@fullpage/react-fullpage";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Star, Search, MapPin, Calendar, Users } from "lucide-react";
import Header from "../components/common/Header";
import { useAuth } from "../context/useAuth";

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect logged-in users to their dashboard
    if (isAuthenticated) {
      navigate('/userHomeDashboard');
    }
  }, [isAuthenticated, navigate]);

  // Don't render the landing page if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-[9999] bg-white">
        <Header />
      </div>

      {/* Fullpage Content */}
      <ReactFullpage
        scrollingSpeed={800}
        anchors={["main", "features", "appendix"]}
        navigation={true}

        render={() => (
          <ReactFullpage.Wrapper>
            {/* Page 1 */}
            <div className="section bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex flex-col justify-center items-center text-center pt-16">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-100 border border-blue-400/30 backdrop-blur-sm mb-6">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  Sydney's #1 Sports Booking Platform
                </span>

                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                  <div>
                    <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                      Book Sports Facilities
                    </span>
                  </div>
                  <div>
                    <span className="text-4xl md:text-6xl mt-2 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                      Anytime, Anywhere
                    </span>
                  </div>
                </h1>

                <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
                  Find and reserve courts, fields, and sports venues in your area with ease.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    to="/facilities"
                    className="group bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center"
                  >
                    Browse Facilities
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Page 2: Features */}
              <div className="section bg-gradient-to-b from-gray-50 to-white flex flex-col justify-center py-24">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                    Why Choose{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      CourtConnect?
                    </span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    We built CourtConnect to make sports booking simple, social, and stress-free.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row justify-center items-start gap-10 max-w-6xl mx-auto px-6">
                  {[
                    {
                      icon: <Search className="w-8 h-8 text-blue-600" />,
                      title: "Smart Discovery",
                      desc: "Find the right place to play using smart filters and real-time availability.",
                    },
                    {
                      icon: <Calendar className="w-8 h-8 text-green-600" />,
                      title: "Instant Booking",
                      desc: "Lock in your favorite time instantly — no phone calls, no waiting.",
                    },
                    {
                      icon: <MapPin className="w-8 h-8 text-purple-600" />,
                      title: "Local Focus",
                      desc: "Support nearby venues and discover hidden gems in your neighborhood.",
                    },
                    {
                      icon: <Users className="w-8 h-8 text-orange-500" />,
                      title: "Play Together",
                      desc: "Join a friendly community that connects players and teams across Sydney.",
                    },
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col items-start text-left max-w-xs">
                      <div className="mb-4">{f.icon}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page 3: CTA + Footer */}
              <div className="section relative bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white flex flex-col justify-center items-center text-center transform -translate-y-8">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  Ready to{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Play?
                  </span>
                </h2>
                <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of players who trust CourtConnect for their bookings.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-28">
                  <Link
                    to="/register"
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 flex items-center"
                  >
                    Sign Up Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/facilities"
                    className="group border-2 border-white/30 hover:border-white/50 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm flex items-center"
                  >
                    Browse Facilities
                    <MapPin className="ml-2 w-5 h-5" />
                  </Link>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-gray-900/40 border-t border-white/10">
                  <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div>
                      <h3 className="font-bold text-lg mb-3 text-white">CourtConnect</h3>
                      <p className="text-gray-400 text-sm">
                        Book sports facilities and courts with ease. Find the perfect venue for your game.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3 text-white">Quick Links</h3>
                      <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link to="/facilities" className="hover:text-blue-400">Browse Facilities</Link></li>
                        <li><Link to="/about" className="hover:text-blue-400">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-blue-400">Contact</Link></li>
                      </ul>

                      <div className="w-full py-4 flex justify-center">
                        <p className="text-gray-500 text-xs text-center">
                          © {new Date().getFullYear()} CourtConnect. All rights reserved.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3 text-white">Support</h3>
                      <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link to="/help" className="hover:text-blue-400">Help Center</Link></li>
                        <li><Link to="/terms" className="hover:text-blue-400">Terms of Service</Link></li>
                        <li><Link to="/privacy" className="hover:text-blue-400">Privacy Policy</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ReactFullpage.Wrapper>
          )}
        />
    </div>
  );
};

export default HomePage;
