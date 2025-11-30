import React, { useState, useEffect } from 'react';

const CostSimulator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'snowflake' | 'matillion' | 'powerbi'>('snowflake');

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const tabs = [
        { id: 'snowflake', label: 'Snowflake Compute', icon: '❄️', desc: 'WH vs Serverless' },
        { id: 'matillion', label: 'Matillion ETL', icon: '🏗️', desc: 'Self-Hosted vs SaaS' },
        { id: 'powerbi', label: 'Power BI Modes', icon: '📊', desc: 'Import vs DirectQuery' },
    ];

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl">
                        💰
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                            FinOps & Cloud Cost Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Cost-Optimized Architecture • Interview Ready</p>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
                <div className="flex gap-2 justify-center">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-3 rounded-xl text-sm font-semibold transition flex flex-col items-center gap-1 ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className="text-[10px] opacity-70">{tab.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {activeTab === 'snowflake' && <SnowflakeComputeTab />}
                    {activeTab === 'matillion' && <MatillionCostTab />}
                    {activeTab === 'powerbi' && <PowerBICostTab />}
                </div>
            </div>
        </div>
    );
};

// ============================================
// Tab 1: Snowflake Compute Scenarios
// ============================================
const SnowflakeComputeTab = () => {
    const [scenario, setScenario] = useState<'adhoc' | 'sp' | 'snowpipe' | 'tasks'>('adhoc');
    const [isRunning, setIsRunning] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const [cost, setCost] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [warehouseSize, setWarehouseSize] = useState(2);
    const [autoSuspend, setAutoSuspend] = useState(60);

    const scenarios = [
        { id: 'adhoc', name: 'Ad-hoc Query', icon: '🔍', compute: 'User-Managed WH', billing: 'Min 60s, then per-second', risk: 'Idle Time Cost' },
        { id: 'sp', name: 'Stored Procedure', icon: '⚙️', compute: 'Caller\'s WH', billing: 'WH locked during SP', risk: 'Long-running loops' },
        { id: 'snowpipe', name: 'Snowpipe', icon: '🚿', compute: 'Serverless (1.25x)', billing: 'Per file/size', risk: 'None - No idle cost!' },
        { id: 'tasks', name: 'Tasks & Streams', icon: '⏱', compute: 'Serverless OR WH', billing: 'Per execution', risk: 'Depends on mode' },
    ];

    const currentScenario = scenarios.find(s => s.id === scenario)!;
    const isServerless = scenario === 'snowpipe' || scenario === 'tasks';
    const effectiveRate = isServerless ? warehouseSize * 1.25 : warehouseSize;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning || isIdle) {
            interval = setInterval(() => {
                if (!isServerless || isRunning) {
                    setCost(prev => prev + effectiveRate / 3600);
                }
                if (isIdle) {
                    setElapsedTime(prev => {
                        if (prev <= 1) {
                            setIsIdle(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                } else if (isRunning) {
                    setElapsedTime(prev => prev + 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, isIdle, effectiveRate, isServerless]);

    const runQuery = () => {
        setIsRunning(true);
        setCost(0);
        setElapsedTime(0);

        const duration = scenario === 'sp' ? 8 : scenario === 'snowpipe' ? 2 : 5;

        setTimeout(() => {
            setIsRunning(false);
            if (!isServerless) {
                setIsIdle(true);
                setElapsedTime(autoSuspend);
            }
        }, duration * 1000);
    };

    const reset = () => {
        setCost(0);
        setElapsedTime(0);
        setIsRunning(false);
        setIsIdle(false);
    };

    return (
        <div>
            {/* Scenario Selector */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {scenarios.map(s => (
                    <button
                        key={s.id}
                        onClick={() => { setScenario(s.id as any); reset(); }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${scenario === s.id
                            ? 'border-cyan-500 bg-cyan-900/20 shadow-lg shadow-cyan-500/20'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                            }`}
                    >
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className="font-bold text-white text-sm">{s.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{s.compute}</div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Left: Simulation */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        {currentScenario.icon} {currentScenario.name} Simulation
                    </h3>

                    {/* Warehouse Control (for non-serverless) */}
                    {!isServerless && (
                        <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Warehouse Size</span>
                                <span className="text-cyan-400">${warehouseSize}/hr</span>
                            </div>
                            <input
                                type="range" min="2" max="256" step="2"
                                value={warehouseSize}
                                onChange={(e) => setWarehouseSize(Number(e.target.value))}
                                className="w-full"
                                disabled={isRunning || isIdle}
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span>Auto-Suspend: {autoSuspend}s</span>
                                <input
                                    type="number"
                                    value={autoSuspend}
                                    onChange={(e) => setAutoSuspend(Number(e.target.value))}
                                    className="w-16 bg-slate-700 rounded px-2 text-right"
                                    disabled={isRunning || isIdle}
                                />
                            </div>
                        </div>
                    )}

                    {/* Serverless Badge */}
                    {isServerless && (
                        <div className="mb-4 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">⬇</span>
                                <div>
                                    <div className="text-cyan-400 font-bold">Serverless Compute</div>
                                    <div className="text-xs text-slate-400">1.25x rate, but ZERO idle cost!</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Display */}
                    <div className={`p-6 rounded-xl text-center border-2 mb-4 transition-all ${isRunning ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-500/20' :
                        isIdle ? 'border-red-500 bg-red-900/20 animate-pulse' :
                            'border-slate-700 bg-slate-800'
                        }`}>
                        <div className="text-5xl mb-2">
                            {isRunning ? '⬇' : isIdle ? '💸' : '💤'}
                        </div>
                        <div className={`text-xl font-bold ${isRunning ? 'text-green-400' : isIdle ? 'text-red-400' : 'text-slate-400'
                            }`}>
                            {isRunning ? 'PROCESSING' : isIdle ? '🔴 IDLE BILLING (WASTE!)' : 'SUSPENDED ($0)'}
                        </div>
                        <div className="text-sm font-mono mt-2 text-slate-400">
                            {isIdle ? `Auto-suspend in: ${elapsedTime}s` : isRunning ? `Running: ${elapsedTime}s` : 'Ready'}
                        </div>
                    </div>

                    {/* Cost Display */}
                    <div className="p-4 bg-slate-800 rounded-lg mb-4 text-center">
                        <div className="text-xs text-slate-500 uppercase">Total Cost</div>
                        <div className={`text-4xl font-bold font-mono ${cost > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ${cost.toFixed(4)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Rate: ${effectiveRate.toFixed(2)}/hr {isServerless && '(Serverless 1.25x)'}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        <button
                            onClick={runQuery}
                            disabled={isRunning || isIdle}
                            className={`flex-1 py-3 rounded-lg font-bold text-white transition ${isRunning || isIdle ? 'bg-slate-700 opacity-50' : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                        >
                            {isRunning ? '⚙️ Running...' : isIdle ? '💸 Billing...' : `▶ Run ${currentScenario.name}`}
                        </button>
                        <button onClick={reset} className="px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">↺</button>
                    </div>
                </div>

                {/* Right: Scenario Details */}
                <div className="space-y-4">
                    {/* Scenario Info Card */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                        <h4 className="text-white font-bold mb-4">📑 {currentScenario.name} Details</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Compute:</span>
                                <span className={`font-bold ${isServerless ? 'text-cyan-400' : 'text-orange-400'}`}>
                                    {currentScenario.compute}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Billing:</span>
                                <span className="text-white">{currentScenario.billing}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Risk:</span>
                                <span className={isServerless ? 'text-green-400' : 'text-red-400'}>
                                    {currentScenario.risk}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scenario-specific tips */}
                    {scenario === 'adhoc' && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                            <h4 className="text-yellow-400 font-bold mb-2">⚠️ Ad-hoc Query Risk</h4>
                            <p className="text-xs text-slate-300">
                                Warehouse stays ON after query finishes until Auto-Suspend kicks in.
                                <strong className="text-yellow-400"> Set Auto-Suspend to 60s</strong> for ad-hoc warehouses!
                            </p>
                        </div>
                    )}

                    {scenario === 'sp' && (
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                            <h4 className="text-orange-400 font-bold mb-2">⚙️ SP Cost Trap</h4>
                            <p className="text-xs text-slate-300">
                                SP locks the Warehouse - it can't suspend during execution!
                                <strong className="text-orange-400"> CALLER'S RIGHTS vs OWNER'S RIGHTS</strong> determines whose quota is charged.
                            </p>
                        </div>
                    )}

                    {scenario === 'snowpipe' && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                            <h4 className="text-green-400 font-bold mb-2">✅ Snowpipe Advantage</h4>
                            <p className="text-xs text-slate-300">
                                <strong>No Warehouse needed!</strong> Snowflake manages compute.
                                1.25x rate but <strong className="text-green-400">ZERO idle cost</strong> - file loaded = billing stops!
                            </p>
                        </div>
                    )}

                    {scenario === 'tasks' && (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                            <h4 className="text-purple-400 font-bold mb-2">⏱ Tasks: Choose Wisely</h4>
                            <p className="text-xs text-slate-300">
                                <strong>Serverless Tasks:</strong> Best for simple SQL, fast scale up/down.<br />
                                <strong>User-Managed WH:</strong> For heavy transformations where you need control.
                            </p>
                        </div>
                    )}

                    {/* Interview Answer */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h4 className="text-blue-400 font-bold mb-2">🎉 Interview Answer</h4>
                        <p className="text-xs text-slate-300 italic">
                            {scenario === 'adhoc' && '"For ad-hoc queries, I set Auto-Suspend to 60s to prevent zombie billing. Minimum billing is 60 seconds, then per-second."'}
                            {scenario === 'sp' && '"For SPs, I consider CALLER vs OWNER rights - it determines whose credit quota is charged. Complex loops can lock the warehouse."'}
                            {scenario === 'snowpipe' && '"Snowpipe is serverless - 1.25x rate but zero idle cost. Perfect for continuous/streaming data loads."'}
                            {scenario === 'tasks' && '"For small batch jobs I use Serverless Tasks. For heavy transformations, User-Managed WH gives me control."'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Verdict Card */}
            <div className="mt-6 p-5 bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-xl">
                <h4 className="text-emerald-400 font-bold mb-2">📍 One-Line Verdict (Interview Ready)</h4>
                <p className="text-sm text-slate-300">
                    "For <strong className="text-cyan-400">continuous/small batch data</strong> → Snowpipe/Serverless Task (no idle cost).
                    For <strong className="text-orange-400">heavy transformation/complex logic</strong> → Standard Warehouse/SP (more control)."
                </p>
            </div>
        </div>
    );
};

// ============================================
// Tab 2: Matillion Self-Hosted vs SaaS (DPC)
// ============================================
const MatillionCostTab = () => {
    const [mode, setMode] = useState<'self-hosted' | 'saas'>('self-hosted');
    const [isRunning, setIsRunning] = useState(false);
    const [cost, setCost] = useState(0);
    const [hours, setHours] = useState(0);
    const [showNightWarning, setShowNightWarning] = useState(false);
    const [instanceForgotten, setInstanceForgotten] = useState(false);

    const selfHostedRate = 0.50; // EC2 cost
    const matillionLicense = 0.30; // License per hour
    const saasRate = 2.00; // DPC per pipeline minute

    // Self-hosted always ticks (EC2 always on)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (mode === 'self-hosted') {
            interval = setInterval(() => {
                setCost(prev => prev + (selfHostedRate + matillionLicense) / 3600);
                setHours(prev => {
                    const newHours = prev + 1 / 3600;
                    if (newHours >= 8 && !showNightWarning) {
                        setShowNightWarning(true);
                        setInstanceForgotten(true);
                    }
                    return newHours;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [mode, showNightWarning]);

    // SaaS only when running
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (mode === 'saas' && isRunning) {
            interval = setInterval(() => {
                setCost(prev => prev + saasRate / 3600);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [mode, isRunning]);

    const runPipeline = () => {
        setIsRunning(true);
        setTimeout(() => setIsRunning(false), 5000);
    };

    const reset = () => {
        setCost(0);
        setHours(0);
        setShowNightWarning(false);
        setInstanceForgotten(false);
        setIsRunning(false);
    };

    return (
        <div>
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => { setMode('self-hosted'); reset(); }}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${mode === 'self-hosted'
                        ? 'border-orange-500 bg-orange-900/20 shadow-lg shadow-orange-500/20'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🖥️</span>
                        <div>
                            <div className="font-bold text-white">Self-Hosted (EC2)</div>
                            <div className="text-xs text-slate-500">Matillion ETL on your VM</div>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                        <div>• EC2: ${selfHostedRate}/hr (always on)</div>
                        <div>• License: ${matillionLicense}/hr</div>
                        <div className="text-red-400">• Risk: Forgot to stop = $$$</div>
                    </div>
                </button>

                <button
                    onClick={() => { setMode('saas'); reset(); }}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${mode === 'saas'
                        ? 'border-cyan-500 bg-cyan-900/20 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">☁️</span>
                        <div>
                            <div className="font-bold text-white">SaaS (DPC)</div>
                            <div className="text-xs text-slate-500">Data Productivity Cloud</div>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                        <div>• Pay-per-use: ${saasRate}/hr (only when running)</div>
                        <div className="text-green-400">• Idle = $0 (True Cloud Native!)</div>
                        <div>• No infrastructure management</div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Left: Visualization */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                        {mode === 'self-hosted' ? '🖥️ EC2 Instance' : '☁️ SaaS Platform'}
                    </h3>

                    {/* Server Visual */}
                    <div className={`relative h-48 rounded-xl border-2 flex items-center justify-center mb-4 transition-all ${mode === 'self-hosted'
                        ? 'border-orange-500 bg-orange-900/20'
                        : isRunning
                            ? 'border-cyan-500 bg-cyan-900/20'
                            : 'border-slate-600 bg-slate-800'
                        }`}>
                        <div className="text-center">
                            <div className="text-6xl mb-2">{mode === 'self-hosted' ? '🖥️' : '☁️'}</div>
                            <div className={`font-bold ${mode === 'self-hosted' ? 'text-orange-400' :
                                isRunning ? 'text-cyan-400' : 'text-slate-500'
                                }`}>
                                {mode === 'self-hosted' ? 'ALWAYS ON' : isRunning ? 'PROCESSING' : 'SLEEPING'}
                            </div>
                        </div>

                        {/* Status Light */}
                        <div className={`absolute top-4 right-4 w-4 h-4 rounded-full ${mode === 'self-hosted' ? 'bg-green-500 animate-pulse' :
                            isRunning ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'
                            }`} />

                        {/* Money Drain */}
                        {(mode === 'self-hosted' || isRunning) && (
                            <div className="absolute bottom-4 right-4 text-red-400 animate-pulse text-sm">
                                💸 ${((mode === 'self-hosted' ? selfHostedRate + matillionLicense : saasRate) / 3600).toFixed(4)}/s
                            </div>
                        )}
                    </div>

                    {/* Cost Display */}
                    <div className="p-4 bg-slate-800 rounded-lg mb-4 text-center">
                        <div className="text-xs text-slate-500 uppercase">Total Cost</div>
                        <div className={`text-4xl font-bold font-mono ${cost > 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ${cost.toFixed(4)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {mode === 'self-hosted' ? `Running: ${(hours * 60).toFixed(0)} minutes` : isRunning ? 'Pipeline active' : 'Idle = $0'}
                        </div>
                    </div>

                    {/* SaaS Run Button */}
                    {mode === 'saas' && (
                        <button
                            onClick={runPipeline}
                            disabled={isRunning}
                            className={`w-full py-3 rounded-lg font-bold text-white transition ${isRunning ? 'bg-cyan-600 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'
                                }`}
                        >
                            {isRunning ? '⚙️ Pipeline Running...' : '▶ Run Pipeline (5s job)'}
                        </button>
                    )}
                </div>

                {/* Right: Details & Warnings */}
                <div className="space-y-4">
                    {/* Night Warning */}
                    {mode === 'self-hosted' && showNightWarning && (
                        <div className="p-4 bg-red-900/30 border-2 border-red-500 rounded-xl animate-pulse">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">😱</span>
                                <div>
                                    <div className="text-red-400 font-bold text-lg">Forgot to shut down!</div>
                                    <div className="text-sm text-slate-300">
                                        8+ hours idle = <span className="text-red-400 font-bold">${(8 * (selfHostedRate + matillionLicense)).toFixed(2)}</span> wasted!
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Monthly waste: ${(30 * 12 * (selfHostedRate + matillionLicense)).toFixed(0)} (12hr nights × 30 days)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparison Table */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                        <h4 className="text-white font-bold mb-3">📊 Cost Comparison (Monthly)</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 rounded bg-orange-900/20">
                                <span className="text-orange-400">Self-Hosted (24/7)</span>
                                <span className="font-bold text-orange-400">${((selfHostedRate + matillionLicense) * 24 * 30).toFixed(0)}/mo</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-yellow-900/20">
                                <span className="text-yellow-400">Self-Hosted (12hr/day)</span>
                                <span className="font-bold text-yellow-400">${((selfHostedRate + matillionLicense) * 12 * 30).toFixed(0)}/mo</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-green-900/20">
                                <span className="text-green-400">SaaS (4hr jobs/day)</span>
                                <span className="font-bold text-green-400">${(saasRate * 4 * 30).toFixed(0)}/mo</span>
                            </div>
                        </div>
                    </div>

                    {/* Interview Answer */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h4 className="text-blue-400 font-bold mb-2">🎉 Interview Answer</h4>
                        <p className="text-xs text-slate-300 italic">
                            "Legacy systems used Self-hosted where we had to schedule Instance on/off.
                            Modern architecture prefers <strong className="text-cyan-400">SaaS (DPC)</strong> because it's
                            <strong className="text-green-400"> consumption-based billing</strong> - True Cloud Native with zero idle cost."
                        </p>
                    </div>

                    {/* Key Insight */}
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                        <h4 className="text-emerald-400 font-bold mb-2">💡 When to Use What?</h4>
                        <div className="text-xs text-slate-300 space-y-1">
                            <div><strong className="text-orange-400">Self-Hosted:</strong> Heavy ETL, 8+ hrs/day, need full control</div>
                            <div><strong className="text-cyan-400">SaaS (DPC):</strong> Sporadic jobs, &lt;4 hrs/day, FinOps priority</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Tab 3: Power BI Import vs DirectQuery
// ============================================
const PowerBICostTab = () => {
    const [mode, setMode] = useState<'import' | 'directquery' | 'composite'>('import');
    const [userClicks, setUserClicks] = useState(0);
    const [snowflakeCost, setSnowflakeCost] = useState(0);
    const [showLaserBeam, setShowLaserBeam] = useState(false);
    const [warehouseActive, setWarehouseActive] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    const warehouseRate = 4; // $/hr
    const queryDuration = 2; // seconds per query

    const simulateUserClicks = (count: number) => {
        setUserClicks(prev => prev + count);

        if (mode === 'directquery' || mode === 'composite') {
            setShowLaserBeam(true);
            setWarehouseActive(true);

            // Each click = a query to Snowflake
            const queryCost = (warehouseRate / 3600) * queryDuration * count;
            setSnowflakeCost(prev => prev + queryCost);

            setTimeout(() => setShowLaserBeam(false), 1000);
            setTimeout(() => setWarehouseActive(false), 3000);
        }
        // Import mode: clicks are FREE (VertiPaq handles it)
    };

    const runRefresh = () => {
        setRefreshCount(prev => prev + 1);
        const refreshCost = (warehouseRate / 3600) * 30; // 30 seconds to refresh
        setSnowflakeCost(prev => prev + refreshCost);
        setWarehouseActive(true);
        setTimeout(() => setWarehouseActive(false), 2000);
    };

    const reset = () => {
        setUserClicks(0);
        setSnowflakeCost(0);
        setRefreshCount(0);
        setWarehouseActive(false);
    };

    const modes = [
        { id: 'import', name: 'Import Mode', icon: '📄', engine: 'VertiPaq (PBI)', sfCost: 'Refresh only' },
        { id: 'directquery', name: 'DirectQuery', icon: '⬇', engine: 'Snowflake WH', sfCost: 'Every click!' },
        { id: 'composite', name: 'Composite', icon: '🔱', engine: 'Both', sfCost: 'DQ tables only' },
    ];

    const currentMode = modes.find(m => m.id === mode)!;

    return (
        <div>
            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {modes.map(m => (
                    <button
                        key={m.id}
                        onClick={() => { setMode(m.id as any); reset(); }}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${mode === m.id
                            ? m.id === 'import' ? 'border-green-500 bg-green-900/20' :
                                m.id === 'directquery' ? 'border-red-500 bg-red-900/20' :
                                    'border-purple-500 bg-purple-900/20'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                            }`}
                    >
                        <div className="text-3xl mb-2">{m.icon}</div>
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-xs text-slate-400 mt-1">Engine: {m.engine}</div>
                        <div className={`text-xs mt-1 ${m.id === 'import' ? 'text-green-400' : 'text-red-400'}`}>
                            SF Cost: {m.sfCost}
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Left: Architecture Visual */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">🏃 Architecture Flow</h3>

                    <div className="relative h-64 bg-slate-950 rounded-xl border border-slate-800 p-4">
                        {/* User */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-center">
                            <div className="text-4xl mb-1">👤</div>
                            <div className="text-xs text-slate-500">Users</div>
                            <div className="text-xs text-cyan-400 font-bold">{userClicks} clicks</div>
                        </div>

                        {/* Laser Beam */}
                        {showLaserBeam && (
                            <div className="absolute left-24 right-24 top-1/2 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse rounded shadow-lg shadow-red-500/50" />
                        )}

                        {/* Power BI VertiPaq */}
                        <div className={`absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 p-4 rounded-xl border-2 transition-all ${mode === 'import' || mode === 'composite'
                            ? 'border-green-500 bg-green-900/30 shadow-lg shadow-green-500/20'
                            : 'border-slate-600 bg-slate-800 opacity-50'
                            }`}>
                            <div className="text-3xl text-center">📊</div>
                            <div className="text-xs font-bold text-green-400 mt-1">VertiPaq</div>
                            <div className="text-[10px] text-slate-400">In-Memory</div>
                            {(mode === 'import' || mode === 'composite') && (
                                <div className="text-[10px] text-green-400 mt-1">✓ FREE queries</div>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 text-2xl text-slate-600">
                            {mode === 'directquery' ? '⬇→' : mode === 'composite' ? '↔' : '→'}
                        </div>

                        {/* Snowflake */}
                        <div className={`absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-xl border-2 transition-all ${warehouseActive
                            ? 'border-red-500 bg-red-900/30 scale-110 shadow-lg shadow-red-500/30'
                            : mode === 'directquery' || mode === 'composite'
                                ? 'border-cyan-500 bg-cyan-900/30'
                                : 'border-slate-600 bg-slate-800 opacity-50'
                            }`}>
                            <div className="text-3xl text-center">❄️</div>
                            <div className={`text-xs font-bold mt-1 ${warehouseActive ? 'text-red-400' : 'text-cyan-400'}`}>
                                {warehouseActive ? '🔥 ACTIVE' : 'Warehouse'}
                            </div>
                            <div className="text-[10px] text-slate-400">${warehouseRate}/hr</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={() => simulateUserClicks(50)}
                            className={`py-3 rounded-lg font-bold text-white transition ${mode === 'import' ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'
                                }`}
                        >
                            🖱️ 50 User Clicks
                        </button>
                        {(mode === 'import' || mode === 'composite') && (
                            <button
                                onClick={runRefresh}
                                className="py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white"
                            >
                                🔄 Refresh Data
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Cost Analysis */}
                <div className="space-y-4">
                    {/* Cost Display */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                        <h4 className="text-white font-bold mb-3">💰 Snowflake Cost</h4>
                        <div className={`text-4xl font-bold font-mono text-center p-4 rounded-lg ${snowflakeCost > 0.5 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                            }`}>
                            ${snowflakeCost.toFixed(4)}
                        </div>
                        <div className="text-xs text-slate-500 text-center mt-2">
                            {userClicks} clicks • {refreshCount} refreshes
                        </div>
                    </div>

                    {/* Mode Explanation */}
                    <div className={`rounded-xl border p-4 ${mode === 'import' ? 'bg-green-900/20 border-green-500/30' :
                        mode === 'directquery' ? 'bg-red-900/20 border-red-500/30' :
                            'bg-purple-900/20 border-purple-500/30'
                        }`}>
                        <h4 className={`font-bold mb-2 ${mode === 'import' ? 'text-green-400' :
                            mode === 'directquery' ? 'text-red-400' : 'text-purple-400'
                            }`}>
                            {currentMode.icon} {currentMode.name} Explained
                        </h4>
                        <div className="text-xs text-slate-300">
                            {mode === 'import' && (
                                <>
                                    <p className="mb-2">Data is <strong>copied into Power BI's VertiPaq</strong> (in-memory compression).</p>
                                    <p className="text-green-400">✅ User clicks = FREE (local processing)</p>
                                    <p className="text-yellow-400">⚠️ Snowflake cost only during scheduled refresh</p>
                                </>
                            )}
                            {mode === 'directquery' && (
                                <>
                                    <p className="mb-2">Data stays in Snowflake. <strong>Every click = SQL query sent</strong>.</p>
                                    <p className="text-red-400">❌ 100 users × 10 clicks = 1000 queries to Snowflake!</p>
                                    <p className="text-red-400">❌ Warehouse wakes up constantly</p>
                                </>
                            )}
                            {mode === 'composite' && (
                                <>
                                    <p className="mb-2"><strong>Hybrid:</strong> Some tables Import, some DirectQuery.</p>
                                    <p className="text-green-400">✅ Aggregates in Import = fast & free</p>
                                    <p className="text-yellow-400">⚠️ Detail drill-through via DirectQuery</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Interview Answer */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h4 className="text-blue-400 font-bold mb-2">🎉 Interview Answer</h4>
                        <p className="text-xs text-slate-300 italic">
                            "Power BI has its own powerful <strong className="text-green-400">VertiPaq Engine</strong>.
                            To save cost, we prefer <strong className="text-green-400">Import Mode</strong>.
                            But for <strong className="text-cyan-400">TB+ data or real-time needs</strong>,
                            we use DirectQuery which increases Snowflake cost significantly."
                        </p>
                    </div>

                    {/* Cost Comparison */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                        <h4 className="text-white font-bold mb-2">📊 Daily Cost Estimate (100 users)</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between p-2 rounded bg-green-900/20">
                                <span className="text-green-400">Import (2 refreshes/day)</span>
                                <span className="font-bold text-green-400">~$0.50</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-red-900/20">
                                <span className="text-red-400">DirectQuery (avg usage)</span>
                                <span className="font-bold text-red-400">~$50-200</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-purple-900/20">
                                <span className="text-purple-400">Composite (balanced)</span>
                                <span className="font-bold text-purple-400">~$5-20</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostSimulator;
