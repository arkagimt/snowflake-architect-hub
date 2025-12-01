import React, { useState, useEffect } from 'react';
import OBTVisualizer from './OBTVisualizer';
import BridgeTableVisualizer from './BridgeTableVisualizer';
import DBTLayersViz from './DBTLayersViz';
import SnowflakePatternsViz from './SnowflakePatternsViz';

const ModelingSimulator = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'obt' | 'bridge' | 'dbt' | 'snowflake'>('obt');

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                        🗃️
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Data Modeling Simulator
                        </h1>
                        <p className="text-xs text-slate-500">OBT • Bridge Tables • DBT Layers • Snowflake Patterns</p>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
                <div className="flex gap-2 justify-center">
                    {[
                        { id: 'obt', label: 'OBT vs Star Schema', icon: '⭐' },
                        { id: 'bridge', label: 'Bridge Tables (M:M)', icon: '🌉' },
                        { id: 'dbt', label: 'DBT Layers', icon: '🔶' },
                        { id: 'snowflake', label: 'Snowflake Patterns', icon: '❄️' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'obt' && <OBTVisualizer />}
                {activeTab === 'bridge' && <BridgeTableVisualizer />}
                {activeTab === 'dbt' && <DBTLayersViz />}
                {activeTab === 'snowflake' && <SnowflakePatternsViz />}
            </div>
        </div>
    );
};

export default ModelingSimulator;
