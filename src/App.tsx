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

function App() {
  const [currentView, setCurrentView] = useState<string>('menu');

  // Tailwind CDN - In a real Vite app, this should be handled by index.html or imported CSS
  // But keeping it here for compatibility if needed, though we should prefer index.css
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

export default App;
