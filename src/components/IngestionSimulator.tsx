import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Database, FileText, Zap, Cloud, Server, TrendingUp, Clock, DollarSign, Droplet } from 'lucide-react';

// Types
type TabType = 'bulk' | 'snowpipe' | 'streaming';
type FileState = 'uploading' | 'staged' | 'loading' | 'loaded';

interface DataFile {
    id: number;
    state: FileState;
    progress: number;
}

interface DataParticle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const IngestionSimulator = ({ onBack }: { onBack: () => void }) => {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('bulk');
    const [isRunning, setIsRunning] = useState(false);

    // Bulk Loading State
    const [bulkFiles, setBulkFiles] = useState<DataFile[]>([]);
    const [warehouseAwake, setWarehouseAwake] = useState(false);
    const [bulkLoadProgress, setBulkLoadProgress] = useState(0);
    const [bulkLatency, setBulkLatency] = useState(0);
    const [warehouseUptime, setWarehouseUptime] = useState(0);

    // Snowpipe State
    const [pipeFiles, setPipeFiles] = useState<DataFile[]>([]);
    const [triggerActive, setTriggerActive] = useState(false);
    const [filesProcessed, setFilesProcessed] = useState(0);
    const [avgLatency, setAvgLatency] = useState(0);

    // Streaming State
    const [particles, setParticles] = useState<DataParticle[]>([]);
    const [bufferFill, setBufferFill] = useState(0);
    const [microPartitions, setMicroPartitions] = useState(0);
    const [streamingLatency, setStreamingLatency] = useState(0);

    const animationRef = useRef<number>();
    const fileIdRef = useRef(0);
    const particleIdRef = useRef(0);

    // Bulk Loading Logic
    useEffect(() => {
        if (activeTab !== 'bulk' || !isRunning) return;

        // Stage files gradually
        const fileInterval = setInterval(() => {
            if (bulkFiles.length < 8 && !warehouseAwake) {
                setBulkFiles(prev => [...prev, {
                    id: fileIdRef.current++,
                    state: 'staged',
                    progress: 0
                }]);
            }
        }, 1500);

        // Wake warehouse after files accumulate
        if (bulkFiles.length >= 5 && !warehouseAwake) {
            setTimeout(() => {
                setWarehouseAwake(true);
                setBulkLatency(0);

                // Warehouse uptime ticker
                const uptimeInterval = setInterval(() => {
                    setWarehouseUptime(prev => prev + 0.1);
                }, 100);

                // Load all files in batch
                setTimeout(() => {
                    setBulkFiles(prev => prev.map(f => ({ ...f, state: 'loading' as FileState })));

                    // Progress animation
                    const progressInterval = setInterval(() => {
                        setBulkLoadProgress(prev => {
                            if (prev >= 100) {
                                clearInterval(progressInterval);
                                setBulkFiles(prev => prev.map(f => ({ ...f, state: 'loaded' as FileState })));
                                setTimeout(() => {
                                    setWarehouseAwake(false);
                                    clearInterval(uptimeInterval);
                                    setTimeout(() => {
                                        setBulkFiles([]);
                                        setBulkLoadProgress(0);
                                    }, 1000);
                                }, 500);
                                return 100;
                            }
                            return prev + 2;
                        });
                    }, 50);
                }, 1000);
            }, 2000);
        }

        // Latency ticker
        const latencyInterval = setInterval(() => {
            if (!warehouseAwake) {
                setBulkLatency(prev => prev + 1);
            }
        }, 1000);

        return () => {
            clearInterval(fileInterval);
            clearInterval(latencyInterval);
        };
    }, [activeTab, isRunning, bulkFiles.length, warehouseAwake]);

