import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Unlock, AlertTriangle, CheckCircle, Clock, User, Database, Zap, XCircle } from 'lucide-react';

// Types
type TabType = 'mvcc' | 'locking' | 'deadlock';
type TransactionState = 'idle' | 'active' | 'waiting' | 'committed' | 'aborted';

interface TableRow {
    id: number;
    value: number;
    version: number;
    committedBy: string | null;
    visibleTo: string[];
}

interface Transaction {
    id: string;
    name: string;
    state: TransactionState;
    color: string;
    startTime: number;
    lockedResources: string[];
}

const ConcurrencySimulator = ({ onBack }: { onBack: () => void }) => {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('mvcc');

    // MVCC State
    const [mvccRows, setMvccRows] = useState<TableRow[]>([
        { id: 1, value: 100, version: 1, committedBy: 'System', visibleTo: ['*'] }
    ]);
    const [txA, setTxA] = useState<Transaction>({
        id: 'TxA',
        name: 'User A',
        state: 'idle',
        color: 'blue',
        startTime: 0,
        lockedResources: []
    });
    const [txB, setTxB] = useState<Transaction>({
        id: 'TxB',
        name: 'User B',
        state: 'idle',
        color: 'orange',
        startTime: 0,
        lockedResources: []
    });
    const [queryResult, setQueryResult] = useState<number | null>(null);
    const [showSnapshotBeam, setShowSnapshotBeam] = useState(false);

    // Locking State
    const [lockingResource, setLockingResource] = useState<{
        id: string;
        value: number;
        lockedBy: string | null;
    }>({ id: 'Row_5', value: 50, lockedBy: null });
    const [waitingTx, setWaitingTx] = useState<string | null>(null);
    const [waitTime, setWaitTime] = useState(0);

    // Deadlock State
    const [resourceX, setResourceX] = useState<{ lockedBy: string | null }>({ lockedBy: null });
    const [resourceY, setResourceY] = useState<{ lockedBy: string | null }>({ lockedBy: null });
    const [deadlockDetected, setDeadlockDetected] = useState(false);
    const [deadlockVictim, setDeadlockVictim] = useState<string | null>(null);
    const [txAWaitsFor, setTxAWaitsFor] = useState<string | null>(null);
    const [txBWaitsFor, setTxBWaitsFor] = useState<string | null>(null);

    // Wait time ticker for locking tab
    useEffect(() => {
        if (waitingTx) {
            const interval = setInterval(() => {
                setWaitTime(prev => prev + 0.1);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setWaitTime(0);
        }
    }, [waitingTx]);

    // Deadlock detection timer
    useEffect(() => {
        if (txAWaitsFor && txBWaitsFor && !deadlockDetected) {
            const timeout = setTimeout(() => {
                setDeadlockDetected(true);
                // Kill TxB (victim selection)
                setDeadlockVictim('TxB');
                setTimeout(() => {
                    // Rollback TxB
                    setResourceY({ lockedBy: null });
                    setTxBWaitsFor(null);
                    setDeadlockDetected(false);
                    setDeadlockVictim(null);
                }, 2000);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [txAWaitsFor, txBWaitsFor, deadlockDetected]);

    // MVCC Actions
    const handleTxABegin = () => {
        setTxA(prev => ({ ...prev, state: 'active', startTime: Date.now() }));
    };

    const handleTxAUpdate = () => {
        if (txA.state !== 'active') return;

        // Create ghost row (v2) visible only to TxA
        setMvccRows(prev => [
            ...prev,
            { id: 1, value: 200, version: 2, committedBy: null, visibleTo: ['TxA'] }
        ]);
    };

    const handleTxACommit = () => {
        if (txA.state !== 'active') return;

        // Commit: Make v2 global, mark v1 as historical
        setMvccRows(prev => prev.map(row => {
            if (row.version === 2) {
                return { ...row, committedBy: 'TxA', visibleTo: ['*'] };
            }
            if (row.version === 1) {
                return { ...row, visibleTo: [] }; // No longer visible
            }
            return row;
        }));
        setTxA(prev => ({ ...prev, state: 'committed' }));
    };

    const handleTxBSelect = () => {
        setShowSnapshotBeam(true);

        // Find the latest committed version visible to everyone
        const visibleRows = mvccRows.filter(row =>
            row.visibleTo.includes('*') || row.visibleTo.includes('TxB')
        );
        const latestCommitted = visibleRows
            .filter(row => row.committedBy !== null)
            .sort((a, b) => b.version - a.version)[0];

        if (latestCommitted) {
            setTimeout(() => {
                setQueryResult(latestCommitted.value);
                setShowSnapshotBeam(false);
            }, 1000);
        }
    };

    const resetMVCC = () => {
        setMvccRows([{ id: 1, value: 100, version: 1, committedBy: 'System', visibleTo: ['*'] }]);
        setTxA({ id: 'TxA', name: 'User A', state: 'idle', color: 'blue', startTime: 0, lockedResources: [] });
        setTxB({ id: 'TxB', name: 'User B', state: 'idle', color: 'orange', startTime: 0, lockedResources: [] });
        setQueryResult(null);
        setShowSnapshotBeam(false);
    };

    // Locking Actions
    const handleLockTxAUpdate = () => {
        if (lockingResource.lockedBy === null) {
            // Acquire lock
            setLockingResource(prev => ({ ...prev, lockedBy: 'TxA' }));
        }
    };

    const handleLockTxBUpdate = () => {
        if (lockingResource.lockedBy === null) {
            // Acquire lock
            setLockingResource(prev => ({ ...prev, lockedBy: 'TxB' }));
        } else if (lockingResource.lockedBy === 'TxA') {
            // Must wait
            setWaitingTx('TxB');
        }
    };

    const handleLockTxACommit = () => {
        // Release lock
        setLockingResource(prev => ({ ...prev, value: prev.value + 10, lockedBy: null }));

        // If TxB was waiting, it can now proceed
        if (waitingTx === 'TxB') {
            setTimeout(() => {
                setWaitingTx(null);
                setLockingResource(prev => ({ ...prev, value: prev.value + 20, lockedBy: 'TxB' }));

                setTimeout(() => {
                    setLockingResource(prev => ({ ...prev, lockedBy: null }));
                }, 1500);
            }, 500);
        }
    };

    const resetLocking = () => {
        setLockingResource({ id: 'Row_5', value: 50, lockedBy: null });
        setWaitingTx(null);
        setWaitTime(0);
    };

    // Deadlock Actions
    const handleDeadlockTxALockX = () => {
        if (resourceX.lockedBy === null) {
            setResourceX({ lockedBy: 'TxA' });
        }
    };

    const handleDeadlockTxBLockY = () => {
        if (resourceY.lockedBy === null) {
            setResourceY({ lockedBy: 'TxB' });
        }
    };

    const handleDeadlockTxATryY = () => {
        if (resourceY.lockedBy === 'TxB') {
            setTxAWaitsFor('Y');
        } else if (resourceY.lockedBy === null) {
            setResourceY({ lockedBy: 'TxA' });
        }
    };

    const handleDeadlockTxBTryX = () => {
        if (resourceX.lockedBy === 'TxA') {
            setTxBWaitsFor('X');
        } else if (resourceX.lockedBy === null) {
            setResourceX({ lockedBy: 'TxB' });
        }
    };

    const resetDeadlock = () => {
        setResourceX({ lockedBy: null });
        setResourceY({ lockedBy: null });
        setDeadlockDetected(false);
        setDeadlockVictim(null);
        setTxAWaitsFor(null);
        setTxBWaitsFor(null);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                        <Lock size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Concurrency & ACID Simulator
                        </h1>
                        <p className="text-xs text-slate-500">MVCC, Locking, Deadlock Detection</p>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 flex gap-2 shrink-0">
                {[
                    { id: 'mvcc' as TabType, label: 'Snapshot Isolation (MVCC)', icon: <Clock size={14} /> },
                    { id: 'locking' as TabType, label: 'Blocking & Locking', icon: <Lock size={14} /> },
                    { id: 'deadlock' as TabType, label: 'Deadlock Detection', icon: <AlertTriangle size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-white border-purple-500'
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
                {/* Tab 1: MVCC */}
                {activeTab === 'mvcc' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Snapshot Isolation - The Time Machine</h2>
                                <p className="text-sm text-slate-400">
                                    "Readers don't block Writers" - Visualizing Multi-Version Concurrency Control (MVCC)
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-6 mb-6">
                                {/* User A Controls */}
                                <div className="bg-slate-900 rounded-xl border-2 border-blue-500/50 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User size={16} className="text-blue-400" />
                                        <h3 className="text-sm font-bold text-blue-400">User A (Writer)</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleTxABegin}
                                            disabled={txA.state !== 'idle'}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${txA.state === 'idle'
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            BEGIN TRANSACTION
                                        </button>
                                        <button
                                            onClick={handleTxAUpdate}
                                            disabled={txA.state !== 'active'}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${txA.state === 'active'
                                                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            UPDATE value = 200
                                        </button>
                                        <button
                                            onClick={handleTxACommit}
                                            disabled={txA.state !== 'active'}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${txA.state === 'active'
                                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                }`}
                                        >
                                            COMMIT
                                        </button>
                                    </div>
                                    <div className="mt-4 p-2 bg-slate-950 rounded text-xs text-slate-400 text-center">
                                        State: <span className={`font-bold ${txA.state === 'active' ? 'text-blue-400' :
                                                txA.state === 'committed' ? 'text-green-400' : 'text-slate-500'
                                            }`}>{txA.state.toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* Table Visualization */}
                                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Database size={16} className="text-slate-400" />
                                        <h3 className="text-sm font-bold text-white">Table: ACCOUNTS</h3>
                                    </div>

                                    <div className="relative min-h-[200px]">
                                        <AnimatePresence>
                                            {mvccRows.map((row, idx) => (
                                                <motion.div
                                                    key={`${row.version}`}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{
                                                        opacity: row.visibleTo.length === 0 ? 0.3 : 1,
                                                        scale: 1,
                                                        y: idx * (row.version === 2 ? -10 : 0)
                                                    }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className={`p-4 rounded-lg border-2 mb-2 ${row.version === 2
                                                            ? 'bg-blue-500/10 border-blue-500/50 absolute top-0 left-0 right-0'
                                                            : 'bg-slate-950 border-slate-700'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center text-xs">
                                                        <div>
                                                            <span className="text-slate-500">ID: </span>
                                                            <span className="text-white font-mono">{row.id}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Value: </span>
                                                            <span className="text-white font-mono font-bold text-lg">{row.value}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">v{row.version}</span>
                                                        </div>
                                                    </div>
                                                    {row.version === 2 && (
                                                        <div className="mt-1 text-[10px] text-blue-400 flex items-center gap-1">
                                                            <Zap size={10} />
                                                            Ghost Row (visible to {row.visibleTo.join(', ')})
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {/* Snapshot Beam */}
                                        {showSnapshotBeam && (
                                            <motion.div
                                                className="absolute right-0 top-0 bottom-0 w-1 bg-orange-400 shadow-[0_0_10px_#fb923c]"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ duration: 1, repeat: 1 }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* User B Controls */}
                                <div className="bg-slate-900 rounded-xl border-2 border-orange-500/50 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User size={16} className="text-orange-400" />
                                        <h3 className="text-sm font-bold text-orange-400">User B (Reader)</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleTxBSelect}
                                            className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition-all"
                                        >
                                            SELECT value
                                        </button>
                                    </div>
                                    {queryResult !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg"
                                        >
                                            <div className="text-xs text-slate-400 mb-1">Query Result:</div>
                                            <div className="text-2xl font-mono text-green-400 font-bold">{queryResult}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                (Snapshot at Tx start)
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={resetMVCC}
                                className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition-all"
                            >
                                Reset Scenario
                            </button>

                            {/* Interview Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">MVCC (Multi-Version Concurrency Control):</strong> "Each transaction sees a consistent snapshot of data as it existed at transaction start."</li>
                                    <li>• <strong className="text-yellow-300">No Read Locks:</strong> "Readers never block writers. Writer creates a new version, readers see old version until commit."</li>
                                    <li>• <strong className="text-yellow-300">Snowflake Implementation:</strong> "Uses immutable micro-partitions. Updates create new partitions rather than modifying in-place."</li>
                                    <li>• <strong className="text-yellow-300">Garbage Collection:</strong> "Old versions cleaned up after all referencing transactions complete."</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Locking */}
                {activeTab === 'locking' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Blocking & Locking - The Queue</h2>
                                <p className="text-sm text-slate-400">
                                    What happens when two writers touch the same resource?
                                </p>
                            </div>

                            {/* Resource Block */}
                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="relative">
                                        <motion.div
                                            className={`p-8 rounded-xl border-4 ${lockingResource.lockedBy === 'TxA' ? 'border-blue-500 bg-blue-500/10' :
                                                    lockingResource.lockedBy === 'TxB' ? 'border-orange-500 bg-orange-500/10' :
                                                        'border-slate-700 bg-slate-950'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-xs text-slate-500 mb-2">Resource: Row ID 5</div>
                                                <div className="text-4xl font-mono font-bold text-white">{lockingResource.value}</div>
                                            </div>
                                        </motion.div>

                                        {/* Lock Icon */}
                                        <AnimatePresence>
                                            {lockingResource.lockedBy && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: 180 }}
                                                    className={`absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${lockingResource.lockedBy === 'TxA' ? 'bg-blue-600' : 'bg-orange-600'
                                                        }`}
                                                >
                                                    <Lock size={20} className="text-white" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Waiting Spinner */}
                                        {waitingTx && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="absolute -right-32 top-1/2 -translate-y-1/2"
                                            >
                                                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4 flex flex-col items-center">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                        className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mb-2"
                                                    />
                                                    <div className="text-xs text-yellow-400 font-semibold">Waiting...</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                                                        {waitTime.toFixed(1)}s
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* TxA Controls */}
                                    <div className="bg-slate-950 rounded-lg p-4 border border-blue-500/30">
                                        <div className="text-xs font-bold text-blue-400 mb-3">Transaction A</div>
                                        <div className="space-y-2">
                                            <button
                                                onClick={handleLockTxAUpdate}
                                                disabled={lockingResource.lockedBy !== null && lockingResource.lockedBy !== 'TxA'}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold transition-all"
                                            >
                                                UPDATE +10
                                            </button>
                                            <button
                                                onClick={handleLockTxACommit}
                                                disabled={lockingResource.lockedBy !== 'TxA'}
                                                className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold transition-all"
                                            >
                                                COMMIT
                                            </button>
                                        </div>
                                    </div>

                                    {/* TxB Controls */}
                                    <div className="bg-slate-950 rounded-lg p-4 border border-orange-500/30">
                                        <div className="text-xs font-bold text-orange-400 mb-3">Transaction B</div>
                                        <div className="space-y-2">
                                            <button
                                                onClick={handleLockTxBUpdate}
                                                disabled={waitingTx === 'TxB'}
                                                className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold transition-all"
                                            >
                                                UPDATE +20
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={resetLocking}
                                className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition-all"
                            >
                                Reset Scenario
                            </button>

                            {/* Interview Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">Partition-Level Locking:</strong> "Snowflake locks at micro-partition granularity, not row-level."</li>
                                    <li>• <strong className="text-yellow-300">Lock Wait Timeout:</strong> "Default is 20 minutes. Set <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">LOCK_TIMEOUT</code> parameter."</li>
                                    <li>• <strong className="text-yellow-300">Serializable Isolation:</strong> "Snowflake provides serializable isolation without traditional locking overhead."</li>
                                    <li>• <strong className="text-yellow-300">Write Conflicts:</strong> "If two transactions modify same partition, first to commit wins. Second gets conflict error."</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Deadlock */}
                {activeTab === 'deadlock' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-white mb-2">Deadlock Detection - System Watchdog</h2>
                                <p className="text-sm text-slate-400">
                                    Circular dependency: A waits for B, B waits for A
                                </p>
                            </div>

                            {/* Resource Grid */}
                            <div className="relative bg-slate-900 rounded-xl border border-slate-800 p-8 mb-6">
                                <div className="grid grid-cols-2 gap-12">
                                    {/* Resource X */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-32 h-32 rounded-xl border-4 flex items-center justify-center text-4xl font-bold ${resourceX.lockedBy === 'TxA' ? 'border-blue-500 bg-blue-500/20 text-blue-400' :
                                                resourceX.lockedBy === 'TxB' ? 'border-orange-500 bg-orange-500/20 text-orange-400' :
                                                    'border-slate-700 bg-slate-950 text-slate-500'
                                            }`}>
                                            X
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            {resourceX.lockedBy ? `Locked by ${resourceX.lockedBy}` : 'Available'}
                                        </div>
                                    </div>

                                    {/* Resource Y */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-32 h-32 rounded-xl border-4 flex items-center justify-center text-4xl font-bold ${resourceY.lockedBy === 'TxA' ? 'border-blue-500 bg-blue-500/20 text-blue-400' :
                                                resourceY.lockedBy === 'TxB' ? 'border-orange-500 bg-orange-500/20 text-orange-400' :
                                                    'border-slate-700 bg-slate-950 text-slate-500'
                                            }`}>
                                            Y
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            {resourceY.lockedBy ? `Locked by ${resourceY.lockedBy}` : 'Available'}
                                        </div>
                                    </div>
                                </div>

                                {/* Tension Lines */}
                                <svg className="absolute inset-0 pointer-events-none">
                                    {txAWaitsFor === 'Y' && (
                                        <motion.line
                                            x1="25%"
                                            y1="50%"
                                            x2="75%"
                                            y2="50%"
                                            stroke="#ef4444"
                                            strokeWidth="3"
                                            strokeDasharray="5 5"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    )}
                                    {txBWaitsFor === 'X' && (
                                        <motion.line
                                            x1="75%"
                                            y1="50%"
                                            x2="25%"
                                            y2="50%"
                                            stroke="#fb923c"
                                            strokeWidth="3"
                                            strokeDasharray="5 5"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    )}
                                </svg>

                                {/* Deadlock Alert */}
                                <AnimatePresence>
                                    {deadlockDetected && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute inset-0 bg-red-950/80 backdrop-blur flex items-center justify-center rounded-xl"
                                        >
                                            <div className="text-center">
                                                <AlertTriangle size={48} className="text-red-400 mx-auto mb-4 animate-pulse" />
                                                <div className="text-xl font-bold text-red-400 mb-2">DEADLOCK DETECTED!</div>
                                                <div className="text-sm text-slate-300 mb-4">Circular Wait Condition</div>
                                                {deadlockVictim && (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded-lg text-xs text-red-300">
                                                        <XCircle size={14} />
                                                        Rolling back {deadlockVictim}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Controls */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-900 rounded-lg p-4 border border-blue-500/30">
                                    <div className="text-xs font-bold text-blue-400 mb-3">Transaction A</div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleDeadlockTxALockX}
                                            disabled={resourceX.lockedBy !== null}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold"
                                        >
                                            1. Lock Resource X
                                        </button>
                                        <button
                                            onClick={handleDeadlockTxATryY}
                                            disabled={resourceX.lockedBy !== 'TxA'}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold"
                                        >
                                            3. Try Lock Resource Y
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-lg p-4 border border-orange-500/30">
                                    <div className="text-xs font-bold text-orange-400 mb-3">Transaction B</div>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleDeadlockTxBLockY}
                                            disabled={resourceY.lockedBy !== null}
                                            className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold"
                                        >
                                            2. Lock Resource Y
                                        </button>
                                        <button
                                            onClick={handleDeadlockTxBTryX}
                                            disabled={resourceY.lockedBy !== 'TxB'}
                                            className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-xs font-semibold"
                                        >
                                            4. Try Lock Resource X
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={resetDeadlock}
                                className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition-all"
                            >
                                Reset Scenario
                            </button>

                            {/* Interview Insights */}
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                                <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Insights</h4>
                                <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                    <li>• <strong className="text-yellow-300">Deadlock Conditions:</strong> "Requires: Mutual exclusion, Hold & Wait, No preemption, Circular wait."</li>
                                    <li>• <strong className="text-yellow-300">Detection:</strong> "Snowflake has a background thread that detects deadlocks within seconds."</li>
                                    <li>• <strong className="text-yellow-300">Victim Selection:</strong> "System picks transaction to abort (usually the one with less work done)."</li>
                                    <li>• <strong className="text-yellow-300">Prevention:</strong> "Always acquire locks in same order. Use <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">SET LOCK_TIMEOUT</code>."</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConcurrencySimulator;
