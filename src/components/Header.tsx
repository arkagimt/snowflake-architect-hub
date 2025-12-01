import React from 'react';

const Header = ({ title, subtitle, icon, color, onBack }: {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    onBack: () => void;
}) => {
    const colorMap: Record<string, string> = {
        orange: 'bg-orange-500/20',
        purple: 'bg-purple-500/20',
        green: 'bg-green-500/20',
        blue: 'bg-blue-500/20',
        cyan: 'bg-cyan-500/20',
        yellow: 'bg-yellow-500/20',
        pink: 'bg-pink-500/20',
        teal: 'bg-teal-500/20',
    };

    return (
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                    ← Back
                </button>
                <div className={`w-10 h-10 rounded-xl ${colorMap[color] || 'bg-slate-800'} flex items-center justify-center text-xl`}>
                    {icon}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">{title}</h1>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
            </div>
            <div className="text-xs text-slate-600">Press ESC to return</div>
        </header>
    );
};

export default Header;