    // Snowpipe Logic
    useEffect(() => {
        if (activeTab !== 'snowpipe' || !isRunning) return;

        const fileInterval = setInterval(() => {
            // New file arrives
            const newFile: DataFile = {
                id: fileIdRef.current++,
                state: 'uploading',
                progress: 0
            };
            setPipeFiles(prev => [...prev, newFile]);

            // Trigger SQS notification
            setTriggerActive(true);
            setTimeout(() => setTriggerActive(false), 300);

            // Process file quickly
            setTimeout(() => {
                setPipeFiles(prev => prev.map(f =>
                    f.id === newFile.id ? { ...f, state: 'loading' as FileState } : f
                ));

                setTimeout(() => {
                    setPipeFiles(prev => prev.map(f =>
                        f.id === newFile.id ? { ...f, state: 'loaded' as FileState } : f
                    ));
                    setFilesProcessed(p => p + 1);

                    // Calculate avg latency
                    setAvgLatency(prev => (prev * 0.9) + (Math.random() * 20 + 40));

                    setTimeout(() => {
                        setPipeFiles(prev => prev.filter(f => f.id !== newFile.id));
                    }, 1000);
                }, 800);
            }, 400);
        }, 2000);

        return () => clearInterval(fileInterval);
    }, [activeTab, isRunning]);

