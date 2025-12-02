import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, Play, Pause, RotateCcw, SkipForward, AlertCircle, Zap, TrendingUp, ArrowDown } from 'lucide-react';

/**
 * TimeSeriesSimulator.tsx - "Time Travel Debugger" Edition
 * 
 * PURPOSE: Step-by-step visualization of time-series join algorithms
 * PATTERN: Matches CTESimulator's "slow-motion debugger" approach
 * 
 * BUG FIXES:
 * - Removed complex SVG polylines (caused black screen crash)
 * - Fixed typo in resetGapFill function
 * - Simplified rendering to stable div-based animations
 * 
 * VISUALIZATION MODES:
 * 1. ASOF JOIN - "Backward Scanner" showing how trades match to quotes
 * 2. GAP FILLING - "Bucket Filler" with pipe/bridge metaphors
 */

type TabType = 'asof' | 'gapfill';
type FillMethod = 'lastvalue' | 'linear';

interface TradeEvent {
    id: number;
    timestamp: string;
    symbol: string;
    price: number;
    quantity: number;
}

interface QuoteEvent {
    id: number;
    timestamp: string;
    symbol: string;
    bidPrice: number;
    askPrice: number;
}

interface JoinResult {
    tradeId: number;
    tradeTime: string;
    price: number;
    quoteTime: string;
    bid: number;
    ask: number;
}

interface TimeBucket {
    timestamp: number;
    value: number | null;
    filled?: number;
    synthetic?: boolean;
}

