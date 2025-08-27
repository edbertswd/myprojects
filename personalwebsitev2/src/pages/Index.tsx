import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";
import Hobbies from "@/components/Hobbies";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Experience />
      <Hobbies />
      <Footer />
    </div>
  );
};

export default Index;
