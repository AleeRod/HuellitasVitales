import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import SystemFeatures from '../components/SystemFeatures';
import MarketplacePromo from '../components/MarketplacePromo';
import PetPromo from '../components/PetPromo';
import CommercePromo from '../components/CommercePromo';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import './LandingPage.css';

const LandingPage = () => {
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const container = document.querySelector('.bg-mesh-container');
      if (container) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;

        container.style.setProperty('--mouse-x', `${x}%`);
        container.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-page">
      
      <div className="bg-mesh-container" aria-hidden="true">
        <div className="mesh-orb orb-mint-bright"></div>
        <div className="mesh-orb orb-amber-bright"></div>
        <div className="mesh-orb orb-pine-glow"></div>
        <div className="mesh-orb orb-neon-green"></div>
        
        {/* Orbe que sigue al cursor del usuario */}
        <div className="mesh-orb orb-interactive-cursor"></div>
      </div>

      <Navbar />
      
      <div id="inicio" style={{ position: 'relative', zIndex: 2 }}>
        <Hero />
      </div>
      
      <div id="servicios" style={{ position: 'relative', zIndex: 2 }}>
        <Services />
      </div>
      
      <div id="funciones" style={{ position: 'relative', zIndex: 2 }}>
        <SystemFeatures />
      </div>
      
      <div id="marketplace" style={{ position: 'relative', zIndex: 2 }}>
        <MarketplacePromo />
      </div>
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <PetPromo />
      </div>
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <CommercePromo />
      </div>
      
      <div id="contacto" style={{ position: 'relative', zIndex: 2 }}>
        <ContactSection />
      </div>
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;