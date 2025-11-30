import React, { useState, useEffect } from 'react';

const PruningSimulator = ({ onBack }: { onBack: () => void }) => {
    const [queryDate, setQueryDate] = useState('2024-01-15');
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [currentScanIndex, setCurrentScanIndex] = useState(-1);
    const [queryType, setQueryType] = useState<'equals' | 'range' | 'between'>('equals');
    const [rangeStart, setRangeStart] = useState('2024-01-15');
    const [rangeEnd, setRangeEnd] = useState('2024-02-05');

    // Micro-partition data with zone maps
    const partitions = [
        { id: 1, minDate: '2024-01-01', maxDate: '2024-01-10', rows: 1000000, label: 'Jan 1-10' },
        { id: 2, minDate: '2024-01-11', maxDate: '2024-01-20', rows: 1000000, label: 'Jan 11-20' },
        { id: 3, minDate: '2024-01-21', maxDate: '2024-01-31', rows: 1200000, label: 'Jan 21-31' },
        { id: 4, minDate: '2024-02-01', maxDate: '2024-02-10', rows: 900000, label: 'Feb 1-10' },
        { id: 5, minDate: '2024-02-11', maxDate: '2024-02-20', rows: 1100000, label: 'Feb 11-20' },
    ];

    // Check if date falls within partition range
    const isDateInRange = (partitionMin: string, partitionMax: string) => {
        if (queryType === 'equals') {
            return queryDate >= partitionMin && queryDate <= partitionMax;
        } else if (queryType === 'range') {
            // WHERE date >= rangeStart
            return partitionMax >= rangeStart;
        } else {
            // BETWEEN rangeStart AND rangeEnd
            return partitionMax >= rangeStart && partitionMin <= rangeEnd;
        }
    };

    // Calculate statistics
    const getStats = () => {
        const scanned = partitions.filter(p => isDateInRange(p.minDate, p.maxDate));
        const pruned = partitions.filter(p => !isDateInRange(p.minDate, p.maxDate));
        const totalRows = partitions.reduce((sum, p) => sum + p.rows, 0);
        const scannedRows = scanned.reduce((sum, p) => sum + p.rows, 0);
        const prunedRows = pruned.reduce((sum, p) => sum + p.rows, 0);

        return {
            scannedCount: scanned.length,
            prunedCount: pruned.length,
            totalRows,
            scannedRows,
            prunedRows,
            efficiency: totalRows > 0 ? Math.round((prunedRows / totalRows) * 100) : 0
        };
    };

    const stats = getStats();

    const runQuery = () => {
        setIsScanning(true);
        setScanComplete(false);
        setCurrentScanIndex(-1);

        // Animate through each partition
        partitions.forEach((_, idx) => {
            setTimeout(() => {
                setCurrentScanIndex(idx);
                if (idx === partitions.length - 1) {
                    setTimeout(() => {
                        setIsScanning(false);
                        setScanComplete(true);
                    }, 400);
                }
            }, idx * 400);
        });
    };

    const resetQuery = () => {
        setScanComplete(false);
        setCurrentScanIndex(-1);
    };

    const formatRows = (rows: number) => {
        if (rows >= 1000000) return `${(rows / 1000000).toFixed(1)}M`;
        if (rows >= 1000) return `${(rows / 1000).toFixed(0)}K`;
        return rows.toString();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
            if (e.key === 'Enter' && !isScanning) runQuery();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isScanning]);

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl">
                        ✂️
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Partition Pruning Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Zone Maps • Micro-Partitions • Query Optimization</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">

                    {/* Concept Explanation */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-5 mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">🧠 How Partition Pruning Works</h3>
                        <p className="text-sm text-slate-300">
                            Snowflake stores data in <strong>micro-partitions</strong> (50-500MB each). Each partition has a <strong>zone map</strong> containing
                            MIN/MAX values for each column. When you query with a filter, Snowflake checks zone maps <em>first</em> and
                            <strong> skips (prunes)</strong> partitions that can't possibly contain matching data — without ever reading the actual data!
                        </p>
                    </div>

                    {/* Query Builder */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">🔧</span>
                            <h3 className="font-bold text-white">Build Your Query</h3>
                        </div>

                        {/* Query Type Selector */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'equals', label: 'WHERE date = ?', icon: '=' },
                                { id: 'range', label: 'WHERE date >= ?', icon: '≥' },
                                { id: 'between', label: 'WHERE date BETWEEN ? AND ?', icon: '↔' }
                            ].map(qt => (
                                <button
                                    key={qt.id}
                                    onClick={() => { setQueryType(qt.id as any); resetQuery(); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${queryType === qt.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="mr-2">{qt.icon}</span>
                                    {qt.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Input(s) */}
                        <div className="flex items-end gap-4">
                            {queryType === 'equals' && (
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Select Date</label>
                                    <input
                                        type="date"
                                        value={queryDate}
                                        onChange={(e) => { setQueryDate(e.target.value); resetQuery(); }}
                                        min="2024-01-01"
                                        max="2024-02-20"
                                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            )}
                            {queryType === 'range' && (
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={rangeStart}
                                        onChange={(e) => { setRangeStart(e.target.value); resetQuery(); }}
                                        min="2024-01-01"
                                        max="2024-02-20"
                                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                    />
                                </div>
                            )}
                            {queryType === 'between' && (
                                <div className="flex items-center gap-2">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={rangeStart}
                                            onChange={(e) => { setRangeStart(e.target.value); resetQuery(); }}
                                            min="2024-01-01"
                                            max="2024-02-20"
                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <span className="text-slate-500 mt-6">AND</span>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={rangeEnd}
                                            onChange={(e) => { setRangeEnd(e.target.value); resetQuery(); }}
                                            min="2024-01-01"
                                            max="2024-02-20"
                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={runQuery}
                                disabled={isScanning}
                                className={`px-6 py-2 rounded-lg font-bold transition ml-auto ${isScanning
                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white shadow-lg shadow-blue-500/25'
                                    }`}
                            >
                                {isScanning ? 'Scanning...' : 'Run Query 🚀'}
                            </button>
                        </div>
                    </div>

                    {/* Visualization Area */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📦</span>
                                <h3 className="font-bold text-white">Micro-Partitions (Zone Maps)</h3>
                            </div>
                            <div className="text-xs text-slate-500">
                                Total: {formatRows(stats.totalRows)} rows across {partitions.length} partitions
                            </div>
                        </div>

                        {/* Partitions Grid */}
                        <div className="grid grid-cols-5 gap-4">
                            {partitions.map((partition, idx) => {
                                const isInRange = isDateInRange(partition.minDate, partition.maxDate);
                                const hasBeenScanned = currentScanIndex >= idx;
                                const isCurrentScan = currentScanIndex === idx;

                                return (
                                    <div
                                        key={partition.id}
                                        className={`relative rounded-xl border-2 p-3 transition-all duration-500 ${isCurrentScan
                                            ? 'border-yellow-400 bg-yellow-900/20 scale-105 shadow-lg shadow-yellow-500/20 z-10'
                                            : hasBeenScanned
                                                ? isInRange
                                                    ? 'border-green-500 bg-green-900/20' // Kept (Scanned & Matched) - Wait, actually Pruning means SKIPPING. 
                                                    // Logic check: Snowflake CHECKS zone maps for ALL. 
                                                    // If zone map overlaps, it SCANS the partition. If not, it PRUNES (skips).
                                                    // So "Scanned" in this viz means "Zone Map Checked".
                                                    // Let's align with the visual:
                                                    // If isInRange is true -> It is NOT pruned. It is "Selected for Scan".
                                                    // If isInRange is false -> It is PRUNED.
                                                    : 'border-slate-700 bg-slate-800 opacity-50 grayscale' // Pruned
                                                : 'border-slate-700 bg-slate-800' // Waiting
                                            }`}
                                    >
                                        {/* Partition Header */}
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-400">P{partition.id}</span>
                                            {hasBeenScanned && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isInRange ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                    }`}>
                                                    {isInRange ? 'KEEP' : 'PRUNE'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Zone Map Info */}
                                        <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 text-center">Zone Map</div>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">MIN:</span>
                                                    <span className={`font-mono ${hasBeenScanned && isInRange ? 'text-green-400' : 'text-slate-300'}`}>
                                                        {partition.minDate}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">MAX:</span>
                                                    <span className={`font-mono ${hasBeenScanned && isInRange ? 'text-green-400' : 'text-slate-300'}`}>
                                                        {partition.maxDate}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row Count */}
                                        <div className="text-center">
                                            <div className={`text-lg font-bold ${hasBeenScanned && !isInRange ? 'text-slate-600 line-through' : 'text-cyan-400'
                                                }`}>
                                                {formatRows(partition.rows)}
                                            </div>
                                            <div className="text-[10px] text-slate-500">rows</div>
                                        </div>

                                        {/* Visual block representation */}
                                        <div className="mt-3 h-8 rounded overflow-hidden bg-slate-700/50">
                                            <div
                                                className={`h-full ${hasBeenScanned
                                                    ? isInRange
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                        : 'bg-slate-600/50'
                                                    : 'bg-slate-600'
                                                    }`}
                                                style={{
                                                    width: hasBeenScanned && isInRange ? '100%' : hasBeenScanned ? '0%' : '100%',
                                                    transition: 'width 0.5s ease-out'
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Efficiency Visualization */}
                    {scanComplete && (
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 mb-6 animate-slide">
                            <h4 className="font-bold text-white mb-3">📊 Scan Efficiency</h4>
                            <div className="h-8 bg-slate-800 rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000"
                                    style={{ width: `${stats.efficiency}%` }}
                                >
                                    {stats.prunedRows > 0 && `${formatRows(stats.prunedRows)} PRUNED`}
                                </div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                <span>Necessary I/O</span>
                                <span>Avoided I/O (Zone Map Magic! ✨)</span>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mt-6 animate-slide">
                                <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-green-400">{stats.scannedCount}</div>
                                    <div className="text-sm text-slate-400">Partitions Scanned</div>
                                    <div className="text-xs text-slate-500 mt-1">out of {partitions.length}</div>
                                </div>

                                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-red-400">{stats.prunedCount}</div>
                                    <div className="text-sm text-slate-400">Partitions Pruned</div>
                                    <div className="text-xs text-slate-500 mt-1">skipped entirely!</div>
                                </div>

                                <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-cyan-400">{formatRows(stats.scannedRows)}</div>
                                    <div className="text-sm text-slate-400">Rows Scanned</div>
                                    <div className="text-xs text-slate-500 mt-1">of {formatRows(stats.totalRows)} total</div>
                                </div>

                                <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-5 text-center">
                                    <div className="text-3xl font-bold text-blue-400">{stats.efficiency}%</div>
                                    <div className="text-sm text-slate-400">Efficiency Score</div>
                                    <div className="text-xs text-slate-500 mt-1">data skipped</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interview Tips */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5">
                        <h4 className="text-blue-400 font-bold mb-3">🎭 Interview Talking Points</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                            <div>
                                <strong className="text-white">Zone Maps:</strong> Metadata containing MIN/MAX for each column in each micro-partition.
                                Checked before any data is read.
                            </div>
                            <div>
                                <strong className="text-white">When It Works Best:</strong> Equality (=) and range (&gt;, &lt;, BETWEEN) predicates on
                                clustered columns. Less effective for LIKE or functions.
                            </div>
                            <div>
                                <strong className="text-white">Your VPI Context:</strong> Clustering on (order_date, plant_code) would optimize
                                Power BI reports filtering by date ranges!
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PruningSimulator;
