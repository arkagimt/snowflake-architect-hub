import React, { useState, useEffect } from 'react';

const CaseSimulator = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'nvl' | 'coalesce' | 'arithmetic' | 'aggregate'>('nvl');

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const tabs = [
        { id: 'nvl', label: 'NVL / IFNULL', icon: '🚦' },
        { id: 'coalesce', label: 'COALESCE', icon: '🎉' },
        { id: 'arithmetic', label: 'Arithmetic Trap', icon: '🦠' },
        { id: 'aggregate', label: 'Aggregate Scanner', icon: '📏' },
    ];

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl">
                        👻
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            NULL Handling Simulator
                        </h1>
                        <p className="text-xs text-slate-500">NVL • COALESCE • NULL Traps • Aggregates</p>
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
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
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
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'nvl' && <NVLDemo />}
                    {activeTab === 'coalesce' && <CoalesceDemo />}
                    {activeTab === 'arithmetic' && <ArithmeticTrapDemo />}
                    {activeTab === 'aggregate' && <AggregateTrapDemo />}
                </div>
            </div>
        </div>
    );
};

// ============================================
// NVL Demo - The Repair Machine (Conveyor Belt)
// ============================================
const NVLDemo = () => {
    const [inputValue, setInputValue] = useState<number | null>(50);
    const [defaultValue, setDefaultValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [boxPosition, setBoxPosition] = useState(0); // 0-100%
    const [showResult, setShowResult] = useState(false);
    const [isTransformed, setIsTransformed] = useState(false);

    const runAnimation = () => {
        setIsAnimating(true);
        setShowResult(false);
        setIsTransformed(false);
        setBoxPosition(0);

        // Animate box moving from left to right
        let pos = 0;
        const interval = setInterval(() => {
            pos += 2;
            setBoxPosition(pos);

            // At 50%, hit the NVL gate
            if (pos === 50 && inputValue === null) {
                setIsTransformed(true);
            }

            if (pos >= 100) {
                clearInterval(interval);
                setShowResult(true);
                setIsAnimating(false);
            }
        }, 30);
    };

    const result = inputValue ?? defaultValue;
    const isNull = inputValue === null;

    return (
        <div>
            {/* Concept */}
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-bold text-white mb-2">🚦 NVL - The Repair Machine</h3>
                <p className="text-sm text-slate-300">
                    NVL acts like a repair station on a conveyor belt. If a <strong className="text-red-400">Ghost (NULL)</strong> comes through,
                    it stamps a default value on it. If a <strong className="text-blue-400">real value</strong> comes through, it does nothing.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                <div className="flex items-center justify-center gap-8 mb-6">
                    {/* Input Value Control */}
                    <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Incoming Value</div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={isNull ? '' : inputValue!}
                                onChange={(e) => setInputValue(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Enter number"
                                className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-center font-mono text-blue-400"
                                disabled={isAnimating}
                            />
                            <button
                                onClick={() => setInputValue(null)}
                                disabled={isAnimating}
                                className={`px-4 py-2 rounded-lg font-bold transition ${isNull ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-red-900/50'
                                    }`}
                            >
                                👻 NULL
                            </button>
                        </div>
                    </div>

                    {/* Default Value Control */}
                    <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Default Value</div>
                        <input
                            type="number"
                            value={defaultValue}
                            onChange={(e) => setDefaultValue(parseInt(e.target.value) || 0)}
                            className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-center font-mono text-green-400"
                            disabled={isAnimating}
                        />
                    </div>

                    {/* Run Button */}
                    <button
                        onClick={runAnimation}
                        disabled={isAnimating}
                        className={`px-6 py-3 rounded-lg font-bold transition ${isAnimating ? 'bg-yellow-600 animate-pulse' : 'bg-green-600 hover:bg-green-500'
                            } text-white`}
                    >
                        {isAnimating ? '⚙️ Processing...' : '▶ Send Through NVL'}
                    </button>
                </div>

                {/* Conveyor Belt Visualization */}
                <div className="relative bg-slate-800 rounded-xl p-8">
                    {/* Conveyor Belt Track */}
                    <div className="relative h-24">
                        {/* Belt */}
                        <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-600 -translate-y-1/2 rounded-full">
                            {/* Belt pattern */}
                            <div className="absolute inset-0 flex items-center justify-around">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="w-1 h-full bg-slate-700" />
                                ))}
                            </div>
                        </div>

                        {/* NVL Gate */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className={`w-20 h-20 rounded-xl border-4 flex flex-col items-center justify-center transition-all ${isAnimating && boxPosition >= 45 && boxPosition <= 55 && isNull
                                ? 'bg-green-600 border-green-400 scale-110 shadow-lg shadow-green-500/50'
                                : 'bg-slate-700 border-slate-500'
                                }`}>
                                <span className="text-xl">🚦</span>
                                <span className="text-[10px] font-bold text-slate-300">NVL</span>
                                <span className="text-[8px] text-slate-500">default: {defaultValue}</span>
                            </div>
                            {/* Stamp animation */}
                            {isAnimating && boxPosition >= 48 && boxPosition <= 52 && isNull && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                                    🔨
                                </div>
                            )}
                        </div>

                        {/* Moving Box */}
                        {(isAnimating || showResult) && (
                            <div
                                className={`absolute top-1/2 -translate-y-1/2 w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg transition-all z-10 ${(isNull && !isTransformed)
                                    ? 'border-2 border-dashed border-red-500 bg-red-900/30 text-red-400'
                                    : 'border-2 border-solid border-blue-500 bg-blue-900/50 text-blue-400'
                                    }`}
                                style={{
                                    left: `calc(${boxPosition}% - 32px)`,
                                    transition: isAnimating ? 'none' : 'left 0.3s ease-out'
                                }}
                            >
                                {isNull && !isTransformed ? '👻' : (isTransformed ? defaultValue : inputValue)}
                                {isTransformed && (
                                    <span className="absolute -top-2 -right-2 text-xs bg-green-600 rounded-full px-1">✓</span>
                                )}
                            </div>
                        )}

                        {/* Start Label */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-xs text-slate-500">
                            IN
                        </div>

                        {/* End Label */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-xs text-slate-500">
                            OUT
                        </div>
                    </div>

                    {/* Result */}
                    {showResult && (
                        <div className="mt-6 text-center animate-slide">
                            <div className="inline-flex items-center gap-4 bg-slate-900 rounded-xl px-6 py-4 border border-slate-600">
                                <span className="text-slate-400">NVL(</span>
                                <span className={isNull ? 'text-red-400' : 'text-blue-400'}>
                                    {isNull ? 'NULL' : inputValue}
                                </span>
                                <span className="text-slate-400">,</span>
                                <span className="text-green-400">{defaultValue}</span>
                                <span className="text-slate-400">) =</span>
                                <span className="text-2xl font-bold text-cyan-400">{result}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Key Takeaway */}
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl text-center">
                    <span className="text-yellow-400 font-bold">💡 Key Takeaway:</span>
                    <span className="text-slate-300 ml-2">NVL only acts when it sees a Ghost (NULL). Otherwise, it sleeps.</span>
                </div>
            </div>

            {/* SQL Reference */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">SQL Syntax</div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 rounded-lg p-4">
                        <div className="text-xs text-cyan-400 mb-2">Snowflake / Oracle</div>
                        <pre className="text-sm text-slate-300 font-mono">NVL(column, 0)</pre>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-4">
                        <div className="text-xs text-cyan-400 mb-2">SQL Server / MySQL</div>
                        <pre className="text-sm text-slate-300 font-mono">ISNULL(column, 0)  -- SQL Server
                            IFNULL(column, 0)  -- MySQL</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// COALESCE Demo - The Layered Filter (Trapdoors)
// ============================================
const CoalesceDemo = () => {
    const [columns, setColumns] = useState([
        { id: 1, value: null as number | null, label: 'Col 1' },
        { id: 2, value: 200, label: 'Col 2' },
        { id: 3, value: 300, label: 'Col 3' },
    ]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [ballPosition, setBallPosition] = useState(-1); // -1 = top, 0-2 = at layer, 3 = bottom
    const [stoppedAt, setStoppedAt] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    const toggleColumn = (idx: number) => {
        if (isAnimating) return;
        setColumns(prev => prev.map((col, i) =>
            i === idx ? { ...col, value: col.value === null ? (idx + 1) * 100 : null } : col
        ));
        setShowResult(false);
        setStoppedAt(null);
    };

    const runAnimation = () => {
        setIsAnimating(true);
        setShowResult(false);
        setStoppedAt(null);
        setBallPosition(-1);

        let pos = -1;
        const checkNext = () => {
            pos++;
            setBallPosition(pos);

            if (pos <= 2) {
                // Check if this layer has a value
                setTimeout(() => {
                    if (columns[pos].value !== null) {
                        // Stop here!
                        setStoppedAt(pos);
                        setShowResult(true);
                        setIsAnimating(false);
                    } else {
                        // Fall through (trapdoor opens)
                        setTimeout(checkNext, 600);
                    }
                }, 400);
            } else {
                // Fell through all layers - NULL bucket
                setStoppedAt(null);
                setShowResult(true);
                setIsAnimating(false);
            }
        };

        setTimeout(checkNext, 300);
    };

    const result = columns.find(c => c.value !== null)?.value ?? null;

    return (
        <div>
            {/* Concept */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-bold text-white mb-2">🎉 COALESCE - The Layered Filter</h3>
                <p className="text-sm text-slate-300">
                    Imagine a ball dropping through layers. Each layer is a column. If the column is <strong className="text-red-400">NULL</strong>,
                    the trapdoor opens and the ball falls through. If it's a <strong className="text-green-400">value</strong>,
                    the trapdoor is closed and the ball stops there.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="text-sm text-slate-400">Toggle each column:</div>
                    {columns.map((col, idx) => (
                        <button
                            key={col.id}
                            onClick={() => toggleColumn(idx)}
                            disabled={isAnimating}
                            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${col.value !== null
                                ? 'bg-green-600 text-white border-2 border-green-400'
                                : 'bg-red-900/50 text-red-400 border-2 border-dashed border-red-500'
                                }`}
                        >
                            {col.value !== null ? col.value : '👻 NULL'}
                            <div className="text-xs opacity-70">{col.label}</div>
                        </button>
                    ))}
                    <button
                        onClick={runAnimation}
                        disabled={isAnimating}
                        className={`px-6 py-3 rounded-lg font-bold transition ${isAnimating ? 'bg-yellow-600 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'
                            } text-white`}
                    >
                        {isAnimating ? '⏳ Dropping...' : '🎱 Drop Ball'}
                    </button>
                </div>

                {/* Vertical Drop Visualization */}
                <div className="flex justify-center">
                    <div className="relative w-80">
                        {/* Drop Zone */}
                        <div className="flex flex-col items-center">
                            {/* Start Position */}
                            <div className="w-16 h-8 flex items-center justify-center text-slate-500 text-xs">
                                COALESCE(
                            </div>

                            {/* Ball */}
                            <div
                                className={`absolute w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold shadow-lg z-20 transition-all duration-500`}
                                style={{
                                    top: ballPosition === -1 ? '20px' :
                                        ballPosition === 0 ? '80px' :
                                            ballPosition === 1 ? '180px' :
                                                ballPosition === 2 ? '280px' : '380px',
                                    opacity: isAnimating || showResult ? 1 : 0,
                                    transform: stoppedAt !== null && ballPosition === stoppedAt ? 'scale(1.1)' : 'scale(1)'
                                }}
                            >
                                🎱
                            </div>

                            {/* Layers */}
                            {columns.map((col, idx) => {
                                const isTrapdoorOpen = ballPosition > idx || (isAnimating && ballPosition === idx && col.value === null);
                                const isCurrent = ballPosition === idx;
                                const isStopPoint = stoppedAt === idx;

                                return (
                                    <div key={col.id} className="relative my-4">
                                        {/* Layer Platform */}
                                        <div className={`relative w-48 h-16 rounded-xl border-2 flex items-center justify-center transition-all ${isStopPoint
                                            ? 'bg-green-900/50 border-green-500 shadow-lg shadow-green-500/30'
                                            : col.value !== null
                                                ? 'bg-slate-700 border-slate-500'
                                                : 'bg-red-900/30 border-red-500/50'
                                            }`}>
                                            {/* Trapdoor Animation */}
                                            <div className={`absolute inset-2 flex transition-all duration-300 ${isTrapdoorOpen ? 'gap-16' : 'gap-0'
                                                }`}>
                                                <div className={`flex-1 h-full rounded bg-slate-600 transition-all duration-300 ${isTrapdoorOpen ? 'rotate-[-30deg] origin-left' : ''
                                                    }`} />
                                                <div className={`flex-1 h-full rounded bg-slate-600 transition-all duration-300 ${isTrapdoorOpen ? 'rotate-[30deg] origin-right' : ''
                                                    }`} />
                                            </div>

                                            {/* Value Label */}
                                            <span className={`relative z-10 font-bold text-lg ${col.value !== null ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {col.value !== null ? col.value : '👻'}
                                            </span>

                                            {/* Layer Label */}
                                            <span className="absolute -left-16 text-xs text-slate-500">{col.label}</span>

                                            {/* Check/X Indicator */}
                                            {isCurrent && !isAnimating && showResult && (
                                                <span className={`absolute -right-8 text-xl ${col.value !== null ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {col.value !== null ? '✓' : '⬇'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* NULL Bucket */}
                            <div className={`w-48 h-16 mt-4 rounded-xl border-2 flex items-center justify-center transition-all ${stoppedAt === null && showResult
                                ? 'bg-red-900/50 border-red-500 shadow-lg shadow-red-500/30'
                                : 'bg-slate-800 border-slate-600 border-dashed'
                                }`}>
                                <span className="text-red-400 font-bold">NULL Bucket 🗑️</span>
                            </div>

                            {/* End */}
                            <div className="w-16 h-8 flex items-center justify-center text-slate-500 text-xs mt-2">
                                )
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result */}
                {showResult && (
                    <div className="mt-6 text-center animate-slide">
                        <div className="inline-flex items-center gap-4 bg-slate-800 rounded-xl px-6 py-4 border border-slate-600">
                            <span className="text-slate-400">COALESCE(</span>
                            {columns.map((col, idx) => (
                                <span key={col.id}>
                                    <span className={col.value !== null ? 'text-green-400' : 'text-red-400'}>
                                        {col.value !== null ? col.value : 'NULL'}
                                    </span>
                                    {idx < columns.length - 1 && <span className="text-slate-400">, </span>}
                                </span>
                            ))}
                            <span className="text-slate-400">) =</span>
                            <span className={`text-2xl font-bold ${result !== null ? 'text-cyan-400' : 'text-red-400'}`}>
                                {result !== null ? result : 'NULL'}
                            </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-2">
                            {result !== null
                                ? `✓ Stopped at ${columns.find(c => c.value !== null)?.label} (first non-NULL)`
                                : '✗ Fell through all layers - no value found!'}
                        </div>
                    </div>
                )}
            </div>

            {/* Real World Example */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Real-World Example</div>
                <pre className="bg-slate-950 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-x-auto">{`-- Get best available contact info
SELECT 
    customer_name,
    COALESCE(mobile_phone, home_phone, work_phone, 'No Phone') AS contact_phone,
    COALESCE(email, 'no-email@unknown.com') AS contact_email
FROM customers;`}</pre>
            </div>
        </div>
    );
};

// ============================================
// Arithmetic Trap Demo - The Virus
// ============================================
const ArithmeticTrapDemo = () => {
    const [isNull, setIsNull] = useState(false);
    const [showVirus, setShowVirus] = useState(false);

    const toggleValue = (makeNull: boolean) => {
        setIsNull(makeNull);
        if (makeNull) {
            setShowVirus(true);
            setTimeout(() => setShowVirus(false), 2000);
        }
    };

    return (
        <div>
            {/* Warning Box */}
            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-bold text-white mb-2">🦠 The Arithmetic Virus</h3>
                <p className="text-sm text-slate-300">
                    NULL is like a virus in arithmetic. <strong className="text-red-400">Any operation with NULL infects the entire result!</strong>
                    NULL + 10 = NULL, NULL × 5 = NULL, NULL / 2 = NULL.
                </p>
            </div>

            {/* Interactive Calculator */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 mb-6">
                <div className="text-center mb-8">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-4">Choose Your Input</div>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => toggleValue(false)}
                            className={`px-8 py-4 rounded-xl font-bold text-xl transition-all ${!isNull
                                ? 'bg-blue-600 text-white ring-4 ring-blue-400 scale-110'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                }`}
                        >
                            5
                        </button>
                        <button
                            onClick={() => toggleValue(true)}
                            className={`px-8 py-4 rounded-xl font-bold text-xl transition-all ${isNull
                                ? 'bg-red-600 text-white ring-4 ring-red-400 scale-110'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                }`}
                        >
                            👻 NULL
                        </button>
                    </div>
                </div>

                {/* Big Equation */}
                <div className="flex items-center justify-center gap-6 py-8">
                    {/* Input */}
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl transition-all ${isNull
                        ? 'bg-red-900/50 border-2 border-dashed border-red-500 text-red-400'
                        : 'bg-blue-900/50 border-2 border-blue-500 text-blue-400'
                        }`}>
                        {isNull ? '👻' : '5'}
                    </div>

                    {/* Plus */}
                    <div className="text-4xl text-yellow-400 font-bold relative">
                        +
                        {/* Virus eating the plus */}
                        {showVirus && (
                            <span className="absolute -top-4 -right-4 text-2xl animate-bounce">
                                🦠
                            </span>
                        )}
                    </div>

                    {/* Constant */}
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl transition-all ${isNull && showVirus
                        ? 'bg-red-900/50 border-2 border-dashed border-red-500 text-red-400 animate-pulse'
                        : 'bg-green-900/50 border-2 border-green-500 text-green-400'
                        }`}>
                        {isNull && showVirus ? '🦠' : '10'}
                    </div>

                    {/* Equals */}
                    <div className="text-4xl text-slate-400 font-bold">=</div>

                    {/* Result */}
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl transition-all ${isNull
                        ? 'bg-red-900/50 border-2 border-red-500 text-red-400 shadow-lg shadow-red-500/30'
                        : 'bg-cyan-900/50 border-2 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/30'
                        }`}>
                        {isNull ? '👻' : '15'}
                    </div>
                </div>

                {/* Explanation */}
                <div className={`text-center p-4 rounded-xl transition-all ${isNull ? 'bg-red-900/20 border border-red-500/30' : 'bg-green-900/20 border border-green-500/30'
                    }`}>
                    {isNull ? (
                        <div>
                            <div className="text-red-400 font-bold text-xl mb-2">🦠 INFECTED!</div>
                            <div className="text-slate-300">NULL + 10 = NULL (The virus spreads to everything!)</div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-green-400 font-bold text-xl mb-2">✓ HEALTHY</div>
                            <div className="text-slate-300">5 + 10 = 15 (Normal arithmetic)</div>
                        </div>
                    )}
                </div>
            </div>

            {/* The Cure */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                <div className="text-xs font-bold text-green-400 uppercase mb-2">💉 The Cure: Handle NULL First!</div>
                <pre className="bg-slate-950 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-x-auto">{`-- BAD: Returns NULL if quantity is NULL
SELECT price * quantity AS total FROM orders;

-- GOOD: Treat NULL quantity as 0
SELECT price * NVL(quantity, 0) AS total FROM orders;`}</pre>
            </div>
        </div>
    );
};

// ============================================
// Aggregate Scanner Demo
// ============================================
const AggregateTrapDemo = () => {
    const [dataBlocks] = useState([
        { id: 1, value: 10 as number | null },
        { id: 2, value: null },
        { id: 3, value: 20 },
        { id: 4, value: null },
        { id: 5, value: 30 },
    ]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanPosition, setScanPosition] = useState(-1);
    const [countResult, setCountResult] = useState<number | null>(null);
    const [countType, setCountType] = useState<'star' | 'col'>('col');
    const [flashState, setFlashState] = useState<'none' | 'green' | 'red'>('none');

    const runScan = (type: 'star' | 'col') => {
        setCountType(type);
        setIsScanning(true);
        setCountResult(null);
        setScanPosition(-1);
        setFlashState('none');

        let count = 0;
        let pos = -1;

        const scanNext = () => {
            pos++;
            setScanPosition(pos);

            if (pos < dataBlocks.length) {
                const block = dataBlocks[pos];
                const shouldCount = type === 'star' || block.value !== null;

                setTimeout(() => {
                    if (shouldCount) {
                        count++;
                        setFlashState('green');
                    } else {
                        setFlashState('red');
                    }
                    setCountResult(count);

                    setTimeout(() => {
                        setFlashState('none');
                        scanNext();
                    }, 400);
                }, 200);
            } else {
                setIsScanning(false);
            }
        };

        setTimeout(scanNext, 300);
    };

    return (
        <div>
            {/* Concept */}
            <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-bold text-white mb-2">📏 The Aggregate Scanner</h3>
                <p className="text-sm text-slate-300">
                    <strong className="text-yellow-400">COUNT(*)</strong> counts ALL rows including NULLs.
                    <strong className="text-cyan-400"> COUNT(column)</strong> only counts non-NULL values!
                </p>
            </div>

            {/* Scanner Visualization */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                {/* Controls */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => runScan('star')}
                        disabled={isScanning}
                        className={`px-6 py-3 rounded-lg font-bold transition ${isScanning && countType === 'star' ? 'bg-yellow-600 animate-pulse' : 'bg-yellow-600 hover:bg-yellow-500'
                            } text-white`}
                    >
                        Run COUNT(*)
                    </button>
                    <button
                        onClick={() => runScan('col')}
                        disabled={isScanning}
                        className={`px-6 py-3 rounded-lg font-bold transition ${isScanning && countType === 'col' ? 'bg-cyan-600 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'
                            } text-white`}
                    >
                        Run COUNT(column)
                    </button>
                </div>

                {/* Data Blocks */}
                <div className="flex justify-center gap-4 mb-8">
                    {dataBlocks.map((block, idx) => {
                        const isCurrentScan = scanPosition === idx;
                        const isScanned = scanPosition > idx;

                        return (
                            <div
                                key={block.id}
                                className={`relative w-20 h-20 rounded-xl flex items-center justify-center font-bold text-xl transition-all ${isCurrentScan
                                    ? flashState === 'green'
                                        ? 'bg-green-600 border-2 border-green-400 scale-110 shadow-lg shadow-green-500/50'
                                        : flashState === 'red'
                                            ? 'bg-red-600 border-2 border-red-400 scale-110 shadow-lg shadow-red-500/50 animate-shake'
                                            : 'bg-yellow-600 border-2 border-yellow-400 scale-110'
                                    : block.value === null
                                        ? 'bg-red-900/30 border-2 border-dashed border-red-500 text-red-400'
                                        : 'bg-blue-900/50 border-2 border-blue-500 text-blue-400'
                                    } ${isScanned && block.value === null && countType === 'col' ? 'opacity-30' : ''}`}
                            >
                                {block.value === null ? '👻' : block.value}

                                {/* Count indicator */}
                                {isCurrentScan && flashState === 'green' && (
                                    <span className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
                                        +1
                                    </span>
                                )}
                                {isCurrentScan && flashState === 'red' && (
                                    <span className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                        ✗
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Scanner Line */}
                {isScanning && (
                    <div className="relative h-2 bg-slate-700 rounded-full mb-6 overflow-hidden">
                        <div
                            className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                            style={{ width: `${((scanPosition + 1) / dataBlocks.length) * 100}%` }}
                        />
                    </div>
                )}

                {/* Result Counter */}
                <div className="flex justify-center">
                    <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-xl border-2 ${countResult !== null
                        ? countType === 'star'
                            ? 'bg-yellow-900/30 border-yellow-500'
                            : 'bg-cyan-900/30 border-cyan-500'
                        : 'bg-slate-800 border-slate-600'
                        }`}>
                        <span className="text-slate-400 font-mono">
                            {countType === 'star' ? 'COUNT(*)' : 'COUNT(column)'} =
                        </span>
                        <span className={`text-4xl font-bold ${countType === 'star' ? 'text-yellow-400' : 'text-cyan-400'
                            }`}>
                            {countResult ?? '?'}
                        </span>
                    </div>
                </div>

                {/* Comparison */}
                {countResult !== null && !isScanning && (
                    <div className="mt-6 text-center animate-slide">
                        <div className="inline-flex items-center gap-8 p-4 bg-slate-800 rounded-xl">
                            <div className="text-center">
                                <div className="text-yellow-400 font-bold text-2xl">5</div>
                                <div className="text-xs text-slate-500">COUNT(*)</div>
                            </div>
                            <div className="text-slate-500">vs</div>
                            <div className="text-center">
                                <div className="text-cyan-400 font-bold text-2xl">3</div>
                                <div className="text-xs text-slate-500">COUNT(col)</div>
                            </div>
                        </div>
                        <div className="text-sm text-orange-400 mt-3">
                            ⚠️ COUNT(*) includes ghosts, COUNT(column) ignores them!
                        </div>
                    </div>
                )}
            </div>

            {/* Interview Tips */}
            <div className="bg-pink-900/20 border border-pink-500/30 rounded-xl p-5">
                <h4 className="text-pink-400 font-bold mb-3">🎉 Interview Talking Points</h4>
                <ul className="text-sm text-slate-300 space-y-2">
                    <li>• <strong>COUNT(*)</strong> counts rows. <strong>COUNT(column)</strong> counts non-NULL values.</li>
                    <li>• <strong>AVG ignores NULLs</strong> in both numerator AND denominator!</li>
                    <li>• <strong>VPI Context:</strong> If quantity is NULL, SUM won't include it but COUNT(*) still counts the row!</li>
                </ul>
            </div>

            {/* CSS for shake animation */}
            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) scale(1.1); }
          25% { transform: translateX(-5px) scale(1.1); }
          75% { transform: translateX(5px) scale(1.1); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default CaseSimulator;
