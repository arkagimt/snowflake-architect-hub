import React, { useState, useEffect, useRef } from 'react';

const JoinsSimulator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [joinType, setJoinType] = useState<'inner' | 'left' | 'right' | 'full' | 'cross'>('inner');
    const [highlightValue, setHighlightValue] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [linePositions, setLinePositions] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; color: string; isNull: boolean }>>([]);

    // NULL vs Value animation state
    const [nullValueAnim, setNullValueAnim] = useState<{
        active: boolean;
        progress: number;
        nullIdx: number;
        valueIdx: number;
        targetValue: string;
    } | null>(null);

    // The trick question data - with duplicates and NULLs
    const tableA = [
        { id: 0, value: '1', display: '1' },
        { id: 1, value: '2', display: '2' },
        { id: 2, value: '0', display: '0' },
        { id: 3, value: '0', display: '0' },
        { id: 4, value: null, display: 'NULL' },
        { id: 5, value: null, display: 'NULL' },
        { id: 6, value: '2', display: '2' },
    ];

    const tableB = [
        { id: 0, value: '2', display: '2' },
        { id: 1, value: '0', display: '0' },
        { id: 2, value: '0', display: '0' },
        { id: 3, value: null, display: 'NULL' },
        { id: 4, value: '4', display: '4' },
    ];

    // NULL vs Value scanning animation - triggers periodically on INNER JOIN
    useEffect(() => {
        if (joinType !== 'inner') {
            setNullValueAnim(null);
            return;
        }

        const runNullValueAnimation = () => {
            // Pick a random NULL from Table A (indices 4 or 5)
            const nullIndices = [4, 5];
            const nullIdx = nullIndices[Math.floor(Math.random() * nullIndices.length)];

            // Pick a random non-NULL value from Table B (indices 0, 1, 2, 4 - values 2, 0, 0, 4)
            const valueIndices = [0, 1, 2, 4];
            const valueIdx = valueIndices[Math.floor(Math.random() * valueIndices.length)];
            const targetValue = tableB[valueIdx].display;

            // Start animation
            setNullValueAnim({ active: true, progress: 0, nullIdx, valueIdx, targetValue });

            // Animate progress from 0 to 50 (middle), then show rejection
            let progress = 0;
            const animInterval = setInterval(() => {
                progress += 2;
                if (progress <= 50) {
                    setNullValueAnim(prev => prev ? { ...prev, progress } : null);
                } else if (progress <= 100) {
                    // Hold at middle with rejection visible
                    setNullValueAnim(prev => prev ? { ...prev, progress: 50, active: true } : null);
                } else {
                    // Fade out
                    clearInterval(animInterval);
                    setTimeout(() => setNullValueAnim(null), 500);
                }
            }, 30);

            return () => clearInterval(animInterval);
        };

        // Run animation every 4 seconds
        const timeout = setTimeout(runNullValueAnimation, 1500);
        const interval = setInterval(runNullValueAnimation, 5000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [joinType]);

    // Calculate join results
    const calculateJoinResults = () => {
        const results: Array<{ aId: number | null; aVal: string; bId: number | null; bVal: string; isGhost: boolean; matchType: string }> = [];

        if (joinType === 'cross') {
            tableA.forEach(a => {
                tableB.forEach(b => {
                    results.push({ aId: a.id, aVal: a.display, bId: b.id, bVal: b.display, isGhost: false, matchType: 'cross' });
                });
            });
            return results;
        }

        const matchedA = new Set<number>();
        const matchedB = new Set<number>();

        tableA.forEach(a => {
            tableB.forEach(b => {
                if (a.value !== null && b.value !== null && a.value === b.value) {
                    results.push({ aId: a.id, aVal: a.display, bId: b.id, bVal: b.display, isGhost: false, matchType: a.value });
                    matchedA.add(a.id);
                    matchedB.add(b.id);
                }
            });
        });

        if (joinType === 'left' || joinType === 'full') {
            tableA.forEach(a => {
                if (!matchedA.has(a.id)) {
                    results.push({ aId: a.id, aVal: a.display, bId: null, bVal: 'NULL', isGhost: true, matchType: 'unmatched' });
                }
            });
        }

        if (joinType === 'right' || joinType === 'full') {
            tableB.forEach(b => {
                if (!matchedB.has(b.id)) {
                    results.push({ aId: null, aVal: 'NULL', bId: b.id, bVal: b.display, isGhost: true, matchType: 'unmatched' });
                }
            });
        }

        return results;
    };

    const results = calculateJoinResults();

    // Get matches for drawing lines
    const getMatches = () => {
        const matches: Array<{ aIdx: number; bIdx: number; value: string; isNull: boolean }> = [];

        tableA.forEach((a, aIdx) => {
            tableB.forEach((b, bIdx) => {
                if (a.value !== null && b.value !== null && a.value === b.value) {
                    matches.push({ aIdx, bIdx, value: a.value, isNull: false });
                }
            });
        });

        // Add NULL broken connections for INNER join visualization
        if (joinType === 'inner') {
            tableA.forEach((a, aIdx) => {
                if (a.value === null) {
                    tableB.forEach((b, bIdx) => {
                        if (b.value === null) {
                            matches.push({ aIdx, bIdx, value: 'null', isNull: true });
                        }
                    });
                }
            });
        }

        return matches;
    };

    const matches = getMatches();

    // Stats
    const stats = {
        zeros: { a: tableA.filter(a => a.value === '0').length, b: tableB.filter(b => b.value === '0').length },
        twos: { a: tableA.filter(a => a.value === '2').length, b: tableB.filter(b => b.value === '2').length },
        nulls: { a: tableA.filter(a => a.value === null).length, b: tableB.filter(b => b.value === null).length },
    };

    const joinTypes = [
        { id: 'inner', label: 'INNER JOIN', icon: '∩' },
        { id: 'left', label: 'LEFT JOIN', icon: '⊂' },
        { id: 'right', label: 'RIGHT JOIN', icon: '⊃' },
        { id: 'full', label: 'FULL JOIN', icon: '∪' },
        { id: 'cross', label: 'CROSS JOIN', icon: '×' },
    ];

    const getValueColor = (val: string | null, type: 'bg' | 'border' | 'line') => {
        const colors: Record<string, { bg: string; border: string; line: string }> = {
            'NULL': { bg: 'bg-red-900/50', border: 'border-red-500', line: '#ef4444' },
            '0': { bg: 'bg-yellow-900/50', border: 'border-yellow-500', line: '#eab308' },
            '2': { bg: 'bg-green-900/50', border: 'border-green-500', line: '#22c55e' },
            '1': { bg: 'bg-blue-900/50', border: 'border-blue-500', line: '#3b82f6' },
            '4': { bg: 'bg-purple-900/50', border: 'border-purple-500', line: '#a855f7' },
        };
        return colors[val || 'NULL']?.[type] || colors['NULL'][type];
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Row height for calculating line positions
    const ROW_HEIGHT = 40; // h-10 = 40px
    const ROW_GAP = 8;     // space-y-2 = 8px
    const HEADER_HEIGHT = 48; // text-sm (20) + text-xs (16) + mb-3 (12) = 48px

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl">
                        🔗
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            SQL Joins: Trick Questions
                        </h1>
                        <p className="text-xs text-slate-500">Duplicates • NULLs • Cartesian Products</p>
                    </div>
                </div>
                <div className="text-sm">
                    Result: <span className="text-cyan-400 font-bold text-xl">{results.length}</span> rows
                </div>
            </header>

            {/* Join Type Selector */}
            <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
                <div className="flex gap-2 justify-center">
                    {joinTypes.map(jt => (
                        <button
                            key={jt.id}
                            onClick={() => setJoinType(jt.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${joinType === jt.id
                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <span className="text-lg">{jt.icon}</span>
                            {jt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">

                {/* Left Panel: Visual Join */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">

                        {/* Visual Join Area */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                            <div className="flex items-start gap-4" ref={containerRef}>

                                {/* Table A */}
                                <div className="w-28 shrink-0">
                                    <div className="text-center mb-3">
                                        <span className="text-sm font-bold text-blue-400">TABLE A</span>
                                        <div className="text-xs text-slate-500">{tableA.length} rows</div>
                                    </div>
                                    <div className="space-y-2">
                                        {tableA.map((row, idx) => (
                                            <div
                                                key={idx}
                                                data-row-a={idx}
                                                className={`relative h-10 flex items-center justify-center rounded-lg border-2 font-mono text-sm transition-all cursor-pointer ${getValueColor(row.display, 'bg')} ${getValueColor(row.display, 'border')} ${highlightValue === row.display ? 'ring-2 ring-white scale-105 z-10' : ''
                                                    }`}
                                                onMouseEnter={() => setHighlightValue(row.display)}
                                                onMouseLeave={() => setHighlightValue(null)}
                                            >
                                                {row.display}
                                                {row.value === null && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center">✖</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Connection Lines Area */}
                                <div className="flex-1 relative" style={{ minHeight: `${tableA.length * (ROW_HEIGHT + ROW_GAP)}px` }}>
                                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                                        {matches.map((match, idx) => {
                                            const y1 = match.aIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2 + HEADER_HEIGHT;
                                            const y2 = match.bIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2 + HEADER_HEIGHT;
                                            const color = getValueColor(match.value === 'null' ? 'NULL' : match.value, 'line');
                                            const isHighlighted = highlightValue === match.value || highlightValue === (match.value === 'null' ? 'NULL' : match.value);

                                            if (match.isNull) {
                                                // Broken NULL line
                                                return (
                                                    <g key={idx} className="transition-opacity" style={{ opacity: isHighlighted ? 1 : 0.7 }}>
                                                        {/* Left segment */}
                                                        <line
                                                            x1="0"
                                                            y1={y1}
                                                            x2="35%"
                                                            y2={(y1 + y2) / 2}
                                                            stroke={color}
                                                            strokeWidth={isHighlighted ? 3 : 2}
                                                            strokeDasharray="6,4"
                                                        />
                                                        {/* Right segment */}
                                                        <line
                                                            x1="65%"
                                                            y1={(y1 + y2) / 2}
                                                            x2="100%"
                                                            y2={y2}
                                                            stroke={color}
                                                            strokeWidth={isHighlighted ? 3 : 2}
                                                            strokeDasharray="6,4"
                                                        />
                                                        {/* X mark */}
                                                        <circle cx="50%" cy={(y1 + y2) / 2} r="12" fill="#7f1d1d" stroke={color} strokeWidth="2" />
                                                        <text x="50%" y={(y1 + y2) / 2 + 4} fill="white" fontSize="12" textAnchor="middle" fontWeight="bold">✖</text>
                                                        {/* Label */}
                                                        <text x="50%" y={(y1 + y2) / 2 + 28} fill={color} fontSize="10" textAnchor="middle" className="font-mono">
                                                            NULL ≠ NULL
                                                        </text>
                                                    </g>
                                                );
                                            }

                                            return (
                                                <line
                                                    key={idx}
                                                    x1="0"
                                                    y1={y1}
                                                    x2="100%"
                                                    y2={y2}
                                                    stroke={color}
                                                    strokeWidth={isHighlighted ? 4 : 2}
                                                    opacity={isHighlighted ? 1 : 0.6}
                                                    className="transition-all"
                                                />
                                            );
                                        })}

                                        {/* NULL vs Value Animation */}
                                        {nullValueAnim && joinType === 'inner' && (
                                            (() => {
                                                const y1 = nullValueAnim.nullIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2 + HEADER_HEIGHT;
                                                const y2 = nullValueAnim.valueIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2 + HEADER_HEIGHT;
                                                const midY = (y1 + y2) / 2;
                                                const progress = nullValueAnim.progress;

                                                // Calculate current line end position based on progress
                                                const currentX = `${progress}%`;
                                                const currentY = y1 + (midY - y1) * (progress / 50);

                                                return (
                                                    <g className="null-value-animation">
                                                        {/* Animated scanning line from NULL */}
                                                        <line
                                                            x1="0"
                                                            y1={y1}
                                                            x2={currentX}
                                                            y2={currentY}
                                                            stroke="#f97316"
                                                            strokeWidth="3"
                                                            strokeDasharray="8,4"
                                                            opacity="0.9"
                                                            style={{
                                                                filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))'
                                                            }}
                                                        />

                                                        {/* Scanning head glow */}
                                                        {progress < 50 && (
                                                            <circle
                                                                cx={currentX}
                                                                cy={currentY}
                                                                r="6"
                                                                fill="#f97316"
                                                                opacity="0.8"
                                                                style={{
                                                                    filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.8))'
                                                                }}
                                                            >
                                                                <animate attributeName="r" values="4;8;4" dur="0.3s" repeatCount="indefinite" />
                                                            </circle>
                                                        )}

                                                        {/* Rejection X mark and label - appears at 50% progress */}
                                                        {progress >= 50 && (
                                                            <g style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                                                {/* Red blocking circle */}
                                                                <circle
                                                                    cx="50%"
                                                                    cy={midY}
                                                                    r="16"
                                                                    fill="#dc2626"
                                                                    stroke="#fca5a5"
                                                                    strokeWidth="2"
                                                                    style={{
                                                                        filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.7))',
                                                                        animation: 'pulse 0.5s ease-out'
                                                                    }}
                                                                />

                                                                {/* X mark */}
                                                                <text
                                                                    x="50%"
                                                                    y={midY + 5}
                                                                    fill="white"
                                                                    fontSize="16"
                                                                    fontWeight="bold"
                                                                    textAnchor="middle"
                                                                >
                                                                    ✖
                                                                </text>

                                                                {/* Floating label - NULL ≠ Value */}
                                                                <g>
                                                                    <rect
                                                                        x="calc(50% - 45px)"
                                                                        y={midY - 42}
                                                                        width="90"
                                                                        height="22"
                                                                        rx="4"
                                                                        fill="#7f1d1d"
                                                                        stroke="#fca5a5"
                                                                        strokeWidth="1"
                                                                    />
                                                                    <text
                                                                        x="50%"
                                                                        y={midY - 27}
                                                                        fill="#fca5a5"
                                                                        fontSize="11"
                                                                        fontWeight="bold"
                                                                        textAnchor="middle"
                                                                        fontFamily="monospace"
                                                                    >
                                                                        NULL ≠ {nullValueAnim.targetValue}
                                                                    </text>
                                                                </g>

                                                                {/* Shockwave effect rings */}
                                                                <circle
                                                                    cx="50%"
                                                                    cy={midY}
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke="#ef4444"
                                                                    strokeWidth="2"
                                                                    opacity="0.6"
                                                                    style={{
                                                                        animation: 'ripple 0.8s ease-out forwards'
                                                                    }}
                                                                />
                                                                <circle
                                                                    cx="50%"
                                                                    cy={midY}
                                                                    r="16"
                                                                    fill="none"
                                                                    stroke="#ef4444"
                                                                    strokeWidth="1"
                                                                    opacity="0.4"
                                                                    style={{
                                                                        animation: 'ripple 0.8s ease-out 0.2s forwards'
                                                                    }}
                                                                />
                                                            </g>
                                                        )}

                                                        {/* Target indicator on Table B value */}
                                                        {progress < 50 && (
                                                            <circle
                                                                cx="100%"
                                                                cy={y2}
                                                                r="8"
                                                                fill="none"
                                                                stroke="#f97316"
                                                                strokeWidth="2"
                                                                strokeDasharray="4,2"
                                                                opacity="0.6"
                                                            >
                                                                <animate attributeName="r" values="6;12;6" dur="0.8s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" values="0.6;0.3;0.6" dur="0.8s" repeatCount="indefinite" />
                                                            </circle>
                                                        )}
                                                    </g>
                                                );
                                            })()
                                        )}
                                    </svg>

                                    {/* CSS for animations */}
                                    <style>{`
                @keyframes ripple {
                  0% { r: 16; opacity: 0.6; }
                  100% { r: 40; opacity: 0; }
                }
                @keyframes pulse {
                  0% { transform: scale(0.8); }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); }
                }
                @keyframes fadeIn {
                  0% { opacity: 0; transform: scale(0.5); }
                  100% { opacity: 1; transform: scale(1); }
                }
              `}</style>

                                    {/* Center Join Label */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border-2 border-slate-600 rounded-xl px-4 py-3 z-10 shadow-xl">
                                        <div className="text-3xl text-center">{joinTypes.find(j => j.id === joinType)?.icon}</div>
                                        <div className="text-xs text-slate-400 text-center mt-1 font-bold">{joinType.toUpperCase()}</div>
                                    </div>
                                </div>

                                {/* Table B */}
                                <div className="w-28 shrink-0">
                                    <div className="text-center mb-3">
                                        <span className="text-sm font-bold text-orange-400">TABLE B</span>
                                        <div className="text-xs text-slate-500">{tableB.length} rows</div>
                                    </div>
                                    <div className="space-y-2">
                                        {tableB.map((row, idx) => (
                                            <div
                                                key={idx}
                                                data-row-b={idx}
                                                className={`relative h-10 flex items-center justify-center rounded-lg border-2 font-mono text-sm transition-all cursor-pointer ${getValueColor(row.display, 'bg')} ${getValueColor(row.display, 'border')} ${highlightValue === row.display ? 'ring-2 ring-white scale-105 z-10' : ''
                                                    }`}
                                                onMouseEnter={() => setHighlightValue(row.display)}
                                                onMouseLeave={() => setHighlightValue(null)}
                                            >
                                                {row.display}
                                                {row.value === null && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[8px] flex items-center justify-center">✖</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Insights Panel */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {/* The 0 Explosion */}
                            <div className={`bg-yellow-900/20 border rounded-xl p-4 transition-all ${highlightValue === '0' ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-yellow-500/30'
                                }`}
                                onMouseEnter={() => setHighlightValue('0')}
                                onMouseLeave={() => setHighlightValue(null)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">💣</span>
                                    <span className="font-bold text-yellow-400 text-sm">The "0" Explosion</span>
                                </div>
                                <div className="text-xs text-slate-300 mb-2">Duplicates multiply:</div>
                                <div className="bg-slate-900 rounded-lg p-2 font-mono text-center">
                                    <span className="text-yellow-400">{stats.zeros.a}</span>
                                    <span className="text-slate-500"> × </span>
                                    <span className="text-yellow-400">{stats.zeros.b}</span>
                                    <span className="text-slate-500"> = </span>
                                    <span className="text-yellow-300 text-lg font-bold">{stats.zeros.a * stats.zeros.b}</span>
                                </div>
                            </div>

                            {/* The NULL = NULL Trap */}
                            <div className={`bg-red-900/20 border rounded-xl p-4 transition-all ${highlightValue === 'NULL' ? 'border-red-400 ring-2 ring-red-400/30' : 'border-red-500/30'
                                }`}
                                onMouseEnter={() => setHighlightValue('NULL')}
                                onMouseLeave={() => setHighlightValue(null)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🚫</span>
                                    <span className="font-bold text-red-400 text-sm">NULL = NULL</span>
                                </div>
                                <div className="text-xs text-slate-300 mb-2">Never matches itself:</div>
                                <div className="bg-slate-900 rounded-lg p-2 font-mono text-center">
                                    <span className="text-red-400 text-xs">NULL = NULL</span>
                                    <span className="text-slate-500 text-xs"> → </span>
                                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">FALSE</span>
                                </div>
                            </div>

                            {/* NEW: NULL vs Value Trap */}
                            <div className={`bg-orange-900/20 border rounded-xl p-4 transition-all ${nullValueAnim?.active ? 'border-orange-400 ring-2 ring-orange-400/30 animate-pulse' : 'border-orange-500/30'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🚷</span>
                                    <span className="font-bold text-orange-400 text-sm">NULL ≠ Value</span>
                                </div>
                                <div className="text-xs text-slate-300 mb-2">Never matches numbers:</div>
                                <div className="bg-slate-900 rounded-lg p-2 font-mono text-center">
                                    <span className="text-red-400 text-xs">NULL</span>
                                    <span className="text-slate-500 text-xs"> = </span>
                                    <span className="text-purple-400 text-xs">'4'</span>
                                    <span className="text-slate-500 text-xs"> → </span>
                                    <span className="bg-orange-600 text-white px-1.5 py-0.5 rounded text-xs">FALSE</span>
                                </div>
                                {joinType === 'inner' && (
                                    <div className="text-[10px] text-orange-400 mt-2 text-center animate-pulse">
                                        👀 Watch the animation!
                                    </div>
                                )}
                            </div>

                            {/* The 2 Multiplier */}
                            <div className={`bg-green-900/20 border rounded-xl p-4 transition-all ${highlightValue === '2' ? 'border-green-400 ring-2 ring-green-400/30' : 'border-green-500/30'
                                }`}
                                onMouseEnter={() => setHighlightValue('2')}
                                onMouseLeave={() => setHighlightValue(null)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✅</span>
                                    <span className="font-bold text-green-400 text-sm">The "2" Multiplier</span>
                                </div>
                                <div className="text-xs text-slate-300 mb-2">Multiple matches:</div>
                                <div className="bg-slate-900 rounded-lg p-2 font-mono text-center">
                                    <span className="text-green-400">{stats.twos.a}</span>
                                    <span className="text-slate-500"> × </span>
                                    <span className="text-green-400">{stats.twos.b}</span>
                                    <span className="text-slate-500"> = </span>
                                    <span className="text-green-300 text-lg font-bold">{stats.twos.a * stats.twos.b}</span>
                                </div>
                            </div>
                        </div>

                        {/* SQL Example */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">SQL Query</div>
                            <pre className="font-mono text-sm text-slate-300">
                                {joinType === 'inner' ? `SELECT A.value, B.value
INNER JOIN TableB B ON A.value = B.value;
-- NULLs excluded: NULL = NULL is FALSE!` :
                                    joinType === 'left' ? `SELECT A.value, B.value
LEFT JOIN TableB B ON A.value = B.value;
-- All A rows kept, B fills with NULL if no match` :
                                        joinType === 'right' ? `SELECT A.value, B.value
RIGHT JOIN TableB B ON A.value = B.value;
-- All B rows kept, A fills with NULL if no match` :
                                            joinType === 'full' ? `SELECT A.value, B.value
FULL OUTER JOIN TableB B ON A.value = B.value;
-- All rows from both, NULLs fill gaps` :
                                                `SELECT A.value, B.value
CROSS JOIN TableB B;
-- Every row × every row = ${tableA.length} × ${tableB.length} = ${tableA.length * tableB.length} rows!`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Result Table */}
                <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">📊 Result</h3>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${joinType === 'cross' ? 'bg-red-900/50 text-red-400' :
                            results.length > 10 ? 'bg-yellow-900/50 text-yellow-400' :
                                'bg-green-900/50 text-green-400'
                            }`}>
                            {results.length} rows
                        </span>
                    </div>

                    {/* Header */}
                    <div className="grid grid-cols-2 gap-1 mb-2 text-xs font-bold">
                        <div className="bg-blue-900/30 text-blue-400 p-2 rounded text-center">A.value</div>
                        <div className="bg-orange-900/30 text-orange-400 p-2 rounded text-center">B.value</div>
                    </div>

                    {/* Result Rows */}
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                        {results.slice(0, 40).map((row, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-1">
                                <div className={`p-2 rounded text-center font-mono text-xs ${row.isGhost && row.aId === null
                                    ? 'border-2 border-dashed border-red-500/50 text-red-400'
                                    : `${getValueColor(row.aVal, 'bg')} border ${getValueColor(row.aVal, 'border')}`
                                    }`}>
                                    {row.aVal}
                                    {row.isGhost && row.aId === null && <span className="ml-1">👻</span>}
                                </div>
                                <div className={`p-2 rounded text-center font-mono text-xs ${row.isGhost && row.bId === null
                                    ? 'border-2 border-dashed border-red-500/50 text-red-400'
                                    : `${getValueColor(row.bVal, 'bg')} border ${getValueColor(row.bVal, 'border')}`
                                    }`}>
                                    {row.bVal}
                                    {row.isGhost && row.bId === null && <span className="ml-1">👻</span>}
                                </div>
                            </div>
                        ))}
                        {results.length > 40 && (
                            <div className="text-center text-slate-500 text-xs py-2">+{results.length - 40} more...</div>
                        )}
                    </div>

                    {/* Legend for outer joins */}
                    {(joinType === 'left' || joinType === 'right' || joinType === 'full') && (
                        <div className="mt-3 p-2 bg-slate-800 rounded-lg text-xs flex items-center gap-2">
                            <div className="w-6 h-6 border-2 border-dashed border-red-500/50 rounded flex items-center justify-center">👻</div>
                            <span className="text-slate-400">Ghost = No match (NULL filled)</span>
                        </div>
                    )}

                    {/* Row Breakdown */}
                    <div className="mt-4 p-3 bg-slate-800 rounded-xl text-sm">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Breakdown</div>
                        {joinType !== 'cross' ? (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-green-400">"2" matches:</span>
                                    <span className="font-mono">{stats.twos.a * stats.twos.b}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-yellow-400">"0" matches:</span>
                                    <span className="font-mono">{stats.zeros.a * stats.zeros.b}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-400">NULL matches:</span>
                                    <span className="font-mono">0</span>
                                </div>
                                {(joinType === 'left' || joinType === 'full') && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Unmatched A:</span>
                                        <span className="font-mono">{tableA.filter(a => a.value === '1' || a.value === null).length}</span>
                                    </div>
                                )}
                                {(joinType === 'right' || joinType === 'full') && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Unmatched B:</span>
                                        <span className="font-mono">{tableB.filter(b => b.value === '4' || b.value === null).length}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-700 pt-1 flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span className="text-cyan-400">{results.length}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Table A rows:</span>
                                    <span className="font-mono">{tableA.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Table B rows:</span>
                                    <span className="font-mono">{tableB.length}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-1 flex justify-between font-bold">
                                    <span>Total (A × B):</span>
                                    <span className="text-red-400">{tableA.length * tableB.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinsSimulator;