const TimeSeriesSimulator = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<TabType>('asof');

    // === ASOF JOIN STATE ===
    const [asofStep, setAsofStep] = useState(0);
    const [isAsofAutoPlaying, setIsAsofAutoPlaying] = useState(false);
    const [currentTradeIndex, setCurrentTradeIndex] = useState(-1);
    const [scannerPosition, setScannerPosition] = useState(-1);
    const [rejectedQuoteId, setRejectedQuoteId] = useState<number | null>(null);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
    const [joinResults, setJoinResults] = useState<JoinResult[]>([]);
    const [asofInsight, setAsofInsight] = useState('');

    // === GAP FILL STATE ===
    const [gapFillStep, setGapFillStep] = useState(0);
    const [isGapAutoPlaying, setIsGapAutoPlaying] = useState(false);
    const [fillMethod, setFillMethod] = useState<FillMethod>('lastvalue');
    const [bucketScanPosition, setBucketScanPosition] = useState(-1);
    const [filledBuckets, setFilledBuckets] = useState<TimeBucket[]>([]);
    const [gapInsight, setGapInsight] = useState('');
    const [showPipe, setShowPipe] = useState(false);
    const [showBridge, setShowBridge] = useState(false);

    // Sample Data
    const trades: TradeEvent[] = [
        { id: 1, timestamp: '10:02', symbol: 'AAPL', price: 150.25, quantity: 100 },
        { id: 2, timestamp: '10:05', symbol: 'AAPL', price: 150.50, quantity: 200 },
        { id: 3, timestamp: '10:11', symbol: 'AAPL', price: 150.75, quantity: 150 },
        { id: 4, timestamp: '10:14', symbol: 'AAPL', price: 151.00, quantity: 300 }
    ];

    const quotes: QuoteEvent[] = [
        { id: 1, timestamp: '10:00', symbol: 'AAPL', bidPrice: 150.00, askPrice: 150.10 },
        { id: 2, timestamp: '10:04', symbol: 'AAPL', bidPrice: 150.20, askPrice: 150.30 },
        { id: 3, timestamp: '10:07', symbol: 'AAPL', bidPrice: 150.45, askPrice: 150.55 },
        { id: 4, timestamp: '10:09', symbol: 'AAPL', bidPrice: 150.60, askPrice: 150.70 },
        { id: 5, timestamp: '10:12', symbol: 'AAPL', bidPrice: 150.80, askPrice: 150.90 }
    ];

    const rawBuckets: TimeBucket[] = [
        { timestamp: 0, value: 75 },
        { timestamp: 1, value: 78 },
        { timestamp: 2, value: null },
        { timestamp: 3, value: null },
        { timestamp: 4, value: 85 },
        { timestamp: 5, value: 87 },
        { timestamp: 6, value: null },
        { timestamp: 7, value: 82 },
        { timestamp: 8, value: 80 }
    ];

    // ASOF JOIN Step Handler
    const handleAsofNextStep = () => {
        if (currentTradeIndex >= trades.length - 1 && asofStep >= 4) {
            setAsofInsight('✅ ASOF JOIN Complete! All trades matched to closest preceding quotes.');
            setIsAsofAutoPlaying(false);
            return;
        }

        const stepInCycle = asofStep % 5;

        if (stepInCycle === 0) {
            // Step 1: New Trade Arrival
            const nextTradeIdx = currentTradeIndex + 1;
            setCurrentTradeIndex(nextTradeIdx);
            setScannerPosition(-1);
            setRejectedQuoteId(null);
            setSelectedQuoteId(null);
            setAsofInsight(`📥 Trade ${trades[nextTradeIdx].id} arrives at ${trades[nextTradeIdx].timestamp}. Initiating ASOF JOIN search...`);
        } else if (stepInCycle === 1) {
            // Step 2: Scanner Activates
            setScannerPosition(quotes.length - 1);
            setAsofInsight('🔍 Scanner beam activates: Starting from LATEST quote, scanning BACKWARD in time...');
        } else if (stepInCycle === 2) {
            // Step 3: Rejection (Future Quote)
            const trade = trades[currentTradeIndex];
            let futureQuoteId: number | null = null;

            for (let i = quotes.length - 1; i >= 0; i--) {
                if (quotes[i].timestamp > trade.timestamp) {
                    futureQuoteId = quotes[i].id;
                    setScannerPosition(i);
                    break;
                }
            }

            if (futureQuoteId) {
                setRejectedQuoteId(futureQuoteId);
                const rejectedQuote = quotes.find(q => q.id === futureQuoteId);
                setAsofInsight(`❌ REJECT: Quote at ${rejectedQuote?.timestamp} is FUTURE data (after ${trade.timestamp}). ASOF JOIN rule: Only use PAST/PRESENT timestamps!`);
            } else {
                setAsofInsight('⏩ No future quotes to reject. Moving directly to selection...');
            }
        } else if (stepInCycle === 3) {
            // Step 4: Selection (Find Closest PAST Quote)
            const trade = trades[currentTradeIndex];
            let selectedQuote: QuoteEvent | null = null;

            for (let i = quotes.length - 1; i >= 0; i--) {
                if (quotes[i].timestamp <= trade.timestamp) {
                    selectedQuote = quotes[i];
                    setScannerPosition(i);
                    break;
                }
            }

            if (selectedQuote) {
                setSelectedQuoteId(selectedQuote.id);
                setAsofInsight(`✅ SELECT: Quote at ${selectedQuote.timestamp} is the closest PAST quote to Trade ${trade.timestamp}. Perfect MATCH!`);
            } else {
                setAsofInsight('⚠️ No valid past quote found. This trade will have NULL quote values.');
            }
        } else if (stepInCycle === 4) {
            // Step 5: Merge & Drop into Result
            const trade = trades[currentTradeIndex];
            const selectedQuote = quotes.find(q => q.id === selectedQuoteId);

            if (selectedQuote) {
                const result: JoinResult = {
                    tradeId: trade.id,
                    tradeTime: trade.timestamp,
                    price: trade.price,
                    quoteTime: selectedQuote.timestamp,
                    bid: selectedQuote.bidPrice,
                    ask: selectedQuote.askPrice
                };
                setJoinResults(prev => [...prev, result]);
                setAsofInsight(`📊 Result row created: Trade ${trade.id} joined with Quote. Dropped into output table!`);
            }

            // Reset visual state for next trade
            setTimeout(() => {
                setScannerPosition(-1);
                setRejectedQuoteId(null);
                setSelectedQuoteId(null);
            }, 800);
        }

        setAsofStep(asofStep + 1);
    };

    // Gap Fill Step Handler
    const handleGapFillNextStep = () => {
        if (bucketScanPosition >= rawBuckets.length - 1) {
            setGapInsight(`✅ Gap Filling Complete! Method: ${fillMethod === 'lastvalue' ? 'IGNORE NULLS (Last Value)' : 'LINEAR INTERPOLATION'}`);
            setIsGapAutoPlaying(false);
            return;
        }

        const nextPos = bucketScanPosition + 1;
        setBucketScanPosition(nextPos);

        const currentBucket = rawBuckets[nextPos];
        setShowPipe(false);
        setShowBridge(false);

        if (currentBucket.value !== null) {
            // Has value - just copy it
            setFilledBuckets(prev => [...prev, { ...currentBucket, filled: currentBucket.value }]);
            setGapInsight(`✅ Bucket ${nextPos}: Contains value (${currentBucket.value}). No filling needed.`);
        } else {
            // NULL - needs filling
            if (fillMethod === 'lastvalue') {
                const lastValue = filledBuckets[filledBuckets.length - 1]?.filled || null;
                setShowPipe(true);

                setTimeout(() => {
                    setFilledBuckets(prev => [...prev, { ...currentBucket, filled: lastValue, synthetic: false }]);
                    setGapInsight(`� Bucket ${nextPos}: NULL detected. CARRY FORWARD last value (${lastValue}) using IGNORE NULLS. Piping liquid...`);
                }, 400);
            } else {
                // Linear interpolation
                let nextNonNullIdx = -1;
                let nextValue: number | null = null;

                for (let i = nextPos + 1; i < rawBuckets.length; i++) {
                    if (rawBuckets[i].value !== null) {
                        nextNonNullIdx = i;
                        nextValue = rawBuckets[i].value as number;
                        break;
                    }
                }

                const lastValue = filledBuckets[filledBuckets.length - 1]?.filled;

                if (lastValue !== null && lastValue !== undefined && nextValue !== null) {
                    const gapSize = nextNonNullIdx - (nextPos - 1);
                    const step = (nextValue - lastValue) / gapSize;
                    const interpolated = Math.round(lastValue + step);

                    setShowBridge(true);

                    setTimeout(() => {
                        setFilledBuckets(prev => [...prev, { ...currentBucket, filled: interpolated, synthetic: true }]);
                        setGapInsight(`🌉 Bucket ${nextPos}: Linear bridge built! Interpolate: ${lastValue} → ${nextValue}. Calculated: ${interpolated}`);
                    }, 500);
                } else {
                    setFilledBuckets(prev => [...prev, { ...currentBucket, filled: lastValue || null, synthetic: false }]);
                    setGapInsight(`⚠️ Bucket ${nextPos}: Cannot interpolate (missing future value). Fallback to last value.`);
                }
            }
        }
        setGapFillStep(gapFillStep + 1);
    };

    // Auto-Play
    useEffect(() => {
        if (!isAsofAutoPlaying) return;
        const timer = setTimeout(() => handleAsofNextStep(), 1800);
        return () => clearTimeout(timer);
    }, [isAsofAutoPlaying, asofStep]);

    useEffect(() => {
        if (!isGapAutoPlaying) return;
        const timer = setTimeout(() => handleGapFillNextStep(), 1500);
        return () => clearTimeout(timer);
    }, [isGapAutoPlaying, gapFillStep]);

    // Reset Functions
    const resetAsof = () => {
        setAsofStep(0);
        setIsAsofAutoPlaying(false);
        setCurrentTradeIndex(-1);
        setScannerPosition(-1);
        setRejectedQuoteId(null);
        setSelectedQuoteId(null);
        setJoinResults([]);
        setAsofInsight('Ready to visualize ASOF JOIN algorithm. Click Next Step to begin.');
    };

    const resetGapFill = () => {
        setGapFillStep(0);
        setIsGapAutoPlaying(false);
        setBucketScanPosition(-1);
        setFilledBuckets([]);
        setShowPipe(false);
        setShowBridge(false);
        setGapInsight(`Ready to fill gaps using ${fillMethod === 'lastvalue' ? 'IGNORE NULLS' : 'LINEAR INTERPOLATION'}. Click Next Step.`);
    };

    // Handle tab/method changes
    useEffect(() => {
        if (activeTab === 'asof') {
            resetAsof();
        } else {
            resetGapFill();
        }
    }, [activeTab]);

    useEffect(() => {
        resetGapFill();
    }, [fillMethod]);

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                        <Clock size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Time Series Debugger
                        </h1>
                        <p className="text-xs text-slate-500">Step-by-Step Algorithm Visualization</p>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 shrink-0">
                <button
                    onClick={() => setActiveTab('asof')}
                    className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'asof' ? 'text-white border-cyan-500' : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                >
                    <Zap size={14} /> ASOF JOIN (Backward Scanner)
                </button>
                <button
                    onClick={() => setActiveTab('gapfill')}
                    className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'gapfill' ? 'text-white border-purple-500' : 'text-slate-400 border-transparent hover:text-slate-200'
                        }`}
                >
                    <TrendingUp size={14} /> Gap Filling (Bucket Filler)
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {activeTab === 'asof' ? (
                    /* === ASOF JOIN TAB === */
                    <div className="flex-1 flex flex-col">
                        {/* Controls */}
                        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAsofNextStep}
                                    disabled={currentTradeIndex >= trades.length - 1 && asofStep % 5 === 0}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold flex items-center gap-2 text-sm transition-all"
                                >
                                    <SkipForward size={16} /> Next Step
                                </button>
                                <button
                                    onClick={() => setIsAsofAutoPlaying(!isAsofAutoPlaying)}
                                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm transition-all ${isAsofAutoPlaying ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'
                                        } text-white`}
                                >
                                    {isAsofAutoPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Auto Play</>}
                                </button>
                                <button onClick={resetAsof} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold flex items-center gap-2 text-sm transition-all">
                                    <RotateCcw size={16} /> Reset
                                </button>
                            </div>
                            <div className="text-xs text-slate-400">
                                Step: <span className="text-white font-bold">{asofStep}</span> | Trade: <span className="text-white">{currentTradeIndex + 1}/{trades.length}</span>
                            </div>
                        </div>

                        {/* Engine Room */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-7xl mx-auto grid grid-cols-[1fr_2fr_1fr] gap-6">
                                {/* Left: Trade Stream */}
                                <div>
                                    <div className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                                        📈 Trade Stream (Sparse)
                                    </div>
                                    <div className="space-y-2">
                                        {trades.map((trade, idx) => (
                                            <motion.div
                                                key={trade.id}
                                                initial={{ opacity: 0.3, x: -20 }}
                                                animate={{
                                                    opacity: idx === currentTradeIndex ? 1 : (idx < currentTradeIndex ? 0.5 : 0.3),
                                                    x: idx === currentTradeIndex ? 10 : 0,
                                                    scale: idx === currentTradeIndex ? 1.08 : 1
                                                }}
                                                className={`p-3 rounded-lg border-2 transition-all relative ${
                                                    idx === currentTradeIndex
                                                        ? 'bg-orange-500/30 border-orange-400'
                                                        : 'bg-slate-800/50 border-slate-700'
                                                    }`}
                                                style={idx === currentTradeIndex ? {
                                                    boxShadow: '0 0 30px rgba(251, 146, 60, 0.7), 0 0 60px rgba(251, 146, 60, 0.4)',
                                                    borderWidth: '3px'
                                                } : {}}
                                            >
                                                {/* Pulsing Glow Background */}
                                                {idx === currentTradeIndex && (
                                                    <motion.div
                                                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                        className="absolute -inset-1 bg-orange-500/20 rounded-lg -z-10 blur-sm"
                                                    />
                                                )}
                                                <div className="text-xs text-slate-400 flex items-center justify-between">
                                                    <span>T{trade.id}</span>
                                                    {idx === currentTradeIndex && (
                                                        <motion.span 
                                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                                            transition={{ repeat: Infinity, duration: 1 }}
                                                            className="text-orange-400 font-bold text-[9px] uppercase flex items-center gap-1"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                                            Processing
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <div className={`text-sm font-mono font-bold ${
                                                    idx === currentTradeIndex ? 'text-orange-300' : 'text-white'
                                                }`}>
                                                    {trade.timestamp}
                                                </div>
                                                <div className="text-xs text-slate-300">${trade.price}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Center: Join Processor */}
                                <div>
                                    <div className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                        ⚙️ Join Processor (The Engine)
                                    </div>
                                    <div className="bg-slate-900 rounded-xl border-2 border-slate-800 p-6 min-h-[400px] relative">
                                        {/* Active Trade in Processor */}
                                        <AnimatePresence mode="wait">
                                            {currentTradeIndex >= 0 && (
                                                <motion.div
                                                    key={`trade-${currentTradeIndex}`}
                                                    initial={{ y: -50, opacity: 0, scale: 0.8 }}
                                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                                    exit={{ y: 50, opacity: 0 }}
                                                    transition={{ type: 'spring', stiffness: 200 }}
                                                    className="bg-orange-500/10 border-2 border-orange-500 rounded-lg p-4 mb-4"
                                                >
                                                    <div className="text-xs text-orange-400 font-bold mb-2 flex items-center gap-2">
                                                        🎯 ACTIVE TRADE
                                                    </div>
                                                    <div className="text-sm text-white font-mono font-bold">
                                                        {trades[currentTradeIndex].timestamp} | ${trades[currentTradeIndex].price}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Scanner Beam */}
                                        <AnimatePresence>
                                            {scannerPosition >= 0 && (
                                                <motion.div
                                                    initial={{ scaleY: 0, opacity: 0 }}
                                                    animate={{ scaleY: 1, opacity: 1 }}
                                                    exit={{ scaleY: 0, opacity: 0 }}
                                                    className="absolute top-24 left-1/2 -translate-x-1/2 w-1 h-40 bg-gradient-to-b from-cyan-500 via-cyan-400 to-transparent rounded-full"
                                                    style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.8)' }}
                                                />
                                            )}
                                        </AnimatePresence>

                                        {/* Matched Pair */}
                                        <AnimatePresence>
                                            {selectedQuoteId && (
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ y: 100, opacity: 0, scale: 0.5 }}
                                                    transition={{ type: 'spring', stiffness: 150 }}
                                                    className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4 shadow-lg shadow-green-500/30"
                                                >
                                                    <div className="text-xs text-green-400 font-bold mb-2 flex items-center gap-2">
                                                        ✅ MATCHED PAIR
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className="bg-orange-500/30 px-2 py-1 rounded font-mono text-white font-bold">
                                                            {trades[currentTradeIndex].timestamp}
                                                        </div>
                                                        <ArrowRight size={14} className="text-green-400" />
                                                        <div className="bg-cyan-500/30 px-2 py-1 rounded font-mono text-white font-bold">
                                                            {quotes.find(q => q.id === selectedQuoteId)?.timestamp}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Right: Quote Stream */}
                                <div>
                                    <div className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                        📊 Quote Stream (Continuous)
                                    </div>
                                    <div className="space-y-2">
                                        {quotes.map((quote, idx) => (
                                            <motion.div
                                                key={quote.id}
                                                animate={{
                                                    scale: idx === scannerPosition ? 1.05 : 1,
                                                    borderWidth: idx === scannerPosition ? '3px' : '2px'
                                                }}
                                                transition={{ type: 'spring', stiffness: 300 }}
                                                className={`p-3 rounded-lg border-2 ${quote.id === rejectedQuoteId ? 'bg-red-500/20 border-red-500' :
                                                        quote.id === selectedQuoteId ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/30' :
                                                            idx === scannerPosition ? 'bg-cyan-500/20 border-cyan-500' :
                                                                'bg-slate-800/50 border-slate-700'
                                                    }`}
                                            >
                                                <div className="text-xs text-slate-400">Q{quote.id}</div>
                                                <div className="text-sm font-mono text-white font-bold">{quote.timestamp}</div>
                                                <div className="text-xs text-slate-300">
                                                    ${quote.bidPrice}-${quote.askPrice}
                                                </div>
                                                {quote.id === rejectedQuoteId && (
                                                    <div className="text-[10px] text-red-400 font-bold mt-1 flex items-center gap-1">
                                                        ❌ FUTURE DATA
                                                    </div>
                                                )}
                                                {quote.id === selectedQuoteId && (
                                                    <div className="text-[10px] text-green-400 font-bold mt-1">✅ MATCH</div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Insight Panel */}
                            <div className="max-w-7xl mx-auto mt-6">
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-blue-400 mb-1">ALGORITHM INSIGHT</div>
                                            <div className="text-xs text-slate-300">{asofInsight || 'Ready to begin ASOF JOIN visualization. Click Next Step.'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Educational Panel */}
                                <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                                    <div className="text-xs font-bold text-yellow-400 mb-2">💡 Why ASOF JOIN is Better</div>
                                    <div className="text-xs text-slate-300 space-y-1">
                                        <div>• <strong className="text-yellow-300">Standard JOIN + Filter:</strong> Creates Cartesian product first (TradesCount × QuotesCount), then filters. O(n × m) overhead!</div>
                                        <div>• <strong className="text-yellow-300">ASOF JOIN:</strong> Sorted merge with backward scan. O(n log m) with indexes. Up to 100x faster!</div>
                                        <div>• <strong className="text-yellow-300">Use Case:</strong> Financial data (trades vs quotes), IoT sensors (events vs readings), any time-misaligned streams.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Result Table */}
                            <div className="max-w-7xl mx-auto mt-6">
                                <div className="text-sm font-bold text-green-400 mb-3">📊 Join Results (Output)</div>
                                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-800">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-slate-400">Trade ID</th>
                                                <th className="px-3 py-2 text-left text-slate-400">Trade Time</th>
                                                <th className="px-3 py-2 text-left text-slate-400">Price</th>
                                                <th className="px-3 py-2 text-left text-slate-400">Quote Time</th>
                                                <th className="px-3 py-2 text-left text-slate-400">Bid</th>
                                                <th className="px-3 py-2 text-left text-slate-400">Ask</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <AnimatePresence>
                                                {joinResults.map((result, idx) => (
                                                    <motion.tr
                                                        key={idx}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="border-t border-slate-800"
                                                    >
                                                        <td className="px-3 py-2 text-white">{result.tradeId}</td>
                                                        <td className="px-3 py-2 text-orange-400 font-mono font-bold">{result.tradeTime}</td>
                                                        <td className="px-3 py-2 text-white">${result.price}</td>
                                                        <td className="px-3 py-2 text-cyan-400 font-mono font-bold">{result.quoteTime}</td>
                                                        <td className="px-3 py-2 text-white">${result.bid}</td>
                                                        <td className="px-3 py-2 text-white">${result.ask}</td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                    {joinResults.length === 0 && (
                                        <div className="p-6 text-center text-slate-500 text-xs">No results yet. Run the simulation to see joined output.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* === GAP FILL TAB === */
                    <div className="flex-1 flex flex-col">
                        {/* Controls */}
                        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleGapFillNextStep}
                                    disabled={bucketScanPosition >= rawBuckets.length - 1}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold flex items-center gap-2 text-sm transition-all"
                                >
                                    <SkipForward size={16} /> Next Step
                                </button>
                                <button
                                    onClick={() => setIsGapAutoPlaying(!isGapAutoPlaying)}
                                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-sm transition-all ${isGapAutoPlaying ? 'bg-orange-600 hover:bg-orange-500' : 'bg-green-600 hover:bg-green-500'
                                        } text-white`}
                                >
                                    {isGapAutoPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Auto Play</>}
                                </button>
                                <button onClick={resetGapFill} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold flex items-center gap-2 text-sm transition-all">
                                    <RotateCcw size={16} /> Reset
                                </button>

                                <div className="ml-4 h-8 w-px bg-slate-700"></div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFillMethod('lastvalue')}
                                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${fillMethod === 'lastvalue' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            }`}
                                    >
                                        IGNORE NULLS
                                    </button>
                                    <button
                                        onClick={() => setFillMethod('linear')}
                                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${fillMethod === 'linear' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            }`}
                                    >
                                        INTERPOLATE
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400">
                                Bucket: <span className="text-white font-bold">{bucketScanPosition + 1}/{rawBuckets.length}</span>
                            </div>
                        </div>

                        {/* Bucket Visualization */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-6xl mx-auto">
                                <div className="text-sm font-bold text-purple-400 mb-6 flex items-center gap-2">
                                    🪣 Time Buckets (Horizontal Array)
                                </div>

                                <div className="flex items-end gap-4 mb-8 justify-center relative">
                                    {rawBuckets.map((bucket, idx) => {
                                        const filled = filledBuckets[idx];
                                        const isScanning = idx === bucketScanPosition;
                                        const prevFilled = idx > 0 ? filledBuckets[idx - 1] : null;

                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-2 relative">
                                                {/* Time Label */}
                                                <div className="text-[10px] text-slate-500 font-mono font-bold">T{bucket.timestamp}</div>

                                                {/* Bucket Container */}
                                                <motion.div
                                                    animate={{
                                                        scale: isScanning ? 1.1 : 1,
                                                        borderColor: isScanning ? '#a855f7' : '#334155'
                                                    }}
                                                    className="relative w-20 h-40 border-2 rounded-lg bg-slate-900 overflow-hidden"
                                                    style={{ borderWidth: isScanning ? '3px' : '2px' }}
                                                >
                                                    {/* Original Value (Blue) */}
                                                    {bucket.value !== null && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(bucket.value / 100) * 100}%` }}
                                                            transition={{ type: 'spring', stiffness: 100 }}
                                                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400"
                                                        />
                                                    )}

                                                    {/* Filled Value - Green (Last Value) or Orange (Interpolated) */}
                                                    {filled && filled.filled !== null && bucket.value === null && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(filled.filled / 100) * 100}%` }}
                                                            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                                                            className={`absolute bottom-0 w-full ${filled.synthetic
                                                                    ? 'bg-gradient-to-t from-orange-600 to-orange-400'
                                                                    : 'bg-gradient-to-t from-green-600 to-green-400'
                                                                }`}
                                                        />
                                                    )}

                                                    {/* NULL Indicator */}
                                                    {bucket.value === null && !filled && (
                                                        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-2xl font-bold">
                                                            ∅
                                                        </div>
                                                    )}

                                                    {/* Scanner Pulse */}
                                                    <AnimatePresence>
                                                        {isScanning && (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: [0, 0.5, 0] }}
                                                                exit={{ opacity: 0 }}
                                                                transition={{ repeat: Infinity, duration: 1 }}
                                                                className="absolute inset-0 bg-purple-500/30 border-2 border-purple-400 rounded-lg"
                                                            />
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>

                                                {/* Pipe Animation (IGNORE NULLS) */}
                                                <AnimatePresence>
                                                    {showPipe && isScanning && fillMethod === 'lastvalue' && bucket.value === null && prevFilled && idx > 0 && (
                                                        <motion.div
                                                            initial={{ scaleX: 0, originX: 0 }}
                                                            animate={{ scaleX: 1 }}
                                                            exit={{ scaleX: 0 }}
                                                            transition={{ duration: 0.4 }}
                                                            className="absolute bottom-16 -left-4 w-8 h-1 bg-green-400 rounded-full"
                                                            style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)' }}
                                                        >
                                                            <ArrowRight size={12} className="absolute -right-2 -top-1.5 text-green-400" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Bridge Animation (INTERPOLATION) */}
                                                <AnimatePresence>
                                                    {showBridge && isScanning && fillMethod === 'linear' && bucket.value === null && idx > 0 && (
                                                        <motion.div
                                                            initial={{ width: 0, opacity: 0 }}
                                                            animate={{ width: '2rem', opacity: 1 }}
                                                            exit={{ width: 0, opacity: 0 }}
                                                            transition={{ duration: 0.5 }}
                                                            className="absolute bottom-20 -left-4 h-0.5 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full"
                                                            style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.7)' }}
                                                        />
                                                    )}
                                                </AnimatePresence>

                                                {/* Carry Forward Label */}
                                                {filled && filled.filled !== null && bucket.value === null && !filled.synthetic && (
                                                    <div className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                                                        ← CARRY
                                                    </div>
                                                )}

                                                {/* Synthesized Label */}
                                                {filled && filled.synthetic && (
                                                    <div className="text-orange-400 text-[10px] font-bold">SYNTH</div>
                                                )}

                                                {/* Value Display */}
                                                <div className="text-xs text-white font-mono font-bold">
                                                    {filled ? filled.filled : (bucket.value !== null ? bucket.value : '—')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Insight Panel */}
                                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={16} className="text-purple-400 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-purple-400 mb-1">ALGORITHM INSIGHT</div>
                                            <div className="text-xs text-slate-300">{gapInsight || 'Ready to fill gaps. Click Next Step to begin.'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Educational Panels */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                        <div className="text-xs font-bold text-blue-400 mb-2">💧 IGNORE NULLS (Last Value)</div>
                                        <div className="text-xs text-slate-300 space-y-1.5">
                                            <div>• Simple "carry forward" strategy</div>
                                            <div>• <strong className="text-blue-300">O(n)</strong> complexity - very fast!</div>
                                            <div>• Best for: Status flags, categories, on/off states</div>
                                            <div>• Assumption: Value persists until explicitly changed</div>
                                            <div className="pt-2 text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded">
                                                LAST_VALUE(val) OVER (ORDER BY ts)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                                        <div className="text-xs font-bold text-purple-400 mb-2">🌉 LINEAR INTERPOLATION</div>
                                        <div className="text-xs text-slate-300 space-y-1.5">
                                            <div>• Synthesizes new values between known points</div>
                                            <div>• <strong className="text-purple-300">O(n²)</strong> worst case - slower</div>
                                            <div>• Best for: Continuous metrics (temperature, price)</div>
                                            <div>• Creates "smooth" transitions in timeseries</div>
                                            <div className="pt-2 text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded">
                                                (prev_val + next_val) / 2
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeSeriesSimulator;
