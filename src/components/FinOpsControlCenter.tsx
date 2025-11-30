import React, { useState, useEffect } from 'react';

const FinOpsControlCenter = () => {
    // Cost Engine State
    const [warehouseSize, setWarehouseSize] = useState(1); // $/hr
    const [isProcessing, setIsProcessing] = useState(false);
    const [isIdleBilling, setIsIdleBilling] = useState(false);
    const [cost, setCost] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [processedRows, setProcessedRows] = useState(0);

    // Power BI State
    const [biMode, setBiMode] = useState<'import' | 'directquery'>('import');
    const [biRefreshCost, setBiRefreshCost] = useState(0);
    const [showLaserBeam, setShowLaserBeam] = useState(false);
    const [warehouseWoken, setWarehouseWoken] = useState(false);

    // Budget & Serverless
    const [maxBudget, setMaxBudget] = useState(10);
    const [budgetExceeded, setBudgetExceeded] = useState(false);
    const [serverlessMode, setServerlessMode] = useState(false);

    // Algorithm comparison
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<'hash' | 'bruteforce'>('hash');

    const warehouseSizes = [
        { name: 'X-Small', rate: 1, icon: '🚗' },
        { name: 'Small', rate: 2, icon: '🚙' },
        { name: 'Medium', rate: 4, icon: '🚚' },
        { name: 'Large', rate: 8, icon: '🚛' },
        { name: 'X-Large', rate: 16, icon: '✈️' },
        { name: '2X-Large', rate: 32, icon: '🚀' },
        { name: '3X-Large', rate: 64, icon: '🛸' },
        { name: '4X-Large', rate: 128, icon: '🌌' },
    ];

    const currentWH = warehouseSizes.find(w => w.rate === warehouseSize) || warehouseSizes[0];

    // Real-time cost ticker
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isProcessing || isIdleBilling) {
            interval = setInterval(() => {
                const rate = serverlessMode ? warehouseSize * 1.25 : warehouseSize;
                const increment = rate / 3600; // Per-second cost
                setCost(prev => {
                    const newCost = prev + increment;
                    if (newCost > maxBudget && !budgetExceeded) {
                        setBudgetExceeded(true);
                    }
                    return newCost;
                });
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isProcessing, isIdleBilling, warehouseSize, maxBudget, budgetExceeded, serverlessMode]);

    // Run processing simulation
    const runProcessing = () => {
        setIsProcessing(true);
        setCost(0);
        setElapsedTime(0);
        setProcessedRows(0);
        setBudgetExceeded(false);
        setIsIdleBilling(false);

        const duration = selectedAlgorithm === 'hash' ? 5 : 15; // seconds
        const totalRows = 1000000;
        let currentRow = 0;

        const rowInterval = setInterval(() => {
            currentRow += totalRows / (duration * 10);
            setProcessedRows(Math.min(currentRow, totalRows));
        }, 100);

        setTimeout(() => {
            clearInterval(rowInterval);
            setProcessedRows(totalRows);
            setIsProcessing(false);

            // Start idle billing (unless serverless)
            if (!serverlessMode) {
                setIsIdleBilling(true);
                setTimeout(() => {
                    setIsIdleBilling(false);
                }, 5000); // 5 seconds of idle billing
            }
        }, duration * 1000);
    };

    // Power BI DirectQuery simulation
    const simulateDashboardClicks = () => {
        setShowLaserBeam(true);
        setWarehouseWoken(true);

        // Spike the cost
        const clickCost = (warehouseSize / 3600) * 50; // 50 seconds worth of compute
        setCost(prev => prev + clickCost);
        setBiRefreshCost(prev => prev + clickCost);

        setTimeout(() => setShowLaserBeam(false), 2000);
        setTimeout(() => setWarehouseWoken(false), 5000);
    };

    // Import mode refresh
    const runImportRefresh = () => {
        const refreshCost = 0.25; // One-time small cost
        setBiRefreshCost(prev => prev + refreshCost);
        setCost(prev => prev + refreshCost);
    };

    // Calculate algorithm costs for 1TB data
    const hashCost = (2.50).toFixed(2);
    const bruteForceCost = (450.00).toFixed(2);

    const reset = () => {
        setCost(0);
        setElapsedTime(0);
        setProcessedRows(0);
        setIsProcessing(false);
        setIsIdleBilling(false);
        setBudgetExceeded(false);
        setBiRefreshCost(0);
        setWarehouseWoken(false);
    };

    return (
        <div className={`h-full p-6 overflow-y-auto transition-all ${budgetExceeded ? 'ring-4 ring-red-500 animate-pulse' : ''
            }`}>
            <div className="max-w-6xl mx-auto">

                {/* Budget Alert */}
                {budgetExceeded && (
                    <div className="mb-6 p-4 bg-red-900/50 border-2 border-red-500 rounded-xl animate-pulse">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">⚠️</span>
                            <div>
                                <div className="text-red-400 font-bold text-lg">BUDGET EXCEEDED!</div>
                                <div className="text-sm text-slate-300">
                                    Stop the warehouse immediately!
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Compute & Algorithm */}
                    <div className="space-y-6">
                        {/* Warehouse Control */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                ❄️ Compute Engine
                            </h3>

                            {/* Serverless Toggle */}
                            <div className="flex items-center justify-between mb-4 p-3 bg-slate-800 rounded-lg">
                                <span className="text-sm text-slate-300">Serverless Mode</span>
                                <button
                                    onClick={() => setServerlessMode(!serverlessMode)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${serverlessMode ? 'bg-cyan-600' : 'bg-slate-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${serverlessMode ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Warehouse Size Slider */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Warehouse Size</span>
                                    <span className="font-bold text-cyan-400">{currentWH.name} (${currentWH.rate}/hr)</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="128"
                                    step="1" // Simplified step for demo
                                    value={warehouseSize}
                                    onChange={(e) => {
                                        // Snap to nearest power of 2
                                        const val = parseInt(e.target.value);
                                        const nearest = warehouseSizes.reduce((prev, curr) =>
                                            Math.abs(curr.rate - val) < Math.abs(prev.rate - val) ? curr : prev
                                        );
                                        setWarehouseSize(nearest.rate);
                                    }}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    disabled={isProcessing || isIdleBilling}
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>XS</span>
                                    <span>4XL</span>
                                </div>
                            </div>

                            {/* Algorithm Selection */}
                            <div className="mb-6">
                                <div className="text-sm text-slate-400 mb-2">Query Algorithm</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setSelectedAlgorithm('hash')}
                                        className={`p-3 rounded-lg border transition ${selectedAlgorithm === 'hash'
                                            ? 'bg-green-900/30 border-green-500 text-green-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                    >
                                        <div className="font-bold">Hash Join</div>
                                        <div className="text-xs">O(N) - Fast</div>
                                    </button>
                                    <button
                                        onClick={() => setSelectedAlgorithm('bruteforce')}
                                        className={`p-3 rounded-lg border transition ${selectedAlgorithm === 'bruteforce'
                                            ? 'bg-red-900/30 border-red-500 text-red-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                    >
                                        <div className="font-bold">Nested Loop</div>
                                        <div className="text-xs">O(N²) - Slow</div>
                                    </button>
                                </div>
                            </div>

                            {/* Simulation Status */}
                            {(isProcessing || isIdleBilling) && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Rows Processed</span>
                                        <span>{(processedRows / 1000000 * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${selectedAlgorithm === 'hash' ? 'bg-green-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${(processedRows / 1000000) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Run Button */}
                            <div className="flex gap-2">
                                <button
                                    onClick={runProcessing}
                                    disabled={isProcessing || isIdleBilling}
                                    className={`flex-1 py-3 rounded-lg font-bold transition ${isProcessing || isIdleBilling ? 'bg-yellow-600 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'
                                        } text-white`}
                                >
                                    {isProcessing ? '⚙️ Processing...' : isIdleBilling ? '💤 Idle Billing...' : '▶ Run Query'}
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-4 py-3 rounded-lg font-bold bg-slate-700 hover:bg-slate-600 text-white"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Budget Control */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
                            <h4 className="text-sm font-bold text-white mb-3">💸 Budget Cap</h4>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={maxBudget}
                                    onChange={(e) => setMaxBudget(parseFloat(e.target.value) || 0)}
                                    className="w-24 p-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-center"
                                    step="0.5"
                                    min="0"
                                />
                                <span className="text-slate-400">Max Budget ($)</span>
                                <div className={`ml-auto px-3 py-1 rounded-lg text-sm font-bold ${cost > maxBudget ? 'bg-red-600 text-white' :
                                    cost > maxBudget * 0.8 ? 'bg-yellow-600 text-white' :
                                        'bg-green-600 text-white'
                                    }`}>
                                    {((cost / maxBudget) * 100).toFixed(0)}% used
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Power BI & Algorithm Costs */}
                    <div>
                        {/* Power BI Simulator */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                📊 Power BI Connection Mode
                            </h3>

                            {/* Mode Toggle */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setBiMode('import')}
                                    className={`flex-1 p-3 rounded-lg font-semibold transition ${biMode === 'import'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    📄 Import Mode
                                </button>
                                <button
                                    onClick={() => setBiMode('directquery')}
                                    className={`flex-1 p-3 rounded-lg font-semibold transition ${biMode === 'directquery'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                        }`}
                                >
                                    ⚡ DirectQuery
                                </button>
                            </div>

                            {/* Visual */}
                            <div className="relative bg-slate-800 rounded-xl p-6 mb-4">
                                <div className="flex items-center justify-around">
                                    {/* Power BI Icon */}
                                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all ${biMode === 'import' ? 'bg-green-900/50 border-2 border-green-500' : 'bg-orange-900/50 border-2 border-orange-500'
                                        }`}>
                                        <span className="text-3xl">📊</span>
                                        {biMode === 'import' && (
                                            <div className="absolute -bottom-2 text-xs bg-green-600 px-2 rounded text-white">VertiPaq</div>
                                        )}
                                    </div>

                                    {/* Laser Beam */}
                                    {showLaserBeam && (
                                        <div className="absolute left-1/4 right-1/4 h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-cyan-500 animate-pulse rounded" />
                                    )}

                                    {/* Arrow */}
                                    <div className="text-2xl text-slate-600">
                                        {biMode === 'directquery' ? '⚡→' : '📉'}
                                    </div>

                                    {/* Snowflake Icon */}
                                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all ${warehouseWoken
                                        ? 'bg-red-900/50 border-2 border-red-500 animate-pulse shadow-lg shadow-red-500/30'
                                        : 'bg-cyan-900/50 border-2 border-cyan-500'
                                        }`}>
                                        <span className="text-3xl">❄️</span>
                                    </div>
                                </div>

                                {/* Warehouse Woken Alert */}
                                {warehouseWoken && (
                                    <div className="mt-4 p-2 bg-red-900/30 border border-red-500/50 rounded-lg text-center text-red-400 text-sm animate-pulse">
                                        ⚠️ Warehouse Woken Up by BI User!
                                    </div>
                                )}
                            </div>

                            {/* Actions based on mode */}
                            {biMode === 'import' ? (
                                <div>
                                    <button
                                        onClick={runImportRefresh}
                                        className="w-full py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 text-white mb-2"
                                    >
                                        🔄 Run Data Refresh (One-time cost)
                                    </button>
                                    <div className="text-xs text-slate-500 text-center">
                                        Cost: $0.25 per refresh • User clicks = FREE (local VertiPaq)
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <button
                                        onClick={simulateDashboardClicks}
                                        className="w-full py-3 rounded-lg font-bold bg-orange-600 hover:bg-orange-500 text-white mb-2"
                                    >
                                        🖱️ Simulate 50 User Dashboard Clicks
                                    </button>
                                    <div className="text-xs text-slate-500 text-center">
                                        Each click = Query to Snowflake = Warehouse wake-up!
                                    </div>
                                </div>
                            )}

                            {/* BI Cost Display */}
                            <div className="mt-4 p-3 bg-slate-800 rounded-lg flex justify-between">
                                <span className="text-slate-400">BI-Related Costs:</span>
                                <span className={`font-bold ${biRefreshCost > 1 ? 'text-red-400' : 'text-green-400'}`}>
                                    ${biRefreshCost.toFixed(4)}
                                </span>
                            </div>
                        </div>

                        {/* O(N) vs O(N²) Financial Impact */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">📈 Algorithm Cost Impact (1TB Data)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Good Code */}
                                <div className="p-4 rounded-xl bg-green-900/20 border-2 border-green-500">
                                    <div className="text-xs text-green-400 uppercase mb-1">Good Code (Hashing)</div>
                                    <div className="text-xs text-slate-500 mb-2">O(N) • Linear Time</div>
                                    <div className="text-4xl font-bold text-green-400">${hashCost}</div>
                                    <div className="mt-2 text-xs text-slate-400">
                                        ~5 min on X-Large
                                    </div>
                                </div>

                                {/* Bad Code */}
                                <div className="p-4 rounded-xl bg-red-900/20 border-2 border-red-500">
                                    <div className="text-xs text-red-400 uppercase mb-1">Bad Code (Brute Force)</div>
                                    <div className="text-xs text-slate-500 mb-2">O(N²) • Quadratic Time</div>
                                    <div className="text-4xl font-bold text-red-400">${bruteForceCost}</div>
                                    <div className="mt-2 text-xs text-slate-400">
                                        ~6 hrs on X-Large
                                    </div>
                                </div>
                            </div>

                            {/* Comparison */}
                            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                                <div className="text-center">
                                    <span className="text-yellow-400 font-bold">💸 Bad code costs </span>
                                    <span className="text-3xl font-bold text-yellow-400">180x</span>
                                    <span className="text-yellow-400 font-bold"> more!</span>
                                </div>
                                <div className="text-xs text-slate-400 text-center mt-2">
                                    At scale, algorithm choice is a FinOps decision!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interview Tips */}
                <div className="mt-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5">
                    <h4 className="text-emerald-400 font-bold mb-3">🎉 FinOps Interview Talking Points</h4>
                    <ul className="text-sm text-slate-300 space-y-2 grid grid-cols-2 gap-4">
                        <li>• <strong>Auto-Suspend:</strong> Always set 60s or less. Idle billing is pure waste.</li>
                        <li>• <strong>Serverless:</strong> 1.25x rate but $0 idle. Good for sporadic workloads.</li>
                        <li>• <strong>Power BI Import:</strong> One-time refresh cost, unlimited user queries.</li>
                        <li>• <strong>DirectQuery:</strong> Real-time but each click = warehouse wake-up cost.</li>
                        <li>• <strong>O(N) vs O(N²):</strong> Code review isn't just about quality - it's FinOps!</li>
                        <li>• <strong>VPI Context:</strong> Use Import for dashboards, DirectQuery only for real-time KPIs.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default FinOpsControlCenter;
