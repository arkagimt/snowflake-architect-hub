import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Zap, AlertTriangle, CheckCircle, TrendingUp, Database, HardDrive, Cloud, Cpu, Search } from 'lucide-react';

// Types
type TabType = 'spilling' | 'rangejoin' | 'pruning';
type SpillLevel = 'ram' | 'ssd' | 's3';

interface Particle {
    id: number;
    nodeId: number;
    level: SpillLevel;
    y: number;
    speed: number;
}

interface JoinRow {
    id: number;
    value: number;
    matchedTo: number[];
}

const QueryProfileVisualizer = ({ onBack }: { onBack: () => void }) => {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('spilling');
    const [isRunning, setIsRunning] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);

    // Spilling Tab State
    const [particles, setParticles] = useState<Particle[]>([]);
    const [nodeStats, setNodeStats] = useState([
        { id: 0, ramUsed: 0, ssdUsed: 0, s3Used: 0 },
        { id: 1, ramUsed: 0, ssdUsed: 0, s3Used: 0 },
        { id: 2, ramUsed: 0, ssdUsed: 0, s3Used: 0 },
        { id: 3, ramUsed: 0, ssdUsed: 0, s3Used: 0 }
    ]);
    const [totalSpilled, setTotalSpilled] = useState({ ssd: 0, s3: 0 });

    // Range Join State
    const [joinMatches, setJoinMatches] = useState<[number, number][]>([]);
    const [joinStep, setJoinStep] = useState(0);

    // Pruning State
    const [activePartitions, setActivePartitions] = useState<number[]>([]);
    const [isClustered, setIsClustered] = useState(false);

    const animationRef = useRef<number>();
    const particleIdRef = useRef(0);

    // Constants
    const RAM_CAPACITY = 100;
    const SSD_CAPACITY = 100;
    const PARTICLE_SPAWN_RATE = isOptimized ? 2 : 8;

    // Spilling Animation Logic
    useEffect(() => {
        if (activeTab !== 'spilling' || !isRunning) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        let lastTime = Date.now();
        const animate = () => {
            const now = Date.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            // Spawn new particles
            if (Math.random() < 0.3) {
                const newParticles: Particle[] = [];
                for (let i = 0; i < PARTICLE_SPAWN_RATE; i++) {
                    const nodeId = isOptimized
                        ? Math.floor(Math.random() * 4)
                        : Math.random() < 0.7 ? 3 : Math.floor(Math.random() * 3);

                    newParticles.push({
                        id: particleIdRef.current++,
                        nodeId,
                        level: 'ram',
                        y: 0,
                        speed: 50
                    });
                }
                setParticles(prev => [...prev, ...newParticles]);
            }

            // Update particle positions and handle spilling
            setParticles(prev => {
                const updated: Particle[] = [];
                const newNodeStats = nodeStats.map(n => ({ ...n }));
                let ssdSpill = totalSpilled.ssd;
                let s3Spill = totalSpilled.s3;

                prev.forEach(p => {
                    const nodeCapacity = newNodeStats[p.nodeId];
                    const currentSpeed = p.level === 's3' ? p.speed * 0.2 : p.speed; // 80% slowdown on S3

                    let newY = p.y + currentSpeed * delta;
                    let newLevel = p.level;

                    // Check for spilling
                    if (p.level === 'ram' && nodeCapacity.ramUsed >= RAM_CAPACITY) {
                        newLevel = 'ssd';
                        nodeCapacity.ramUsed = Math.max(0, nodeCapacity.ramUsed - 1);
                        ssdSpill += 0.5;
                    } else if (p.level === 'ssd' && nodeCapacity.ssdUsed >= SSD_CAPACITY) {
                        newLevel = 's3';
                        nodeCapacity.ssdUsed = Math.max(0, nodeCapacity.ssdUsed - 1);
                        s3Spill += 1;
                    }

                    if (newY < 100) {
                        if (newLevel === 'ram') nodeCapacity.ramUsed = Math.min(RAM_CAPACITY, nodeCapacity.ramUsed + 0.5);
                        else if (newLevel === 'ssd') nodeCapacity.ssdUsed = Math.min(SSD_CAPACITY, nodeCapacity.ssdUsed + 0.5);

                        updated.push({ ...p, y: newY, level: newLevel });
                    }
                });

                setNodeStats(newNodeStats);
                setTotalSpilled({ ssd: ssdSpill, s3: s3Spill });
                return updated;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isRunning, activeTab, isOptimized, nodeStats, totalSpilled]);

    // Range Join Animation
    useEffect(() => {
        if (activeTab !== 'rangejoin' || !isRunning) return;

        const interval = setInterval(() => {
            if (isOptimized) {
                // Optimized: Sequential zipper
                setJoinStep(prev => {
                    if (prev >= 10) return 0;
                    return prev + 1;
                });
            } else {
                // Naive: Random cartesian connections
                const matches: [number, number][] = [];
                for (let i = 0; i < 3; i++) {
                    const left = Math.floor(Math.random() * 10);
                    const right = Math.floor(Math.random() * 10);
                    matches.push([left, right]);
                }
                setJoinMatches(matches);
            }
        }, isOptimized ? 400 : 100);

        return () => clearInterval(interval);
    }, [isRunning, activeTab, isOptimized]);

    // Pruning Animation
    useEffect(() => {
        if (activeTab !== 'pruning' || !isRunning) return;

        const interval = setInterval(() => {
            if (isClustered) {
                // Clustered: Target specific range
                setActivePartitions([45, 46, 47, 48, 49, 54, 55, 56, 57, 58]);
            } else {
                // Unclustered: Random scattering
                const random = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100));
                setActivePartitions(random);
            }
        }, isClustered ? 1000 : 200);

        return () => clearInterval(interval);
    }, [isRunning, activeTab, isClustered]);

    // Actions
    const handleRun = () => {
        setIsRunning(true);
        if (activeTab === 'spilling') {
            setParticles([]);
            setNodeStats([
                { id: 0, ramUsed: 0, ssdUsed: 0, s3Used: 0 },
                { id: 1, ramUsed: 0, ssdUsed: 0, s3Used: 0 },
                { id: 2, ramUsed: 0, ssdUsed: 0, s3Used: 0 },
                { id: 3, ramUsed: 0, ssdUsed: 0, s3Used: 0 }
            ]);
            setTotalSpilled({ ssd: 0, s3: 0 });
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        setJoinMatches([]);
        setActivePartitions([]);
        setJoinStep(0);
    };

    const handleOptimize = () => {
        setIsOptimized(!isOptimized);
        if (activeTab === 'spilling') {
            handleStop();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">
                        <Activity size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                            Query Profile Visualizer
                        </h1>
                        <p className="text-xs text-slate-500">Distributed System Bottleneck Analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isRunning ? (
                        <button
                            onClick={handleRun}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
                        >
                            <Zap size={16} /> Run Simulation
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-red-500/20"
                        >
                            Stop
                        </button>
                    )}

                    <button
                        onClick={handleOptimize}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-lg ${isOptimized
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                    >
                        {isOptimized ? '✓ Optimized' : 'Optimize'}
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 shrink-0">
                {[
                    { id: 'spilling' as TabType, label: 'Skew & Spilling', icon: <HardDrive size={14} /> },
                    { id: 'rangejoin' as TabType, label: 'Range Join / ASOF', icon: <Zap size={14} /> },
                    { id: 'pruning' as TabType, label: 'Pruning Efficiency', icon: <Search size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); handleStop(); }}
                        className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-white border-orange-500'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Tab 1: Spilling */}
                {activeTab === 'spilling' && (
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Data Skew & Spilling Simulation</h2>
                                <p className="text-sm text-slate-400">
                                    Visualizing why one "Whale Customer" can slow down the entire cluster when data distribution is unbalanced.
                                </p>
                            </div>

                            {/* Worker Nodes */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {nodeStats.map((node, idx) => (
                                    <div key={node.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                                        <div className="text-xs font-bold text-slate-400 mb-3 flex justify-between items-center">
                                            <span>Worker {idx + 1}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${node.s3Used > 0 ? 'bg-red-500/20 text-red-400' :
                                                    node.ssdUsed > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {node.s3Used > 0 ? 'SLOW' : node.ssdUsed > 0 ? 'MEDIUM' : 'FAST'}
                                            </span>
                                        </div>

                                        {/* Storage Layers */}
                                        <div className="space-y-2">
                                            {/* RAM */}
                                            <div className="relative">
                                                <div className="flex items-center justify-between text-[10px] mb-1">
                                                    <span className="text-green-400 flex items-center gap-1">
                                                        <Database size={10} /> RAM
                                                    </span>
                                                    <span className="text-slate-500">{Math.round(node.ramUsed)}%</span>
                                                </div>
                                                <div className="h-16 bg-slate-950 rounded border-2 border-green-500/50 relative overflow-hidden">
                                                    <motion.div
                                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-600 to-green-400"
                                                        animate={{ height: `${node.ramUsed}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                    {/* Particles */}
                                                    <AnimatePresence>
                                                        {particles.filter(p => p.nodeId === idx && p.level === 'ram').slice(0, 20).map(p => (
                                                            <motion.div
                                                                key={p.id}
                                                                className="absolute w-1.5 h-1.5 bg-green-300 rounded-full"
                                                                style={{ left: `${Math.random() * 90 + 5}%`, bottom: `${p.y}%` }}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* SSD */}
                                            <div className="relative">
                                                <div className="flex items-center justify-between text-[10px] mb-1">
                                                    <span className="text-yellow-400 flex items-center gap-1">
                                                        <HardDrive size={10} /> SSD
                                                    </span>
                                                    <span className="text-slate-500">{Math.round(node.ssdUsed)}%</span>
                                                </div>
                                                <div className="h-12 bg-slate-950 rounded border-2 border-yellow-500/50 relative overflow-hidden">
                                                    <motion.div
                                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-600 to-yellow-400"
                                                        animate={{ height: `${node.ssdUsed}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                    <AnimatePresence>
                                                        {particles.filter(p => p.nodeId === idx && p.level === 'ssd').slice(0, 15).map(p => (
                                                            <motion.div
                                                                key={p.id}
                                                                className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full"
                                                                style={{ left: `${Math.random() * 90 + 5}%`, bottom: `${p.y}%` }}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* S3 Remote */}
                                            <div className="relative">
                                                <div className="flex items-center justify-between text-[10px] mb-1">
                                                    <span className="text-red-400 flex items-center gap-1">
                                                        <Cloud size={10} /> S3
                                                    </span>
                                                    <span className="text-slate-500">Remote</span>
                                                </div>
                                                <div className="h-8 bg-slate-950 rounded border-2 border-red-500/50 relative overflow-hidden">
                                                    <AnimatePresence>
                                                        {particles.filter(p => p.nodeId === idx && p.level === 's3').slice(0, 10).map(p => (
                                                            <motion.div
                                                                key={p.id}
                                                                className="absolute w-1.5 h-1.5 bg-red-300 rounded-full"
                                                                style={{ left: `${Math.random() * 90 + 5}%`, bottom: `${p.y}%` }}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                    {node.s3Used > 0 && (
                                                        <motion.div
                                                            className="absolute inset-0 bg-red-600/20"
                                                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                                                            transition={{ repeat: Infinity, duration: 1 }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Interview Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">Data Skew:</strong> "When one worker gets 80% of the data, it becomes the bottleneck for the entire query."</li>
                                    <li>• <strong className="text-yellow-300">Spilling:</strong> "RAM → SSD is ~10x slower. SSD → S3 is ~100x slower due to network I/O."</li>
                                    <li>• <strong className="text-yellow-300">Fix:</strong> "Use <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">CLUSTER BY</code> or add a salt column to redistribute data evenly."</li>
                                    <li>• <strong className="text-yellow-300">Detection:</strong> "Look for <code className="bg-slate-800 px-1 py-0.5 rounded text-purple-400">Bytes Spilled to Remote Storage</code> in Query Profile."</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Range  Join */}
                {activeTab === 'rangejoin' && (
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Range Join / ASOF Optimization</h2>
                                <p className="text-sm text-slate-400">
                                    Comparing naive Cartesian approach vs optimized Sort-Merge for non-equality joins (Start {'<='} Date {'<'} End).
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Naive Approach */}
                                <div className="bg-slate-900 rounded-xl border-2 border-red-500/50 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white">Naive Approach</h3>
                                        <div className="flex items-center gap-2 text-red-400 text-xs">
                                            <AlertTriangle size={14} />
                                            High CPU
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-[10px] text-slate-500 mb-2">Left Table</div>
                                            <div className="space-y-1">
                                                {Array.from({ length: 10 }, (_, i) => (
                                                    <div key={i} className="bg-slate-950 p-2 rounded text-xs text-slate-300 border border-slate-800">
                                                        Row {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 mb-2">Right Table</div>
                                            <div className="space-y-1">
                                                {Array.from({ length: 10 }, (_, i) => (
                                                    <div key={i} className="bg-slate-950 p-2 rounded text-xs text-slate-300 border border-slate-800">
                                                        Row {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cartesian Lines */}
                                    {!isOptimized && (
                                        <svg className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
                                            <AnimatePresence>
                                                {joinMatches.map(([left, right], idx) => (
                                                    <motion.line
                                                        key={idx}
                                                        x1="25%"
                                                        y1={`${left * 10}%`}
                                                        x2="75%"
                                                        y2={`${right * 10}%`}
                                                        stroke="#ef4444"
                                                        strokeWidth="1"
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        exit={{ pathLength: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </svg>
                                    )}

                                    <div className="text-center text-xs text-red-400 mt-4 font-mono">
                                        O(N²) = 10 × 10 = 100 comparisons
                                    </div>
                                </div>

                                {/* Optimized Approach */}
                                <div className="bg-slate-900 rounded-xl border-2 border-green-500/50 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white">Sort-Merge (Zipper)</h3>
                                        <div className="flex items-center gap-2 text-green-400 text-xs">
                                            <CheckCircle size={14} />
                                            Low CPU
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-[10px] text-slate-500 mb-2">Sorted Left</div>
                                            <div className="space-y-1">
                                                {Array.from({ length: 10 }, (_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className={`p-2 rounded text-xs border transition-colors ${isOptimized && joinStep === i
                                                                ? 'bg-green-500/20 border-green-500 text-green-300'
                                                                : 'bg-slate-950 border-slate-800 text-slate-300'
                                                            }`}
                                                    >
                                                        Row {i + 1}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 mb-2">Sorted Right</div>
                                            <div className="space-y-1">
                                                {Array.from({ length: 10 }, (_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className={`p-2 rounded text-xs border transition-colors ${isOptimized && joinStep === i
                                                                ? 'bg-green-500/20 border-green-500 text-green-300'
                                                                : 'bg-slate-950 border-slate-800 text-slate-300'
                                                            }`}
                                                    >
                                                        Row {i + 1}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Zipper Bracket */}
                                    {isOptimized && (
                                        <motion.div
                                            className="absolute left-0 right-0 h-8 border-2 border-green-500 rounded"
                                            animate={{ top: `${joinStep * 10 + 20}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}

                                    <div className="text-center text-xs text-green-400 mt-4 font-mono">
                                        O(N + M) = 10 + 10 = 20 comparisons
                                    </div>
                                </div>
                            </div>

                            {/* Interview Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">ASOF Join:</strong> "Used for point-in-time queries like 'What was the price at time of order?'"</li>
                                    <li>• <strong className="text-yellow-300">Naive:</strong> "Scans entire dimension for every fact row — O(N²) complexity."</li>
                                    <li>• <strong className="text-yellow-300">Optimized:</strong> "Sort both sides, then use merge join — O(N log N + M log M)."</li>
                                    <li>• <strong className="text-yellow-300">Snowflake:</strong> "Automatically uses Sort-Merge for <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">BETWEEN</code> joins."</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Pruning */}
                {activeTab === 'pruning' && (
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Pruning Efficiency Visualization</h2>
                                <p className="text-sm text-slate-400">
                                    Comparing unclustered vs clustered micro-partition access patterns for <code className="text-cyan-400">WHERE date = '2024-06-01'</code>.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-sm text-slate-400">Storage Layout:</span>
                                <button
                                    onClick={() => setIsClustered(!isClustered)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${isClustered
                                            ? 'bg-green-600 text-white'
                                            : 'bg-red-600 text-white'
                                        }`}
                                >
                                    {isClustered ? 'Clustered (Good)' : 'Unclustered (Bad)'}
                                </button>
                            </div>

                            {/* Micro-partition Grid */}
                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
                                <div className="text-xs font-bold text-slate-400 mb-4">100 Micro-Partitions (Each ~16MB)</div>
                                <div className="grid grid-cols-10 gap-2">
                                    {Array.from({ length: 100 }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            className={`aspect-square rounded border-2 transition-all ${activePartitions.includes(i)
                                                    ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50'
                                                    : 'bg-slate-950 border-slate-700'
                                                }`}
                                            animate={activePartitions.includes(i) ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        />
                                    ))}
                                </div>

                                <div className="mt-4 flex justify-between text-xs">
                                    <div className="text-slate-400">
                                        Partitions Scanned: <span className={`font-bold ${isClustered ? 'text-green-400' : 'text-red-400'}`}>
                                            {activePartitions.length}
                                        </span>
                                    </div>
                                    <div className="text-slate-400">
                                        I/O Efficiency: <span className={`font-bold ${isClustered ? 'text-green-400' : 'text-red-400'}`}>
                                            {isClustered ? '90%' : '30%'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Interview Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">Micro-Partitions:</strong> "Snowflake's immutable 16MB compressed storage units."</li>
                                    <li>• <strong className="text-yellow-300">Pruning:</strong> "Uses metadata (min/max values) to skip irrelevant partitions."</li>
                                    <li>• <strong className="text-yellow-300">Clustering:</strong> "Use <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">CLUSTER BY date</code> to colocate related data."</li>
                                    <li>• <strong className="text-yellow-300">Cost:</strong> "Unclustered tables scan 3-10x more data = higher query cost."</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Diagnostics Panel */}
            <div className="h-24 bg-slate-900 border-t border-slate-800 shrink-0 px-6 py-4">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" />
                            <span className="text-xs text-slate-400">Real-Time Metrics</span>
                        </div>

                        {activeTab === 'spilling' && (
                            <>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Bytes Spilled (Local)</div>
                                    <div className="text-sm font-mono text-yellow-400">{totalSpilled.ssd.toFixed(1)} GB</div>
                                </div>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Bytes Spilled (Remote)</div>
                                    <div className={`text-sm font-mono ${totalSpilled.s3 > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                                        {totalSpilled.s3.toFixed(1)} GB {totalSpilled.s3 > 0 && '⚠️'}
                                    </div>
                                </div>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Active Particles</div>
                                    <div className="text-sm font-mono text-slate-300">{particles.length}</div>
                                </div>
                            </>
                        )}

                        {activeTab === 'rangejoin' && (
                            <>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Join Strategy</div>
                                    <div className="text-sm font-mono text-slate-300">{isOptimized ? 'Sort-Merge' : 'Cartesian'}</div>
                                </div>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Comparisons</div>
                                    <div className={`text-sm font-mono ${isOptimized ? 'text-green-400' : 'text-red-400'}`}>
                                        {isOptimized ? '20 (O(N+M))' : '100 (O(N²))'}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'pruning' && (
                            <>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Partitions Scanned</div>
                                    <div className={`text-sm font-mono ${isClustered ? 'text-green-400' : 'text-red-400'}`}>
                                        {activePartitions.length} / 100
                                    </div>
                                </div>
                                <div className="border-l border-slate-700 pl-6">
                                    <div className="text-xs text-slate-500">Data Scanned</div>
                                    <div className={`text-sm font-mono ${isClustered ? 'text-green-400' : 'text-red-400'}`}>
                                        {(activePartitions.length * 16).toFixed(0)} MB
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={`px-4 py-2 rounded-lg text-xs font-semibold ${isOptimized
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {isOptimized ? '✓ Optimized Configuration' : '⚠ Suboptimal Configuration'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryProfileVisualizer;
