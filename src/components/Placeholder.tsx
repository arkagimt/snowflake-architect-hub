import React from 'react';
import Header from './Header';

const Placeholder = ({ title, onBack, color, icon }: { title: string; onBack: () => void; color: string; icon: string }) => (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
        <Header title={title} subtitle="Coming Soon" icon={icon} color={color} onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">{icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-slate-500">This module will be implemented next</p>
            </div>
        </div>
    </div>
);

export default Placeholder;
