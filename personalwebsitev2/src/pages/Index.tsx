import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import Hobbies from "@/components/Hobbies";

const SectionDivider = ({ from, to }: { from: string; to: string }) => (
  <div
    className="h-20 pointer-events-none"
    style={{
      background: `linear-gradient(to bottom, ${from}, ${to})`,
    }}
  />
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <SectionDivider from="transparent" to="hsl(var(--section-bg))" />
      <Experience />
      <Testimonials />
      <Hobbies />
      <Footer />
    </div>
  );
};

export default Index;
