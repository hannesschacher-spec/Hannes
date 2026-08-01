import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BackgroundFX from "./components/BackgroundFX";
import CursorGlow from "./components/CursorGlow";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Impressum from "./pages/Impressum";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BackgroundFX />
    <CursorGlow />
    <Navbar />
    <main>
      <Impressum />
    </main>
    <Footer />
  </StrictMode>,
);
