import React, { useState } from 'react';

const SnowflakeClusteringViz = () => {
    const [isClustered, setIsClustered] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [creditsUsed, setCreditsUsed] = useState(0);
    const [searchDate, setSearchDate] = useState<number | null>(null);
    const [showMetrics, setShowMetrics] = useState(false);

    // Micro-partition data - poor clustering (overlapping date ranges)
    const poorClusteringData = [
        { id: 1, minDate: 1, maxDate: 15, rows: 1200, color: 'bg-red-500' },
        { id: 2, minDate: 5, maxDate: 20, rows: 980, color: 'bg-orange-500' },
        { id: 3, minDate: 10, maxDate: 25, rows: 1100, color: 'bg-yellow-500' },
        { id: 4, minDate: 3, maxDate: 18, rows: 850, color: 'bg-green-500' },
        { id: 5, minDate: 12, maxDate: 28, rows: 1050, color: 'bg-blue-500' },
        { id: 6, minDate: 8, maxDate: 22, rows: 920, color: 'bg-purple-500' },
    ];

    // Good clustering (sorted, minimal overlap)
    const goodClusteringData = [
        { id: 1, minDate: 1, maxDate: 5, rows: 1000, color: 'bg-cyan-500' },
        { id: 2, minDate: 6, maxDate: 10, rows: 1000, color: 'bg-cyan-500' },
        { id: 3, minDate: 11, maxDate: 15, rows: 1000, color: 'bg-cyan-500' },
        { id: 4, minDate: 16, maxDate: 20, rows: 1000, color: 'bg-cyan-500' },
        { id: 5, minDate: 21, maxDate: 25, rows: 1000, color: 'bg-cyan-500' },
        { id: 6, minDate: 26, maxDate: 30, rows: 1000, color: 'bg-cyan-500' },
    ];

    const currentData = isClustered ? goodClusteringData : poorClusteringData;

    // Calculate which partitions would be scanned for a given date
    const getScannedPartitions = (date: number, data: typeof poorClusteringData) => {
        return data.filter(p => date >= p.minDate && date <= p.maxDate);
    };

    const scannedPartitions = searchDate ? getScannedPartitions(searchDate, currentData) : [];
    const pruningEfficiency = searchDate
        ? Math.round(((currentData.length - scannedPartitions.length) / currentData.length) * 100)
        : 0;

    // Calculate clustering depth (average overlap)
    const calculateDepth = (data: typeof poorClusteringData) => {
        let totalOverlap = 0;
        for (let day = 1; day <= 30; day++) {
            const overlapping = data.filter(p => day >= p.minDate && day <= p.maxDate).length;
            totalOverlap += overlapping;
        }
        return (totalOverlap / 30).toFixed(2);
    };

    const runReclustering = () => {
        if (isAnimating || isClustered) return;

        setIsAnimating(true);
        setCreditsUsed(0);

        // Animate credits counter
        const creditInterval = setInterval(() => {
            setCreditsUsed(prev => {
                if (prev >= 12) {
                    clearInterval(creditInterval);
                    return 12;
                }
                return prev + 1;
            });
        }, 150);

        // Complete animation after 2 seconds
        setTimeout(() => {
            setIsClustered(true);
            setIsAnimating(false);
            setShowMetrics(true);
        }, 2000);
    };

    const resetDemo = () => {
        setIsClustered(false);
        setCreditsUsed(0);
        setSearchDate(null);
        setShowMetrics(false);
    };

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">❄️ Interactive Clustering Depth Visualizer</h3>
                            <p className="text-sm text-slate-300">
                                See how <strong>micro-partition overlap</strong> affects query performance and how
                                <strong> auto-reclustering</strong> optimizes data layout.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={runReclustering}
                                disabled={isAnimating || isClustered}
                                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${isAnimating ? 'bg-yellow-600 text-white animate-pulse' :
                                    isClustered ? 'bg-green-600 text-white cursor-default' :
                                        'bg-cyan-600 hover:bg-cyan-500 text-white'
                                    }`}
                            >
                                {isAnimating ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Reclustering...
                                    </>
                                ) : isClustered ? (
                                    <>✅ Clustered</>
                                ) : (
                                    <>⚡ Run Auto-Clustering</>
                                )}
                            </button>
                            <button
                                onClick={resetDemo}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Credits Counter */}
                    {(isAnimating || creditsUsed > 0) && (
                        <div className="mt-4 flex items-center gap-4">
                            <div className="bg-slate-900/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                <span className="text-yellow-400">💰</span>
                                <span className="text-sm text-slate-300">Credits Used:</span>
                                <span className="text-lg font-bold text-yellow-400 mono">{creditsUsed}</span>
                            </div>
                            {isAnimating && (
                                <span className="text-xs text-slate-400 animate-pulse">
                                    Reorganizing micro-partitions...
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Visualization */}
                <div className="grid grid-cols-2 gap-6 mb-6">

                    {/* Timeline Visualization */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-white">
                                {isClustered ? '✅ Good Clustering' : '⚠️ Poor Clustering'}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded ${isClustered ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                                }`}>
                                Depth: {calculateDepth(currentData)}
                            </span>
                        </div>

                        {/* Timeline Header */}
                        <div className="flex justify-between text-[10px] text-slate-500 mb-2 px-1">
                            {[1, 5, 10, 15, 20, 25, 30].map(d => (
                                <span key={d}>Day {d}</span>
                            ))}
                        </div>

                        {/* Partition Bars */}
                        <div className="relative h-64 bg-slate-950 rounded-lg p-3">
                            {currentData.map((partition, idx) => {
                                const leftPercent = ((partition.minDate - 1) / 29) * 100;
                                const widthPercent = ((partition.maxDate - partition.minDate) / 29) * 100;
                                const isScanned = searchDate && scannedPartitions.some(p => p.id === partition.id);

                                return (
                                    <div
                                        key={partition.id}
                                        className={`absolute h-8 rounded-md transition-all duration-1000 flex items-center justify-center text-[10px] font-bold text-white ${isScanned ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950 z-10' : ''
                                            } ${isAnimating ? 'opacity-50' : ''}`}
                                        style={{
                                            left: `${leftPercent}%`,
                                            width: `${Math.max(widthPercent, 8)}%`,
                                            top: `${idx * 38 + 8}px`,
                                            backgroundColor: isScanned ? '#facc15' :
                                                isClustered ? '#06b6d4' :
                                                    ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'][idx],
                                            boxShadow: isScanned ? '0 0 20px rgba(250, 204, 21, 0.5)' : 'none'
                                        }}
                                    >
                                        P{partition.id}
                                        {isScanned && <span className="ml-1">📖</span>}
                                    </div>
                                );
                            })}

                            {/* Search Date Indicator */}
                            {searchDate && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20"
                                    style={{ left: `${((searchDate - 1) / 29) * 100}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                                        Query: Day {searchDate}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                            <span>← Earlier dates</span>
                            <span className="flex-1 border-t border-slate-700" />
                            <span>Later dates →</span>
                        </div>
                    </div>

                    {/* Metrics & Controls */}
                    <div className="space-y-4">

                        {/* Search Simulation */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                            <h4 className="font-bold text-white mb-3">🔍 Search Simulation</h4>
                            <p className="text-xs text-slate-400 mb-3">
                                Click a date to see which partitions would be scanned
                            </p>
                            <div className="grid grid-cols-6 gap-2">
                                {[5, 10, 12, 15, 20, 25].map(date => (
                                    <button
                                        key={date}
                                        onClick={() => setSearchDate(date)}
                                        className={`px-3 py-2 rounded-lg text-sm font-mono transition ${searchDate === date
                                            ? 'bg-yellow-500 text-slate-900 font-bold'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        Day {date}
                                    </button>
                                ))}
                            </div>

                            {searchDate && (
                                <div className="mt-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-400">Partitions Scanned:</span>
                                        <span className={`text-lg font-bold ${scannedPartitions.length <= 1 ? 'text-green-400' :
                                            scannedPartitions.length <= 3 ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>
                                            {scannedPartitions.length} / {currentData.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-400">Pruning Efficiency:</span>
                                        <span className={`text-lg font-bold ${pruningEfficiency >= 80 ? 'text-green-400' :
                                            pruningEfficiency >= 50 ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>
                                            {pruningEfficiency}%
                                        </span>
                                    </div>
                                    {/* Efficiency Bar */}
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${pruningEfficiency >= 80 ? 'bg-green-500' :
                                                pruningEfficiency >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                            style={{ width: `${pruningEfficiency}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Clustering Depth Metrics */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                            <h4 className="font-bold text-white mb-3">📊 Clustering Metrics</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                                    <span className="text-sm text-slate-400">Average Depth</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xl font-bold mono ${isClustered ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {calculateDepth(currentData)}
                                        </span>
                                        <span className="text-xs text-slate-500">(lower = better)</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                                    <span className="text-sm text-slate-400">Overlap Factor</span>
                                    <span className={`text-xl font-bold mono ${isClustered ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {isClustered ? '0%' : '67%'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                                    <span className="text-sm text-slate-400">Status</span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${isClustered ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                                        }`}>
                                        {isClustered ? 'OPTIMIZED' : 'NEEDS RECLUSTERING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SQL Reference */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                    <h4 className="font-bold text-white mb-3">📜 SQL Commands for Clustering</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 rounded-lg p-4">
                            <div className="text-xs text-cyan-400 font-bold mb-2">Add Clustering Key</div>
                            <pre className="text-[11px] mono text-slate-400">{`ALTER TABLE fct_sales
CLUSTER BY (order_date, region);`}</pre>
                        </div>
                        <div className="bg-slate-950 rounded-lg p-4">
                            <div className="text-xs text-cyan-400 font-bold mb-2">Check Clustering Info</div>
                            <pre className="text-[11px] mono text-slate-400">{`SELECT SYSTEM$CLUSTERING_INFORMATION(
  'fct_sales', '(order_date)'
);`}</pre>
                        </div>
                        <div className="bg-slate-950 rounded-lg p-4">
                            <div className="text-xs text-cyan-400 font-bold mb-2">Manual Recluster</div>
                            <pre className="text-[11px] mono text-slate-400">{`ALTER TABLE fct_sales RECLUSTER;
-- Uses credits from warehouse`}</pre>
                        </div>
                        <div className="bg-slate-950 rounded-lg p-4">
                            <div className="text-xs text-cyan-400 font-bold mb-2">Suspend Auto-Clustering</div>
                            <pre className="text-[11px] mono text-slate-400">{`ALTER TABLE fct_sales 
SUSPEND RECLUSTER;`}</pre>
                        </div>
                    </div>
                </div>

                {/* Interview Tips */}
                {showMetrics && (
                    <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-xl p-5 animate-slide">
                        <h4 className="text-green-400 font-bold mb-3">🎉 Key Interview Talking Points</h4>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>• <strong>Clustering depth</strong> = average # of partitions containing overlapping values. Lower is better.</li>
                            <li>• <strong>Auto-reclustering</strong> runs in background when data changes. Consumes credits from Snowflake account.</li>
                            <li>• Choose clustering keys based on <strong>most common WHERE/JOIN columns</strong>.</li>
                            <li>• <strong>Don't cluster</strong> on high-cardinality columns (like UUID) or frequently updated columns.</li>
                            <li>• In your VPI project: Clustering on <strong>(order_date, plant_code)</strong> would optimize your Power BI report queries!</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SnowflakeClusteringViz;
