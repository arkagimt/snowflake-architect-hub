import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Database, Server, RefreshCw, Search, Clock, Terminal, Code, AlertTriangle, CheckCircle, ArrowLeftRight } from 'lucide-react';

// --- Types ---
type ScdType = 'type1' | 'type2' | 'type3';

interface CustomerRecord {
    surrogateKey: number;
    customerId: number;
    name: string;
    location: string;
    prevLocation?: string; // For Type 3
    startDate: string;
    endDate: string | null;
    currentFlag: boolean;
    hash: string;
}

// --- Helper Functions ---
const generateHash = (val: string) => {
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
        const char = val.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
};

const SCDSimulator = ({ onBack }: { onBack: () => void }) => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<ScdType>('type2');
    const [incomingLocation, setIncomingLocation] = useState('Mumbai');
    const [step, setStep] = useState(0); // 0: Ready, 1: Scanning, 2: Diff Found, 3: Updating, 4: Done
    const [sliderDate, setSliderDate] = useState(2025);
    const [logs, setLogs] = useState<string[]>([]);

    // Initial Data (Realistic & Scaled)
    const [tableData, setTableData] = useState<CustomerRecord[]>([
        {
            surrogateKey: 100,
            customerId: 1,
            name: 'Arka',
            location: 'Bangalore',
            prevLocation: '-',
            startDate: '2020-01-01',
            endDate: '2022-12-31',
            currentFlag: false,
            hash: generateHash('Bangalore')
        },
        {
            surrogateKey: 101,
            customerId: 1,
            name: 'Arka',
            location: 'Delhi',
            prevLocation: '-',
            startDate: '2023-01-01',
            endDate: null,
            currentFlag: true,
            hash: generateHash('Delhi')
        },
        {
            surrogateKey: 201,
            customerId: 2,
            name: 'Pragg',
            location: 'Pune',
            prevLocation: '-',
            startDate: '2024-01-01',
            endDate: null,
            currentFlag: true,
            hash: generateHash('Pune')
        }
    ]);

    // Derived State
    const activeRow = tableData.find(r => r.customerId === 1 && r.currentFlag);
    const incomingHash = generateHash(incomingLocation);
    const isHashMatch = activeRow ? activeRow.hash === incomingHash : false;

    // Filtered Data for Time Travel
    const filteredData = activeTab === 'type2'
        ? tableData.filter(row => {
            const startYear = parseInt(row.startDate.split('-')[0]);
            const endYear = row.endDate ? parseInt(row.endDate.split('-')[0]) : 9999;
            return startYear <= sliderDate && endYear > sliderDate;
        })
        : tableData;

    // --- Actions ---
    const resetSimulation = () => {
        setTableData([
            {
                surrogateKey: 100,
                customerId: 1,
                name: 'Arka',
                location: 'Bangalore',
                prevLocation: '-',
                startDate: '2020-01-01',
                endDate: '2022-12-31',
                currentFlag: false,
                hash: generateHash('Bangalore')
            },
            {
                surrogateKey: 101,
                customerId: 1,
                name: 'Arka',
                location: 'Delhi',
                prevLocation: '-',
                startDate: '2023-01-01',
                endDate: null,
                currentFlag: true,
                hash: generateHash('Delhi')
            },
            {
                surrogateKey: 201,
                customerId: 2,
                name: 'Pragg',
                location: 'Pune',
                prevLocation: '-',
                startDate: '2024-01-01',
                endDate: null,
                currentFlag: true,
                hash: generateHash('Pune')
            }
        ]);
        setStep(0);
        setSliderDate(2025);
        setLogs([]);
    };

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const runPipeline = () => {
        setStep(1);
        setLogs([]);
        addLog(`[STEP 1] Scanning Source Stream for CustomerID: 1...`);

        setTimeout(() => {
            addLog(`[STEP 2] Generating MD5('${incomingLocation}') -> '${incomingHash}'`);
            addLog(`[STEP 3] Fetching Active Record for CustomerID: 1...`);
            addLog(`[INFO] Current Active Location: '${activeRow?.location}' (Hash: '${activeRow?.hash}')`);

            setTimeout(() => {
                setStep(2);
                if (isHashMatch) {
                    addLog(`[RESULT] ✅ Hashes Match. No Action Required.`);
                } else {
                    addLog(`[RESULT] ⚠️ Delta Detected! Hash Mismatch.`);
                    addLog(`[ACTION] Preparing ${activeTab.toUpperCase()} Update Strategy...`);
                }
            }, 1000);
        }, 1000);
    };

    const applyUpdate = () => {
        setStep(3);
        addLog(`[EXECUTING] Applying ${activeTab.toUpperCase()} Changes to Snowflake...`);

        setTimeout(() => {
            performUpdate();
            setStep(4);
            addLog(`[SUCCESS] Transaction Committed. Table Updated.`);
        }, 1000);
    };

    const performUpdate = () => {
        if (!activeRow) return;

        const newRowBase = {
            customerId: 1,
            name: 'Arka',
            location: incomingLocation,
            hash: incomingHash
        };

        if (activeTab === 'type1') {
            setTableData(prev => prev.map(row =>
                row.surrogateKey === activeRow.surrogateKey
                    ? { ...row, location: incomingLocation, hash: incomingHash }
                    : row
            ));
        } else if (activeTab === 'type2') {
            setTableData(prev => {
                const updatedOld = prev.map(row =>
                    row.surrogateKey === activeRow.surrogateKey
                        ? { ...row, endDate: '2025-01-01', currentFlag: false }
                        : row
                );
                const newRow: CustomerRecord = {
                    ...newRowBase,
                    surrogateKey: Math.floor(Math.random() * 1000) + 1000,
                    startDate: '2025-01-01',
                    endDate: null,
                    currentFlag: true,
                    prevLocation: '-'
                };
                return [newRow, ...updatedOld].sort((a, b) => a.customerId - b.customerId || (b.currentFlag ? 1 : -1));
            });
        } else if (activeTab === 'type3') {
            setTableData(prev => prev.map(row =>
                row.surrogateKey === activeRow.surrogateKey
                    ? {
                        ...row,
                        prevLocation: row.location,
                        location: incomingLocation,
                        hash: incomingHash
                    }
                    : row
            ));
        }
    };

    // --- SQL Generator ---
    const getSql = () => {
        if (step === 0) return "-- Ready to process incoming stream...";

        const baseMerge = `MERGE INTO DIM_CUSTOMER T\nUSING STREAM_CUSTOMER S\nON T.CUSTOMER_ID = S.CUSTOMER_ID`;

        if (activeTab === 'type1') {
            return `${baseMerge}\nWHEN MATCHED AND T.HASH <> S.HASH THEN\n  UPDATE SET T.LOCATION = S.LOCATION,\n             T.HASH = S.HASH;`;
        } else if (activeTab === 'type2') {
            return `-- 1. Close current record\nUPDATE DIM_CUSTOMER SET END_DATE = CURRENT_DATE(), CURRENT_FLAG = FALSE\nWHERE CUSTOMER_ID = :ID AND CURRENT_FLAG = TRUE;\n\n-- 2. Insert new record\nINSERT INTO DIM_CUSTOMER (ID, NAME, LOCATION, START_DATE, CURRENT_FLAG)\nVALUES (:ID, :NAME, :LOCATION, CURRENT_DATE(), TRUE);`;
        } else if (activeTab === 'type3') {
            return `${baseMerge}\nWHEN MATCHED AND T.HASH <> S.HASH THEN\n  UPDATE SET T.PREV_LOCATION = T.LOCATION,\n             T.LOCATION = S.LOCATION,\n             T.HASH = S.HASH;`;
        }
        return "";
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* --- 1. Pipeline Header --- */}
            <div className="h-20 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-center relative shrink-0 z-30">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                <div className="flex items-center gap-8 z-10">
                    <div className="flex flex-col items-center group cursor-help">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                            <Server className="text-blue-400" size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-blue-400 mt-1">CRM (Source)</span>
                    </div>

                    <div className="w-32 h-1 bg-slate-800 rounded-full relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"
                            animate={step >= 1 && step < 4 ? { x: ['-100%', '100%'] } : { x: '-100%' }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                    </div>

                    <div className="flex flex-col items-center group cursor-help relative">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform">
                            <ArrowLeftRight className="text-orange-400" size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-orange-400 mt-1">Stream (CDC)</span>

                        {/* Tooltip */}
                        <div className="absolute top-12 w-48 bg-slate-800 text-[10px] text-slate-300 p-2 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Decouples ingestion from processing. Captures changes (INSERT/UPDATE) automatically.
                        </div>
                    </div>

                    <div className="w-32 h-1 bg-slate-800 rounded-full relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"
                            animate={step >= 3 && step < 4 ? { x: ['-100%', '100%'] } : { x: '-100%' }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                    </div>

                    <div className="flex flex-col items-center group">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                            <Database className="text-purple-400" size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-purple-400 mt-1">Snowflake</span>
                    </div>
                </div>

                <button onClick={onBack} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ArrowRight className="rotate-180" size={20} />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* --- Left Panel: Controls & Diff Engine --- */}
                <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col p-4 gap-4 shrink-0 z-20 shadow-xl overflow-y-auto">
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {(['type1', 'type2', 'type3'] as ScdType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => { setActiveTab(type); resetSimulation(); }}
                                className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all
                                    ${activeTab === type
                                        ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {type.replace('type', 'Type ')}
                            </button>
                        ))}
                    </div>

                    {/* Incoming Data */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incoming Stream</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase block mb-1">Location Value</label>
                            <input
                                type="text"
                                value={incomingLocation}
                                onChange={(e) => {
                                    setIncomingLocation(e.target.value);
                                    if (step > 0) setStep(0);
                                }}
                                className="w-full bg-slate-950 p-2 rounded border border-slate-700 focus:border-blue-500 text-white font-mono text-xs outline-none"
                            />
                        </div>
                    </div>

                    {/* --- Visual Diff Engine --- */}
                    <div className="flex-1 min-h-[150px] relative">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Search size={12} /> Diff Engine
                        </div>

                        <div className={`bg-slate-950 rounded-lg border-2 p-3 relative overflow-hidden transition-colors duration-500
                             ${step === 2 && !isHashMatch ? 'border-red-500/50' : 'border-slate-800'}
                        `}>
                            {/* Laser Scanner */}
                            {step === 1 && (
                                <motion.div
                                    className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] z-10"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            )}

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>Incoming Hash</span>
                                    </div>
                                    <div className="font-mono text-xs text-orange-400 bg-slate-900 p-1.5 rounded border border-slate-800 break-all">
                                        {incomingHash}
                                    </div>
                                </div>
                                <div className="flex justify-center text-slate-600">
                                    <ArrowLeftRight size={14} className="rotate-90" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>Current Hash</span>
                                    </div>
                                    <div className="font-mono text-xs text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800 break-all">
                                        {activeRow?.hash || 'NULL'}
                                    </div>
                                </div>
                            </div>

                            {step >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`absolute inset-0 bg-slate-950/90 flex items-center justify-center backdrop-blur-sm`}
                                >
                                    <div className={`text-center p-2 rounded-lg border ${isHashMatch ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                        {isHashMatch ? <CheckCircle className="text-green-400 mx-auto mb-1" size={24} /> : <AlertTriangle className="text-red-400 mx-auto mb-1" size={24} />}
                                        <div className={`text-xs font-bold ${isHashMatch ? 'text-green-400' : 'text-red-400'}`}>
                                            {isHashMatch ? 'NO CHANGE' : 'DELTA DETECTED'}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-auto space-y-2">
                        {step === 0 && (
                            <button
                                onClick={runPipeline}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <RefreshCw size={14} /> Run Pipeline
                            </button>
                        )}
                        {step === 2 && !isHashMatch && (
                            <button
                                onClick={applyUpdate}
                                className={`w-full py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-xs
                                    ${activeTab === 'type1' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' :
                                        activeTab === 'type2' ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' :
                                            'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                            >
                                <Database size={14} /> Apply Update
                            </button>
                        )}
                        <button
                            onClick={resetSimulation}
                            className="w-full py-2 text-slate-500 hover:text-white text-[10px] font-medium transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* --- Center: Visualization Table --- */}
                <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
                    {/* Main Table Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Database size={18} className="text-slate-400" /> DIM_CUSTOMER
                                </h2>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span> Active
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span> History
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="p-3 font-medium">SK</th>
                                        <th className="p-3 font-medium">ID</th>
                                        <th className="p-3 font-medium">Name</th>
                                        <th className="p-3 font-medium">Location</th>
                                        {activeTab === 'type3' && <th className="p-3 font-medium text-blue-400">Prev_Loc</th>}
                                        <th className="p-3 font-medium">Start_Date</th>
                                        <th className="p-3 font-medium">End_Date</th>
                                        <th className="p-3 font-medium">Current</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredData.map((row) => (
                                            <motion.tr
                                                key={row.surrogateKey}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{
                                                    opacity: row.currentFlag ? 1 : 0.4,
                                                    x: 0,
                                                    backgroundColor: row.currentFlag ? 'rgba(15, 23, 42, 0)' : 'rgba(15, 23, 42, 0.3)',
                                                }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.4 }}
                                                className={`group hover:bg-slate-800/30 transition-colors
                                                    ${row.currentFlag ? 'text-slate-200' : 'text-slate-500 italic'}
                                                `}
                                            >
                                                <td className="p-3 font-mono text-[10px] opacity-50">{row.surrogateKey}</td>
                                                <td className="p-3 text-xs">{row.customerId}</td>
                                                <td className="p-3 text-xs font-medium">{row.name}</td>

                                                <td className="p-3 text-xs relative">
                                                    <motion.span
                                                        layoutId={`loc-${row.surrogateKey}`}
                                                        className={`inline-block px-1.5 py-0.5 rounded
                                                            ${row.currentFlag && step === 4 ? 'bg-green-500/10 text-green-400' : ''}
                                                        `}
                                                    >
                                                        {row.location}
                                                    </motion.span>
                                                </td>

                                                {activeTab === 'type3' && (
                                                    <td className="p-3 text-xs text-blue-400 font-mono">
                                                        <motion.span layoutId={`prev-${row.surrogateKey}`}>
                                                            {row.prevLocation}
                                                        </motion.span>
                                                    </td>
                                                )}

                                                <td className="p-3 text-[10px] font-mono opacity-70">{row.startDate}</td>
                                                <td className="p-3 text-[10px] font-mono opacity-70">{row.endDate || 'NULL'}</td>
                                                <td className="p-3">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border
                                                        ${row.currentFlag
                                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                            : 'bg-slate-800 text-slate-500 border-slate-700'}
                                                    `}>
                                                        {row.currentFlag ? 'TRUE' : 'FALSE'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- Bottom Panels (Glass Box) --- */}
                    <div className="h-48 border-t border-slate-800 bg-slate-900/80 flex">
                        {/* System Execution Log */}
                        <div className="flex-1 border-r border-slate-800 p-4 font-mono text-xs overflow-y-auto">
                            <div className="flex items-center gap-2 text-slate-400 mb-2 sticky top-0 bg-slate-900/80 backdrop-blur pb-2 border-b border-slate-800/50">
                                <Terminal size={12} /> System Execution Log
                            </div>
                            <div className="space-y-1">
                                <AnimatePresence>
                                    {logs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`
                                                ${log.includes('ERROR') || log.includes('⚠️') ? 'text-red-400' : ''}
                                                ${log.includes('SUCCESS') || log.includes('✅') ? 'text-green-400' : ''}
                                                ${log.includes('INFO') ? 'text-blue-400' : 'text-slate-300'}
                                            `}
                                        >
                                            <span className="opacity-30 mr-2">{new Date().toLocaleTimeString()}</span>
                                            {log}
                                        </motion.div>
                                    ))}
                                    {logs.length === 0 && <span className="text-slate-600 italic">Waiting for pipeline trigger...</span>}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* SQL Internals */}
                        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-slate-950">
                            <div className="flex items-center gap-2 text-slate-400 mb-2 sticky top-0 bg-slate-950 pb-2 border-b border-slate-800/50">
                                <Code size={12} /> SQL Internals
                            </div>
                            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {getSql().split('\n').map((line, i) => (
                                    <div key={i} className={line.startsWith('--') ? 'text-slate-500 italic' : ''}>
                                        {line}
                                    </div>
                                ))}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SCDSimulator;