    // Streaming Logic
    useEffect(() => {
        if (activeTab !== 'streaming' || !isRunning) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        let lastTime = Date.now();
        const animate = () => {
            const now = Date.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            // Spawn particles
            if (Math.random() < 0.4) {
                setParticles(prev => {
                    const newParticles = Array.from({ length: 3 }, () => ({
                        id: particleIdRef.current++,
                        x: 0,
                        y: Math.random() * 100,
                        vx: 50 + Math.random() * 30,
                        vy: (Math.random() - 0.5) * 20
                    }));
                    return [...prev, ...newParticles].slice(-50);
                });
            }

            // Move particles
            setParticles(prev => {
                return prev
                    .map(p => ({
                        ...p,
                        x: p.x + p.vx * delta,
                        y: p.y + p.vy * delta
                    }))
                    .filter(p => p.x < 100);
            });

            // Fill buffer
            setBufferFill(prev => {
                const newFill = Math.min(100, prev + 8 * delta);
                if (newFill >= 100) {
                    // Flush to micro-partition
                    setMicroPartitions(m => m + 1);
                    setStreamingLatency(Math.random() * 3 + 2); // 2-5 seconds
                    return 0;
                }
                return newFill;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [activeTab, isRunning]);

    const handleRun = () => {
        setIsRunning(true);
        // Reset metrics
        if (activeTab === 'bulk') {
            setBulkFiles([]);
            setBulkLatency(0);
            setWarehouseUptime(0);
            setBulkLoadProgress(0);
        } else if (activeTab === 'snowpipe') {
            setPipeFiles([]);
            setFilesProcessed(0);
            setAvgLatency(0);
        } else {
            setParticles([]);
            setBufferFill(0);
            setMicroPartitions(0);
            setStreamingLatency(0);
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        setWarehouseAwake(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
                        <Droplet size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Data Ingestion Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Bulk, Snowpipe, Streaming Architecture</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isRunning ? (
                        <button
                            onClick={handleRun}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                        >
                            <Play size={16} /> Start Ingestion
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-red-500/20"
                        >
                            Stop
                        </button>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 shrink-0">
                {[
                    { id: 'bulk' as TabType, label: 'Bulk Loading (COPY INTO)', icon: <Database size={14} /> },
                    { id: 'snowpipe' as TabType, label: 'Snowpipe (Serverless)', icon: <Zap size={14} /> },
                    { id: 'streaming' as TabType, label: 'Snowpipe Streaming', icon: <TrendingUp size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); handleStop(); }}
                        className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-white border-cyan-500'
                                : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {/* Tab 1: Bulk Loading */}
                {activeTab === 'bulk' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Bulk Loading - The "Batch" Model</h2>
                                <p className="text-sm text-slate-400">
                                    High latency, high throughput. Warehouse-based processing with scheduled batch windows.
                                </p>
                            </div>

                            {/* Flow Visualization */}
                            <div className="relative bg-slate-900 rounded-xl border border-slate-800 p-8 mb-6">
                                <div className="grid grid-cols-3 gap-8 items-center">
                                    {/* S3 Stage */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                                            <Cloud size={48} className="text-orange-400" />

                                            {/* File Icons */}
                                            <div className="absolute inset-2 grid grid-cols-4 gap-1">
                                                <AnimatePresence>
                                                    {bulkFiles.map((file, idx) => (
                                                        <motion.div
                                                            key={file.id}
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0, opacity: 0 }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 500,
                                                                damping: 30
                                                            }}
                                                            className={`flex items-center justify-center ${file.state === 'loaded' ? 'opacity-30' : ''
                                                                }`}
                                                        >
                                                            <FileText
                                                                size={12}
                                                                className={`${file.state === 'loading' ? 'text-cyan-400' :
                                                                        file.state === 'loaded' ? 'text-green-400' :
                                                                            'text-orange-300'
                                                                    }`}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-orange-400">S3 Stage</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{bulkFiles.length} files</div>
                                    </div>

                                    {/* Warehouse */}
                                    <div className="flex flex-col items-center">
                                        <motion.div
                                            className={`w-40 h-40 rounded-xl flex flex-col items-center justify-center border-4 transition-all ${warehouseAwake
                                                    ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-cyan-500 shadow-lg shadow-cyan-500/50'
                                                    : 'bg-slate-950 border-slate-700'
                                                }`}
                                            animate={warehouseAwake ? { scale: [1, 1.05, 1] } : {}}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <motion.div
                                                animate={warehouseAwake ? { rotate: 360 } : {}}
                                                transition={warehouseAwake ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
                                            >
                                                <Server
                                                    size={48}
                                                    className={warehouseAwake ? 'text-cyan-400' : 'text-slate-600'}
                                                />
                                            </motion.div>
                                            {warehouseAwake && (
                                                <motion.div
                                                    className="mt-2 text-xs font-bold text-cyan-400"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    ACTIVE
                                                </motion.div>
                                            )}
                                            {!warehouseAwake && bulkFiles.length === 0 && (
                                                <div className="mt-2 text-xs text-slate-600">Sleeping...</div>
                                            )}
                                            {warehouseAwake && (
                                                <div className="mt-2 w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                                        style={{ width: `${bulkLoadProgress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                        <div className="text-xs font-bold text-cyan-400 mt-2">Warehouse</div>
                                        <div className="text-[10px] text-slate-500">{warehouseAwake ? 'Running' : 'Suspended'}</div>
                                    </div>

                                    {/* Target Table */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl flex items-center justify-center">
                                            <Database size={48} className="text-green-400" />
                                        </div>
                                        <div className="text-xs font-bold text-green-400 mt-2">Target Table</div>
                                    </div>
                                </div>

                                {/* Data Flow Lines */}
                                <svg className="absolute inset-0 pointer-events-none">
                                    {warehouseAwake && bulkFiles.some(f => f.state === 'loading') && (
                                        <>
                                            <motion.line
                                                x1="35%"
                                                y1="50%"
                                                x2="50%"
                                                y2="50%"
                                                stroke="#06b6d4"
                                                strokeWidth="3"
                                                strokeDasharray="5 5"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                            />
                                            <motion.line
                                                x1="50%"
                                                y1="50%"
                                                x2="65%"
                                                y2="50%"
                                                stroke="#06b6d4"
                                                strokeWidth="3"
                                                strokeDasharray="5 5"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                            />
                                        </>
                                    )}
                                </svg>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <Clock size={14} />
                                        Batch Latency
                                    </div>
                                    <div className="text-2xl font-bold text-red-400">{bulkLatency}s</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Waiting for batch window</div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <DollarSign size={14} />
                                        Warehouse Uptime
                                    </div>
                                    <div className="text-2xl font-bold text-orange-400">{warehouseUptime.toFixed(1)}s</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Billable compute time</div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <TrendingUp size={14} />
                                        Throughput
                                    </div>
                                    <div className="text-2xl font-bold text-cyan-400">HIGH</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Batch processing</div>
                                </div>
                            </div>

                            {/* Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Architect's Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">Batch Window:</strong> Files accumulate in S3 stage until scheduled run or manual trigger.</li>
                                    <li>• <strong className="text-yellow-300">Warehouse Cost:</strong> Pay for uptime (min 60 seconds). Efficient for large batches, expensive for small frequent loads.</li>
                                    <li>• <strong className="text-yellow-300">Use Case:</strong> Daily/hourly ETL jobs where latency is acceptable (minutes to hours).</li>
                                    <li>• <strong className="text-yellow-300">Optimization:</strong> Use larger warehouse sizes for faster processing, auto-suspend to save costs.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Snowpipe */}
                {activeTab === 'snowpipe' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Snowpipe - The "Serverless" Model</h2>
                                <p className="text-sm text-slate-400">
                                    Event-driven, near real-time ingestion with serverless compute. No warehouse management.
                                </p>
                            </div>

                            {/* Flow Visualization */}
                            <div className="relative bg-slate-900 rounded-xl border border-slate-800 p-8 mb-6">
                                <div className="grid grid-cols-4 gap-6 items-center">
                                    {/* S3 Stage */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-xl flex items-center justify-center relative">
                                            <Cloud size={36} className="text-orange-400" />

                                            {/* Arriving Files */}
                                            <AnimatePresence>
                                                {pipeFiles.filter(f => f.state === 'uploading').map(file => (
                                                    <motion.div
                                                        key={file.id}
                                                        initial={{ y: -40, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="absolute"
                                                    >
                                                        <FileText size={16} className="text-orange-300" />
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                        <div className="text-xs font-bold text-orange-400 mt-2">S3 Stage</div>
                                    </div>

                                    {/* SQS Trigger */}
                                    <div className="flex flex-col items-center relative">
                                        <motion.div
                                            animate={triggerActive ? { scale: [1, 1.3, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                            className={`w-20 h-20 rounded-full flex items-center justify-center ${triggerActive
                                                    ? 'bg-yellow-500/30 border-2 border-yellow-500 shadow-lg shadow-yellow-500/50'
                                                    : 'bg-slate-950 border-2 border-slate-700'
                                                }`}
                                        >
                                            <Zap
                                                size={36}
                                                className={triggerActive ? 'text-yellow-400' : 'text-slate-600'}
                                            />
                                        </motion.div>
                                        <div className="text-xs font-bold text-yellow-400 mt-2">SQS Event</div>

                                        {/* Lightning bolt effect */}
                                        <AnimatePresence>
                                            {triggerActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl"
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Serverless Compute */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 rounded-xl flex items-center justify-center relative">
                                            <motion.div
                                                animate={pipeFiles.some(f => f.state === 'loading') ? { rotate: 360 } : {}}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Server size={36} className="text-purple-400" />
                                            </motion.div>

                                            {/* Processing indicator */}
                                            {pipeFiles.some(f => f.state === 'loading') && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-xl border-2 border-purple-500"
                                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                />
                                            )}
                                        </div>
                                        <div className="text-xs font-bold text-purple-400 mt-2">Serverless</div>
                                        <div className="text-[10px] text-slate-500">Auto-scaling</div>
                                    </div>

                                    {/* Target Table */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl flex items-center justify-center">
                                            <Database size={36} className="text-green-400" />
                                        </div>
                                        <div className="text-xs font-bold text-green-400 mt-2">Table</div>
                                        <div className="text-[10px] text-slate-500">{filesProcessed} files</div>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <Clock size={14} />
                                        Avg Latency
                                    </div>
                                    <div className="text-2xl font-bold text-green-400">{avgLatency.toFixed(0)}s</div>
                                    <div className="text-[10px] text-slate-500 mt-1">{'<'} 1 minute typical</div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <DollarSign size={14} />
                                        Cost Model
                                    </div>
                                    <div className="text-lg font-bold text-purple-400">Per-File</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Serverless overhead</div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <FileText size={14} />
                                        Files Processed
                                    </div>
                                    <div className="text-2xl font-bold text-cyan-400">{filesProcessed}</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Continuous ingestion</div>
                                </div>
                            </div>

                            {/* Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Architect's Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">Event-Driven:</strong> S3 PUT triggers SQS notification → Snowpipe auto-loads within ~1 minute.</li>
                                    <li>• <strong className="text-yellow-300">No Warehouse:</strong> Uses serverless compute. No need to manage warehouse size or auto-suspend.</li>
                                    <li>• <strong className="text-yellow-300">Cost:</strong> Pay per file processed. Cheaper than warehouse for small frequent loads, expensive for large batches.</li>
                                    <li>• <strong className="text-yellow-300">Use Case:</strong> IoT sensors, web logs, CDC streams where near real-time (sub-minute) is acceptable.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Streaming */}
                {activeTab === 'streaming' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Snowpipe Streaming - The "No-File" Model</h2>
                                <p className="text-sm text-slate-400">
                                    Real-time row insertion, bypasses S3. Seconds-level latency for high-velocity streams.
                                </p>
                            </div>

                            {/* Flow Visualization */}
                            <div className="relative bg-slate-900 rounded-xl border border-slate-800 p-8 mb-6 overflow-hidden" style={{ height: '300px' }}>
                                {/* Kafka Source */}
                                <div className="absolute left-8 top-1/2 -translate-y-1/2">
                                    <div className="w-24 h-24 bg-gradient-to-br from-pink-500/20 to-red-500/20 border-2 border-pink-500/50 rounded-xl flex items-center justify-center">
                                        <TrendingUp size={36} className="text-pink-400" />
                                    </div>
                                    <div className="text-xs font-bold text-pink-400 mt-2 text-center">Kafka</div>
                                    <div className="text-[10px] text-slate-500 text-center">Event Stream</div>
                                </div>

                                {/* Particles */}
                                <AnimatePresence>
                                    {particles.map(p => (
                                        <motion.div
                                            key={p.id}
                                            className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                                            style={{
                                                left: `${20 + p.x * 0.4}%`,
                                                top: `${50 + (p.y - 50) * 0.8}%`
                                            }}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                        />
                                    ))}
                                </AnimatePresence>

                                {/* Buffer */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                                        <Database size={36} className="text-blue-400 mb-2" />
                                        <div className="text-xs text-blue-400 font-bold">Buffer</div>

                                        {/* Fill indicator */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/40 to-blue-500/40"
                                            style={{ height: `${bufferFill}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-center mt-1">{bufferFill.toFixed(0)}% full</div>
                                </div>

                                {/* Micro-partitions */}
                                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                    <div className="w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl flex flex-col items-center justify-center">
                                        <Database size={36} className="text-green-400" />
                                        <div className="text-xs text-green-400 font-bold mt-2">Table</div>
                                        <div className="text-[10px] text-slate-500">{microPartitions} µ-partitions</div>
                                    </div>
                                </div>

                                {/* S3 Stage (greyed out - bypassed) */}
                                <div className="absolute left-1/2 top-8 -translate-x-1/2 opacity-30">
                                    <div className="relative">
                                        <Cloud size={32} className="text-slate-600" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-0.5 bg-red-500 rotate-45" />
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-600 text-center">S3 Bypassed</div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <Clock size={14} />
                                        Latency
                                    </div>
                                    <div className="text-2xl font-bold text-cyan-400">{streamingLatency.toFixed(1)}s</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Real-time (seconds)</div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <DollarSign size={14} />
                                        Cost Model
                                    </div>
                                    <div className="text-lg font-bold text-green-400">Per-Row</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Most efficient</div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                                        <TrendingUp size={14} />
                                        Buffer Fill
                                    </div>
                                    <div className="text-2xl font-bold text-blue-400">{bufferFill.toFixed(0)}%</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Auto-flush at 100%</div>
                                </div>
                            </div>

                            {/* Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Architect's Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">No Files:</strong> Rows written directly to Snowflake buffers via SDK. Bypasses S3 staging entirely.</li>
                                    <li>• <strong className="text-yellow-300">Latency:</strong> Seconds-level (vs minutes for Snowpipe). Ideal for dashboards, alerting, real-time analytics.</li>
                                    <li>• <strong className="text-yellow-300">Cost:</strong> Cheapest for high-frequency micro-batches. No per-file overhead, just per-byte ingestion.</li>
                                    <li>• <strong className="text-yellow-300">Use Case:</strong> Kafka streams, clickstreams, financial trades, real-time ML features.</li>
                                    <li>• <strong className="text-yellow-300">Format:</strong> Data flushed as mixed columnar format (not Parquet) for fast write, optimized later.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IngestionSimulator;
