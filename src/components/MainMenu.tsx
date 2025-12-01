import React from 'react';

const MainMenu = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
    const modules = [
        { id: 'queryprofile', title: 'Query Profile Analyzer', desc: 'Skew, Spilling, ASOF Joins', icon: '📈', color: 'red', status: 'ready' },
        { id: 'concurrency', title: 'Concurrency & ACID', desc: 'MVCC, Locking, Deadlocks', icon: '🔒', color: 'violet', status: 'ready' },
        { id: 'scd', title: 'SCD Types 1, 2, 3', desc: 'Slowly Changing Dimensions', icon: '🕰️', color: 'orange', status: 'ready' },
        { id: 'cte', title: 'Recursive CTEs', desc: 'BOM Hierarchy Explosion', icon: '🔄', color: 'orange', status: 'ready' },
        { id: 'modeling', title: 'Data Modeling', desc: 'OBT, Bridge Tables, Star', icon: '🗃️', color: 'purple', status: 'ready' },
        { id: 'indexing', title: 'Indexing Strategy', desc: 'B-Tree & Clustered', icon: '📊', color: 'green', status: 'ready' },
        { id: 'pruning', title: 'Pruning & Partitions', desc: 'Zone Maps & Pruning', icon: '❄️', color: 'blue', status: 'ready' },
        { id: 'joins', title: 'SQL Joins', desc: 'Trick Questions & NULLs', icon: '🔗', color: 'cyan', status: 'ready' },
        { id: 'window', title: 'Window Functions', desc: 'RANK, ROW_NUMBER, LEAD', icon: '🏏', color: 'yellow', status: 'ready' },
        { id: 'case', title: 'NULL Handling', desc: 'NVL, COALESCE, Traps', icon: '👻', color: 'pink', status: 'ready' },
        { id: 'recon', title: 'Streams & Tasks', desc: 'CDC & Incremental Loading', icon: '🌊', color: 'teal', status: 'ready' },
        { id: 'cost', title: 'Cloud Cost & FinOps', desc: 'Credits, Storage & Compute', icon: '💰', color: 'emerald', status: 'ready' },
    ];

    const colorClasses: Record<string, { border: string; shadow: string; text: string; bg: string }> = {
        red: { border: 'hover:border-red-500/50', shadow: 'hover:shadow-red-500/10', text: 'text-red-400', bg: 'bg-red-500/20' },
        violet: { border: 'hover:border-violet-500/50', shadow: 'hover:shadow-violet-500/10', text: 'text-violet-400', bg: 'bg-violet-500/20' },
        orange: { border: 'hover:border-orange-500/50', shadow: 'hover:shadow-orange-500/10', text: 'text-orange-400', bg: 'bg-orange-500/20' },
        purple: { border: 'hover:border-purple-500/50', shadow: 'hover:shadow-purple-500/10', text: 'text-purple-400', bg: 'bg-purple-500/20' },
        green: { border: 'hover:border-green-500/50', shadow: 'hover:shadow-green-500/10', text: 'text-green-400', bg: 'bg-green-500/20' },
        blue: { border: 'hover:border-blue-500/50', shadow: 'hover:shadow-blue-500/10', text: 'text-blue-400', bg: 'bg-blue-500/20' },
        cyan: { border: 'hover:border-cyan-500/50', shadow: 'hover:shadow-cyan-500/10', text: 'text-cyan-400', bg: 'bg-cyan-500/20' },
        yellow: { border: 'hover:border-yellow-500/50', shadow: 'hover:shadow-yellow-500/10', text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
        pink: { border: 'hover:border-pink-500/50', shadow: 'hover:shadow-pink-500/10', text: 'text-pink-400', bg: 'bg-pink-500/20' },
        teal: { border: 'hover:border-teal-500/50', shadow: 'hover:shadow-teal-500/10', text: 'text-teal-400', bg: 'bg-teal-500/20' },
        emerald: { border: 'hover:border-emerald-500/50', shadow: 'hover:shadow-emerald-500/10', text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
            {/* Header */}
            <div className="text-center mb-12 animate-slide">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-lg shadow-cyan-500/30">
                    <span className="text-4xl">❄️</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">Snowflake Data Architect Hub</h1>
                <p className="text-slate-400 text-lg">Interactive SQL & Data Engineering Simulators</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <span className="px-3 py-1 bg-slate-800 rounded-full">12 Modules</span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full">Interview Prep</span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full">Step-by-Step</span>
                </div>
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full">
                {modules.map((mod, idx) => {
                    const colors = colorClasses[mod.color];
                    return (
                        <button
                            key={mod.id}
                            onClick={() => onNavigate(mod.id)}
                            className={`relative group bg-slate-900 hover:bg-slate-800 border border-slate-800 ${colors.border} rounded-xl p-5 text-left transition-all duration-300 hover:shadow-lg ${colors.shadow} animate-slide`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {mod.status === 'ready' && (
                                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                                    READY
                                </span>
                            )}
                            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl mb-4`}>
                                {mod.icon}
                            </div>
                            <h3 className="text-white font-bold mb-1">{mod.title}</h3>
                            <p className="text-slate-500 text-sm">{mod.desc}</p>
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-slate-600 text-sm">
                <p>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-400 mono text-xs">ESC</kbd> to return to menu from any simulator</p>
            </div>
        </div>
    );
};

export default MainMenu;
