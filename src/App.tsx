import React, { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import CTESimulator from './components/CTESimulator';
import ModelingSimulator from './components/ModelingSimulator';
import IndexingSimulator from './components/IndexingSimulator';
import PruningSimulator from './components/PruningSimulator';
import JoinsSimulator from './components/JoinsSimulator';
import WindowSimulator from './components/WindowSimulator';
import CaseSimulator from './components/CaseSimulator';
import ReconSimulator from './components/ReconSimulator';
import CostSimulator from './components/CostSimulator';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('menu');

  // Tailwind CDN
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.src = "https://cdn.tailwindcss.com";
      script.id = "tailwind-cdn";
      document.head.appendChild(script);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCurrentView('menu');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const goBack = () => setCurrentView('menu');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          min-height: 100vh;
          background: #020617;
        }
        body { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide { animation: slideIn 0.3s ease-out; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        .pulse-glow { animation: pulse-glow 2s infinite; }
      `}</style>

      {currentView === 'menu' && <MainMenu onNavigate={setCurrentView} />}
      {currentView === 'cte' && <CTESimulator onBack={goBack} />}
      {currentView === 'modeling' && <ModelingSimulator onBack={goBack} />}
      {currentView === 'indexing' && <IndexingSimulator onBack={goBack} />}
      {currentView === 'pruning' && <PruningSimulator onBack={goBack} />}
      {currentView === 'joins' && <JoinsSimulator onBack={goBack} />}
      {currentView === 'window' && <WindowSimulator onBack={goBack} />}
      {currentView === 'case' && <CaseSimulator onBack={goBack} />}
      {currentView === 'recon' && <ReconSimulator onBack={goBack} />}
      {currentView === 'cost' && <CostSimulator onBack={goBack} />}
    </>
  );
}
