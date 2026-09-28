import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Journey from "@/components/Journey";
import Experience from "@/components/Experience";
import Testimonials from "@/components/Testimonials";
import Hobbies from "@/components/Hobbies";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navigation />
    <main>
      <Hero />
      <Journey />
      <Experience />
      <Testimonials />
      <Hobbies />
    </main>
    <Footer />
  </div>
);

export default Index;
