import React, { useState, useEffect } from 'react';

const ReconSimulator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Source table state
    const [sourceRows, setSourceRows] = useState([
        { id: 1, name: 'BLOCK-ASM', quantity: 100, status: 'Active' },
        { id: 2, name: 'PISTON-SET', quantity: 250, status: 'Active' },
        { id: 3, name: 'CRANKSHAFT', quantity: 75, status: 'Active' },
    ]);

    // Target table state (initially synced)
    const [targetRows, setTargetRows] = useState([
        { id: 1, name: 'BLOCK-ASM', quantity: 100, status: 'Active' },
        { id: 2, name: 'PISTON-SET', quantity: 250, status: 'Active' },
        { id: 3, name: 'CRANKSHAFT', quantity: 75, status: 'Active' },
    ]);

    // Stream state (CDC log)
    const [streamData, setStreamData] = useState<Array<{
        rowId: number;
        action: 'INSERT' | 'DELETE';
        isUpdate: boolean;
        data: { id: number; name: string; quantity: number; status: string };
        timestamp: string;
    }>>([]);

    const [nextId, setNextId] = useState(4);
    const [isMerging, setIsMerging] = useState(false);
    const [mergeStep, setMergeStep] = useState(-1);
    const [showSuccess, setShowSuccess] = useState(false);

    // Generate timestamp
    const getTimestamp = () => new Date().toLocaleTimeString();

    // INSERT operation
    const insertRow = () => {
        const newRow = {
            id: nextId,
            name: `PART-${String(nextId).padStart(3, '0')}`,
            quantity: Math.floor(Math.random() * 200) + 50,
            status: 'Active'
        };

        setSourceRows(prev => [...prev, newRow]);
        setStreamData(prev => [...prev, {
            rowId: nextId,
            action: 'INSERT',
            isUpdate: false,
            data: newRow,
            timestamp: getTimestamp()
        }]);
        setNextId(prev => prev + 1);
        setShowSuccess(false);
    };

    // UPDATE operation (uses DELETE + INSERT pattern in streams)
    const updateRow = () => {
        if (sourceRows.length === 0) return;

        const randomIndex = Math.floor(Math.random() * sourceRows.length);
        const oldRow = sourceRows[randomIndex];
        const newRow = {
            ...oldRow,
            quantity: oldRow.quantity + Math.floor(Math.random() * 50) + 10
        };

        setSourceRows(prev => prev.map((r, i) => i === randomIndex ? newRow : r));

        // Stream captures UPDATE as DELETE + INSERT with isUpdate flag
        setStreamData(prev => [
            ...prev,
            {
                rowId: oldRow.id,
                action: 'DELETE',
                isUpdate: true,
                data: oldRow,
                timestamp: getTimestamp()
            },
            {
                rowId: newRow.id,
                action: 'INSERT',
                isUpdate: true,
                data: newRow,
                timestamp: getTimestamp()
            }
        ]);
        setShowSuccess(false);
    };

    // DELETE operation
    const deleteRow = () => {
        if (sourceRows.length === 0) return;

        const randomIndex = Math.floor(Math.random() * sourceRows.length);
        const deletedRow = sourceRows[randomIndex];

        setSourceRows(prev => prev.filter((_, i) => i !== randomIndex));
        setStreamData(prev => [...prev, {
            rowId: deletedRow.id,
            action: 'DELETE',
            isUpdate: false,
            data: deletedRow,
            timestamp: getTimestamp()
        }]);
        setShowSuccess(false);
    };

    // MERGE Task - Process stream and update target
    const runMergeTask = () => {
        if (streamData.length === 0) return;

        setIsMerging(true);
        setMergeStep(0);
        setShowSuccess(false);

        // Animate through each stream record
        streamData.forEach((record, idx) => {
            setTimeout(() => {
                setMergeStep(idx);

                // Apply change to target
                setTimeout(() => {
                    setTargetRows(prev => {
                        let newTarget = [...prev];

                        if (record.action === 'INSERT') {
                            // Check if exists (for update case)
                            const existingIdx = newTarget.findIndex(r => r.id === record.data.id);
                            if (existingIdx >= 0) {
                                newTarget[existingIdx] = record.data;
                            } else {
                                newTarget.push(record.data);
                            }
                        } else if (record.action === 'DELETE' && !record.isUpdate) {
                            // Only delete if not part of update
                            newTarget = newTarget.filter(r => r.id !== record.data.id);
                        }

                        return newTarget;
                    });
                }, 200);

                // Complete after last record
                if (idx === streamData.length - 1) {
                    setTimeout(() => {
                        setStreamData([]);
                        setMergeStep(-1);
                        setIsMerging(false);
                        setShowSuccess(true);
                    }, 600);
                }
            }, idx * 500);
        });
    };

    // Clear stream (reset offset)
    const clearStream = () => {
        setStreamData([]);
        setShowSuccess(false);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl">
                        🌐
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            Streams & Tasks: CDC Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Change Data Capture • Incremental Loading • Delta Processing</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">

                    {/* Concept */}
                    <div className="bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border border-teal-500/30 rounded-xl p-5 mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">🌐 Snowflake Streams: Change Data Capture (CDC)</h3>
                        <p className="text-sm text-slate-300">
                            <strong>Streams</strong> track changes (INSERT, UPDATE, DELETE) on a table without re-scanning entire table.
                            <strong> Tasks</strong> run on schedule to process only the <em>delta</em> (changed data).
                            This is how you build efficient <strong>incremental pipelines</strong> instead of full reloads!
                        </p>
                    </div>

                    {/* Three-Column Layout */}
                    <div className="grid grid-cols-3 gap-6 mb-6">

                        {/* SOURCE TABLE */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <span className="text-xl">📄</span> Source Table
                                </h4>
                                <span className="text-xs text-slate-500">{sourceRows.length} rows</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={insertRow}
                                    disabled={isMerging}
                                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-xs font-bold transition"
                                >
                                    ➕ INSERT
                                </button>
                                <button
                                    onClick={updateRow}
                                    disabled={isMerging || sourceRows.length === 0}
                                    className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded-lg text-xs font-bold transition"
                                >
                                    ✏️ UPDATE
                                </button>
                                <button
                                    onClick={deleteRow}
                                    disabled={isMerging || sourceRows.length === 0}
                                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-xs font-bold transition"
                                >
                                    🗑️ DELETE
                                </button>
                            </div>

                            {/* Table */}
                            <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-slate-500 uppercase px-2">
                                    <div>ID</div>
                                    <div>Name</div>
                                    <div>Qty</div>
                                    <div>Status</div>
                                </div>
                                {sourceRows.map(row => (
                                    <div
                                        key={row.id}
                                        className="grid grid-cols-4 gap-1 text-xs bg-slate-800 rounded-lg px-2 py-2 border border-slate-700"
                                    >
                                        <div className="text-cyan-400 font-mono">{row.id}</div>
                                        <div className="text-white truncate">{row.name}</div>
                                        <div className="text-green-400">{row.quantity}</div>
                                        <div className="text-slate-400">{row.status}</div>
                                    </div>
                                ))}
                                {sourceRows.length === 0 && (
                                    <div className="text-center text-slate-500 py-8">No rows</div>
                                )}
                            </div>
                        </div>

                        {/* STREAM (CDC Log) */}
                        <div className="bg-slate-900 rounded-xl border-2 border-teal-500/50 p-5 relative">
                            {/* Animated flow indicator */}
                            {streamData.length > 0 && !isMerging && (
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-teal-400 text-2xl animate-pulse">
                                    →
                                </div>
                            )}
                            {isMerging && (
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-teal-400 text-2xl animate-bounce">
                                    →
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-teal-400 flex items-center gap-2">
                                    <span className="text-xl">🌐</span> Stream
                                </h4>
                                <span className={`text-xs px-2 py-0.5 rounded ${streamData.length > 0 ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {streamData.length} changes
                                </span>
                            </div>

                            {/* Stream explanation */}
                            <div className="text-[10px] text-slate-500 mb-3 bg-slate-800 rounded p-2">
                                <code>CREATE STREAM src_stream ON TABLE source;</code>
                            </div>

                            {/* Change Log */}
                            <div className="space-y-1 max-h-[250px] overflow-y-auto">
                                {streamData.map((record, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-xs rounded-lg px-3 py-2 border transition-all ${mergeStep === idx
                                            ? 'ring-2 ring-yellow-400 scale-105 shadow-lg'
                                            : mergeStep > idx
                                                ? 'opacity-30'
                                                : ''
                                            } ${record.action === 'INSERT'
                                                ? 'bg-green-900/30 border-green-500/50'
                                                : 'bg-red-900/30 border-red-500/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${record.action === 'INSERT' ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {record.action}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{record.timestamp}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">ID: {record.rowId}</span>
                                            {record.isUpdate && (
                                                <span className="text-yellow-400 text-[10px] bg-yellow-900/30 px-1 rounded">
                                                    METADATA$ISUPDATE
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate">
                                            {record.data.name} (qty: {record.data.quantity})
                                        </div>
                                    </div>
                                ))}
                                {streamData.length === 0 && (
                                    <div className="text-center text-slate-500 py-8">
                                        <div className="text-2xl mb-2">📡</div>
                                        <div>Stream is empty</div>
                                        <div className="text-[10px]">(No pending changes)</div>
                                    </div>
                                )}
                            </div>

                            {/* Offset indicator */}
                            {streamData.length > 0 && (
                                <div className="mt-3 text-[10px] text-slate-500 flex items-center justify-between">
                                    <span>Offset: {streamData.length} records behind</span>
                                    <button
                                        onClick={clearStream}
                                        disabled={isMerging}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        Reset
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* TARGET TABLE */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <span className="text-xl">💾</span> Target Table
                                </h4>
                                <span className="text-xs text-slate-500">{targetRows.length} rows</span>
                            </div>

                            {/* Merge Task Button */}
                            <button
                                onClick={runMergeTask}
                                disabled={isMerging || streamData.length === 0}
                                className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition mb-4 ${isMerging
                                    ? 'bg-yellow-600 animate-pulse'
                                    : streamData.length === 0
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-teal-600 hover:bg-teal-500 text-white'
                                    }`}
                            >
                                {isMerging ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Processing MERGE...
                                    </span>
                                ) : (
                                    <>⬇ Run MERGE Task</>
                                )}
                            </button>

                            {/* Success Message */}
                            {showSuccess && (
                                <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-center animate-slide">
                                    <div className="text-green-400 font-bold">✓ Sync Complete!</div>
                                    <div className="text-xs text-slate-400">Stream consumed, offset advanced</div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="space-y-1 max-h-[250px] overflow-y-auto">
                                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-slate-500 uppercase px-2">
                                    <div>ID</div>
                                    <div>Name</div>
                                    <div>Qty</div>
                                    <div>Status</div>
                                </div>
                                {targetRows.map(row => {
                                    const isBeingUpdated = isMerging && streamData[mergeStep]?.data.id === row.id;
                                    return (
                                        <div
                                            key={row.id}
                                            className={`grid grid-cols-4 gap-1 text-xs rounded-lg px-2 py-2 border transition-all ${isBeingUpdated
                                                ? 'bg-yellow-900/50 border-yellow-500 ring-2 ring-yellow-400'
                                                : 'bg-slate-800 border-slate-700'
                                                }`}
                                        >
                                            <div className="text-cyan-400 font-mono">{row.id}</div>
                                            <div className="text-white truncate">{row.name}</div>
                                            <div className="text-green-400">{row.quantity}</div>
                                            <div className="text-slate-400">{row.status}</div>
                                        </div>
                                    );
                                })}
                                {targetRows.length === 0 && (
                                    <div className="text-center text-slate-500 py-8">No rows</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SQL Reference */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 mb-6">
                        <h4 className="font-bold text-white mb-3">📜 SQL Implementation</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950 rounded-lg p-4">
                                <div className="text-xs text-teal-400 font-bold mb-2">1. Create Stream</div>
                                <pre className="text-xs text-slate-300 font-mono">{`CREATE STREAM inventory_stream
ON TABLE source_inventory
APPEND_ONLY = FALSE;

-- Stream captures:
-- METADATA$ACTION (INSERT/DELETE)
-- METADATA$ISUPDATE (TRUE/FALSE)
-- METADATA$ROW_ID`}</pre>
                            </div>
                            <div className="bg-slate-950 rounded-lg p-4">
                                <div className="text-xs text-teal-400 font-bold mb-2">2. Create Task with MERGE</div>
                                <pre className="text-xs text-slate-300 font-mono">{`CREATE TASK sync_inventory
  WAREHOUSE = ETL_WH
  SCHEDULE = '5 MINUTE'
  WHEN SYSTEM$STREAM_HAS_DATA('inventory_stream')
AS
MERGE INTO target t USING inventory_stream s
  ON t.id = s.id
  WHEN MATCHED AND METADATA$ACTION = 'DELETE'
    THEN DELETE
  WHEN MATCHED THEN UPDATE SET ...
  WHEN NOT MATCHED THEN INSERT ...;`}</pre>
                            </div>
                        </div>
                    </div>

                    {/* Flow Diagram */}
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 mb-6">
                        <h4 className="font-bold text-white mb-4">🔄 CDC Flow Diagram</h4>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-xl bg-blue-900/50 border-2 border-blue-500 flex items-center justify-center text-3xl mb-2">
                                    📄
                                </div>
                                <div className="text-xs text-slate-400">Source</div>
                                <div className="text-xs text-blue-400">DML Operations</div>
                            </div>

                            <div className="text-2xl text-slate-600">→</div>

                            <div className="text-center">
                                <div className="w-20 h-20 rounded-xl bg-teal-900/50 border-2 border-teal-500 flex items-center justify-center text-3xl mb-2 relative">
                                    🌐
                                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 rounded-full text-xs flex items-center justify-center">
                                        Δ
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400">Stream</div>
                                <div className="text-xs text-teal-400">Captures Delta</div>
                            </div>

                            <div className="text-2xl text-slate-600">→</div>

                            <div className="text-center">
                                <div className="w-20 h-20 rounded-xl bg-yellow-900/50 border-2 border-yellow-500 flex items-center justify-center text-3xl mb-2">
                                    ⚙️
                                </div>
                                <div className="text-xs text-slate-400">Task</div>
                                <div className="text-xs text-yellow-400">MERGE Logic</div>
                            </div>

                            <div className="text-2xl text-slate-600">→</div>

                            <div className="text-center">
                                <div className="w-20 h-20 rounded-xl bg-green-900/50 border-2 border-green-500 flex items-center justify-center text-3xl mb-2">
                                    💾
                                </div>
                                <div className="text-xs text-slate-400">Target</div>
                                <div className="text-xs text-green-400">Synced Data</div>
                            </div>
                        </div>
                    </div>

                    {/* Interview Tips */}
                    <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-5">
                        <h4 className="text-teal-400 font-bold mb-3">🎉 Interview Talking Points</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                            <div>
                                <strong className="text-white">Streams vs Full Reload:</strong> Streams track only changes (delta),
                                avoiding expensive full table scans. Critical for large tables!
                            </div>
                            <div>
                                <strong className="text-white">UPDATE = DELETE + INSERT:</strong> Streams capture updates as two
                                records with METADATA$ISUPDATE = TRUE. Use this for SCD Type 2!
                            </div>
                            <div>
                                <strong className="text-white">SYSTEM$STREAM_HAS_DATA():</strong> Task only runs when stream has
                                pending changes - no wasted compute!
                            </div>
                            <div>
                                <strong className="text-white">Your VPI Context:</strong> Perfect for syncing Oracle EBS changes
                                to Snowflake incrementally instead of daily full loads!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReconSimulator;
