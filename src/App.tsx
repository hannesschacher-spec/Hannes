import BackgroundFX from "./components/BackgroundFX";
import CursorGlow from "./components/CursorGlow";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Services from "./components/Services";
import Process from "./components/Process";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <BackgroundFX />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Services />
        <Process />
        <Features />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
