import React, { useState } from 'react';

const OBTVisualizer = () => {
    const [isOBT, setIsOBT] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);

    const factColumns = [
        { name: 'order_id', type: 'PK' },
        { name: 'date_key', type: 'FK' },
        { name: 'product_key', type: 'FK' },
        { name: 'customer_key', type: 'FK' },
        { name: 'quantity', type: 'MEASURE' },
        { name: 'amount', type: 'MEASURE' },
    ];

    const obtColumns = [
        { name: 'order_id', source: 'fact', color: 'purple' },
        { name: 'quantity', source: 'fact', color: 'purple' },
        { name: 'amount', source: 'fact', color: 'purple' },
        { name: 'full_date', source: 'date', color: 'blue' },
        { name: 'month', source: 'date', color: 'blue' },
        { name: 'year', source: 'date', color: 'blue' },
        { name: 'product_name', source: 'product', color: 'green' },
        { name: 'category', source: 'product', color: 'green' },
        { name: 'brand', source: 'product', color: 'green' },
        { name: 'customer_name', source: 'customer', color: 'orange' },
        { name: 'region', source: 'customer', color: 'orange' },
        { name: 'segment', source: 'customer', color: 'orange' },
    ];

    const denormalize = () => {
        if (isAnimating || isOBT) return;
        setIsAnimating(true);
        setTimeout(() => {
            setIsOBT(true);
            setIsAnimating(false);
            setShowMetrics(true);
        }, 1500);
    };

    const reset = () => {
        setIsOBT(false);
        setShowMetrics(false);
    };

    const getColorClass = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            blue: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
            green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
            orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
            purple: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
        };
        return colors[color] || colors.purple;
    };

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {isOBT ? '📊 One Big Table (OBT)' : '⭐ Star Schema'}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {isOBT
                                ? 'All dimensions denormalized into a single wide table'
                                : 'Normalized design with fact table and dimension tables'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={denormalize}
                            disabled={isAnimating || isOBT}
                            className={`px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${isAnimating ? 'bg-yellow-600 text-white animate-pulse' :
                                    isOBT ? 'bg-green-600 text-white cursor-default' :
                                        'bg-purple-600 hover:bg-purple-500 text-white'
                                }`}
                        >
                            {isAnimating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Denormalizing...
                                </>
                            ) : isOBT ? (
                                <>✓ OBT Created</>
                            ) : (
                                <>🔄 Denormalize to OBT</>
                            )}
                        </button>
                        {isOBT && (
                            <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Visualization */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 mb-6 min-h-[500px] relative overflow-hidden">

                    {!isOBT ? (
                        /* Star Schema View */
                        <div className="relative h-[420px]">

                            {/* DIM_DATE - Top */}
                            <div
                                className={`absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ${isAnimating ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                                    }`}
                                style={{ top: '0px' }}
                            >
                                <div className="bg-blue-500/20 border-2 border-blue-500 rounded-xl p-3 w-44">
                                    <div className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
                                        <span>○</span> Dimension
                                    </div>
                                    <div className="text-sm font-bold text-white mb-2">DIM_DATE</div>
                                    <div className="space-y-1">
                                        {['date_key', 'full_date', 'month', 'year'].map((col, cidx) => (
                                            <div key={cidx} className="text-[10px] mono bg-slate-800/30 px-2 py-0.5 rounded text-slate-400">
                                                {col}
                                            </div>
                                        ))}
                                        <div className="text-[10px] text-slate-500">+2 more...</div>
                                    </div>
                                </div>
                                {/* Connection line to fact */}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-8 bg-blue-500/50" style={{ background: 'linear-gradient(to bottom, #3b82f6, transparent)' }}></div>
                            </div>

                            {/* Center Fact Table */}
                            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-500 ${isAnimating ? 'scale-110' : ''}`}>
                                <div className="bg-purple-900/40 border-2 border-purple-500 rounded-xl p-4 w-56 shadow-lg shadow-purple-500/20">
                                    <div className="text-xs font-bold text-purple-400 uppercase mb-2 flex items-center gap-2">
                                        <span>◆</span> Fact Table
                                    </div>
                                    <div className="text-sm font-bold text-white mb-3">FCT_SALES_ORDER</div>
                                    <div className="space-y-1">
                                        {factColumns.map((col, idx) => (
                                            <div key={idx} className="text-[10px] mono bg-slate-800/50 px-2 py-1 rounded flex justify-between">
                                                <span className="text-slate-300">{col.name}</span>
                                                <span className={`${col.type === 'PK' ? 'text-yellow-400' : col.type === 'FK' ? 'text-cyan-400' : 'text-green-400'}`}>
                                                    {col.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* DIM_PRODUCT - Left */}
                            <div
                                className={`absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ${isAnimating ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                                    }`}
                                style={{ left: '40px' }}
                            >
                                <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-3 w-44">
                                    <div className="text-xs font-bold text-green-400 uppercase mb-2 flex items-center gap-1">
                                        <span>○</span> Dimension
                                    </div>
                                    <div className="text-sm font-bold text-white mb-2">DIM_PRODUCT</div>
                                    <div className="space-y-1">
                                        {['product_key', 'product_name', 'category', 'brand'].map((col, cidx) => (
                                            <div key={cidx} className="text-[10px] mono bg-slate-800/30 px-2 py-0.5 rounded text-slate-400">
                                                {col}
                                            </div>
                                        ))}
                                        <div className="text-[10px] text-slate-500">+1 more...</div>
                                    </div>
                                </div>
                                {/* Connection line to fact */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-12 h-0.5" style={{ background: 'linear-gradient(to right, #22c55e, transparent)' }}></div>
                            </div>

                            {/* DIM_CUSTOMER - Right */}
                            <div
                                className={`absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ${isAnimating ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                                    }`}
                                style={{ right: '40px' }}
                            >
                                <div className="bg-orange-500/20 border-2 border-orange-500 rounded-xl p-3 w-44">
                                    <div className="text-xs font-bold text-orange-400 uppercase mb-2 flex items-center gap-1">
                                        <span>○</span> Dimension
                                    </div>
                                    <div className="text-sm font-bold text-white mb-2">DIM_CUSTOMER</div>
                                    <div className="space-y-1">
                                        {['customer_key', 'customer_name', 'region', 'segment'].map((col, cidx) => (
                                            <div key={cidx} className="text-[10px] mono bg-slate-800/30 px-2 py-0.5 rounded text-slate-400">
                                                {col}
                                            </div>
                                        ))}
                                        <div className="text-[10px] text-slate-500">+1 more...</div>
                                    </div>
                                </div>
                                {/* Connection line to fact */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-12 h-0.5" style={{ background: 'linear-gradient(to left, #f97316, transparent)' }}></div>
                            </div>
                        </div>
                    ) : (
                        /* OBT View */
                        <div className="animate-slide">
                            <div className="bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-orange-900/30 border-2 border-purple-500 rounded-xl p-6 max-w-2xl mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2">
                                            <span>▣</span> One Big Table
                                        </div>
                                        <div className="text-lg font-bold text-white">OBT_SALES_DENORMALIZED</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">Columns</div>
                                        <div className="text-2xl font-bold text-cyan-400">{obtColumns.length}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {obtColumns.map((col, idx) => {
                                        const colors = getColorClass(col.color);
                                        return (
                                            <div
                                                key={idx}
                                                className={`${colors.bg} border ${colors.border} rounded-lg px-2 py-1.5 text-[10px] mono animate-slide`}
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <span className={colors.text}>{col.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-purple-500"></span>
                                        <span className="text-slate-400">Fact</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-blue-500"></span>
                                        <span className="text-slate-400">Date</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-green-500"></span>
                                        <span className="text-slate-400">Product</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-orange-500"></span>
                                        <span className="text-slate-400">Customer</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Metrics Comparison */}
                <div className="grid grid-cols-2 gap-6">
                    <div className={`bg-slate-900 rounded-xl border p-5 transition-all ${!isOBT ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-700'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">⭐</span>
                            <h4 className="font-bold text-white">Star Schema</h4>
                            {!isOBT && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded">CURRENT</span>}
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Storage</span>
                                <span className="text-green-400 font-semibold">✓ Low (Normalized)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Query CPU</span>
                                <span className="text-yellow-400 font-semibold">⚠ High (JOINs)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Flexibility</span>
                                <span className="text-green-400 font-semibold">✓ High</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Maintenance</span>
                                <span className="text-yellow-400 font-semibold">⚠ Multiple tables</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                            <div className="text-xs text-slate-500 mb-1">Best For</div>
                            <div className="text-xs text-slate-300">Traditional DW, Power BI DirectQuery, Complex ad-hoc analysis</div>
                        </div>
                    </div>

                    <div className={`bg-slate-900 rounded-xl border p-5 transition-all ${isOBT ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">📊</span>
                            <h4 className="font-bold text-white">One Big Table (OBT)</h4>
                            {isOBT && <span className="text-xs bg-cyan-500 text-white px-2 py-0.5 rounded">CURRENT</span>}
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Storage</span>
                                <span className="text-yellow-400 font-semibold">⚠ High (Redundant)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Query CPU</span>
                                <span className="text-green-400 font-semibold">✓ Zero (No JOINs)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Flexibility</span>
                                <span className="text-yellow-400 font-semibold">⚠ Limited</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Maintenance</span>
                                <span className="text-green-400 font-semibold">✓ Single table</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                            <div className="text-xs text-slate-500 mb-1">Best For</div>
                            <div className="text-xs text-slate-300">Snowflake (storage cheap!), ML features, Simple dashboards, Fast aggregations</div>
                        </div>
                    </div>
                </div>

                {/* Interview Tips */}
                {showMetrics && (
                    <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-xl p-5 animate-slide">
                        <h4 className="text-purple-400 font-bold mb-3">🎯 Interview Talking Points</h4>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>• <strong>Why OBT in Snowflake?</strong> Storage is cheap, compute is expensive. OBT eliminates JOINs = faster queries.</li>
                            <li>• <strong>Trade-off:</strong> OBT works great for read-heavy analytics. Star Schema better for complex, evolving requirements.</li>
                            <li>• <strong>Your VPI context:</strong> For your 29 Power BI reports, OBT could reduce query time significantly!</li>
                            <li>• <strong>Hybrid approach:</strong> Use DBT to create both - Star Schema as source of truth, OBT as materialized view for BI.</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OBTVisualizer;
