import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Database, Server, RefreshCw, Search, Terminal, Code, AlertTriangle, CheckCircle, ArrowLeftRight, TrendingUp, Users, Info, HelpCircle } from 'lucide-react';

// --- Types ---
type ScdType = 'type1' | 'type2' | 'type3';
type QueryExample = 'current' | 'asOf' | 'history' | null;
type DiffColumn = 'location' | 'status' | null;

interface CustomerRecord {
    surrogateKey: number;
    customerId: number;
    name: string;
    location: string;
    prevLocation?: string;
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

// Tooltip Component
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
    <div className="group relative inline-flex">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-[10px] text-slate-300 p-2 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {text}
        </div>
    </div>
);

const SCDSimulator = ({ onBack }: { onBack: () => void }) => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<ScdType>('type2');
    const [incomingLocation, setIncomingLocation] = useState('Austin, TX');
    const [step, setStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeQuery, setActiveQuery] = useState<QueryExample>(null);
    const [showComparison, setShowComparison] = useState(false);

    // Time Travel State
    const [timeTravelEnabled, setTimeTravelEnabled] = useState(false);
    const [timeTravelDate, setTimeTravelDate] = useState('2024-11-05'); // Default to latest
    const [showHashScanner, setShowHashScanner] = useState(false);
    const [diffColumn, setDiffColumn] = useState<DiffColumn>(null);

    // Real-world E-commerce Data
    const getInitialData = (): CustomerRecord[] => [
        {
            surrogateKey: 1001,
            customerId: 1,
            name: 'Sarah Johnson',
            location: 'New York, NY',
            prevLocation: '-',
            startDate: '2020-01-15',
            endDate: '2022-06-09',
            currentFlag: false,
            hash: generateHash('New York, NY')
        },
        {
            surrogateKey: 1002,
            customerId: 1,
            name: 'Sarah Johnson',
            location: 'San Francisco, CA',
            prevLocation: '-',
            startDate: '2022-06-10',
            endDate: '2024-11-04',
            currentFlag: false,
            hash: generateHash('San Francisco, CA')
        },
        {
            surrogateKey: 1003,
            customerId: 1,
            name: 'Sarah Johnson',
            location: 'Seattle, WA',
            prevLocation: '-',
            startDate: '2024-11-05',
            endDate: null,
            currentFlag: true,
            hash: generateHash('Seattle, WA')
        },
        {
            surrogateKey: 2001,
            customerId: 2,
            name: 'Michael Chen',
            location: 'Seattle, WA',
            prevLocation: '-',
            startDate: '2023-03-20',
            endDate: null,
            currentFlag: true,
            hash: generateHash('Seattle, WA')
        }
    ];

    const [tableData, setTableData] = useState<CustomerRecord[]>(getInitialData());

    // Derived State
    const activeRow = tableData.find(r => r.customerId === 1 && r.currentFlag);
    const incomingHash = generateHash(incomingLocation);
    const isHashMatch = activeRow ? activeRow.hash === incomingHash : false;

    // Performance Metrics
    const initialRowCount = 4;
    const currentRowCount = tableData.length;
    const storageGrowth = ((currentRowCount / initialRowCount - 1) * 100).toFixed(0);

    // Filtered Data
    const getFilteredData = () => {
        // Time Travel Mode - Point-in-Time Reconstruction
        if (timeTravelEnabled && activeTab === 'type2') {
            const selectedDate = new Date(timeTravelDate);
            return tableData.filter(r => {
                const start = new Date(r.startDate);
                const end = r.endDate ? new Date(r.endDate) : new Date('9999-12-31');
                // Show rows that were active at the selected point in time
                return selectedDate >= start && selectedDate < end;
            });
        }

        if (activeTab !== 'type2') return tableData;

        if (activeQuery === 'current') {
            return tableData.filter(r => r.currentFlag);
        } else if (activeQuery === 'asOf') {
            const asOfDate = new Date('2022-01-01');
            return tableData.filter(r => {
                const start = new Date(r.startDate);
                const end = r.endDate ? new Date(r.endDate) : new Date('9999-12-31');
                return asOfDate >= start && asOfDate < end;
            });
        } else if (activeQuery === 'history') {
            return tableData.filter(r => r.customerId === 1).sort((a, b) =>
                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );
        }

        return tableData;
    };

    const filteredData = getFilteredData();

    // --- Actions ---
    const resetSimulation = () => {
        setTableData(getInitialData());
        setStep(0);
        setLogs([]);
        setActiveQuery(null);
    };

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const runPipeline = () => {
        setStep(1);
        setLogs([]);
        setActiveQuery(null);
        setShowHashScanner(true); // Trigger visual scanner
        setDiffColumn(null);
        addLog(`[STEP 1] Scanning Source Stream for CustomerID: 1...`);

        setTimeout(() => {
            addLog(`[STEP 2] Generating MD5('${incomingLocation}') -> '${incomingHash}'`);
            addLog(`[STEP 3] Fetching Active Record for CustomerID: 1...`);
            addLog(`[INFO] Current Active Location: '${activeRow?.location}' (Hash: '${activeRow?.hash}')`);

            // Column-level diff detection
            if (activeRow && activeRow.location !== incomingLocation) {
                setDiffColumn('location');
                addLog(`[DELTA] Column 'Location' changed: ${activeRow.location} → ${incomingLocation}`);
            }

            setTimeout(() => {
                setStep(2);
                setShowHashScanner(false);
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
            name: 'Sarah Johnson',
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
                const newStartDate = '2025-01-01';
                const updatedOld = prev.map(row =>
                    row.surrogateKey === activeRow.surrogateKey
                        ? { ...row, endDate: newStartDate, currentFlag: false }
                        : row
                );
                const newRow: CustomerRecord = {
                    ...newRowBase,
                    surrogateKey: Math.floor(Math.random() * 1000) + 3000,
                    startDate: newStartDate,
                    endDate: null,
                    currentFlag: true,
                    prevLocation: '-'
                };
                return [...updatedOld, newRow].sort((a, b) => a.customerId - b.customerId || (b.currentFlag ? 1 : -1));
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

    // --- SQL Generator with Syntax Highlighting ---
    const highlightSql = (sql: string) => {
        const keywords = ['MERGE', 'INTO', 'USING', 'ON', 'WHEN', 'MATCHED', 'AND', 'THEN', 'UPDATE', 'SET', 'INSERT', 'VALUES', 'WHERE', 'TRUE', 'FALSE', 'SELECT', 'FROM', 'BETWEEN', 'COALESCE', 'ORDER', 'BY'];
        const functions = ['CURRENT_DATE'];

        return sql.split('\n').map((line, i) => {
            let highlightedLine = line;

            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                highlightedLine = highlightedLine.replace(regex, `<span class="text-cyan-400 font-semibold">${keyword}</span>`);
            });

            functions.forEach(func => {
                const regex = new RegExp(`\\b${func}\\b`, 'g');
                highlightedLine = highlightedLine.replace(regex, `<span class="text-purple-400">${func}()</span>`);
            });

            return <div key={i} className={line.startsWith('--') ? 'text-slate-500 italic' : ''} dangerouslySetInnerHTML={{ __html: highlightedLine }} />;
        });
    };

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
            {/* Pipeline Header */}
            <div className="h-20 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-center relative shrink-0 z-30">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

                <div className="flex items-center gap-8 z-10">
                    <div className="flex flex-col items-center group cursor-help">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                            <Server className="text-blue-400" size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-blue-400 mt-1">CRM</span>
                    </div>

                    <svg className="w-32 h-8" viewBox="0 0 128 32">
                        <motion.line
                            x1="0" y1="16" x2="128" y2="16"
                            stroke="#22c55e"
                            strokeWidth="2"
                            strokeDasharray="8 4"
                            animate={step >= 1 && step < 4 ? { strokeDashoffset: [0, -12] } : { strokeDashoffset: 0 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        />
                        <line x1="0" y1="16" x2="128" y2="16" stroke="#1e293b" strokeWidth="1" />
                    </svg>

                    <div className="flex flex-col items-center group cursor-help relative">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform">
                            <ArrowLeftRight className="text-orange-400" size={20} />
                        </div>
                        <span className="text-[10px] font-mono text-orange-400 mt-1">Stream</span>

                        <div className="absolute top-12 w-48 bg-slate-800 text-[10px] text-slate-300 p-2 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Decouples ingestion from processing. Captures CDC (INSERT/UPDATE/DELETE).
                        </div>
                    </div>

                    <svg className="w-32 h-8" viewBox="0 0 128 32">
                        <motion.line
                            x1="0" y1="16" x2="128" y2="16"
                            stroke="#22c55e"
                            strokeWidth="2"
                            strokeDasharray="8 4"
                            animate={step >= 3 && step < 4 ? { strokeDashoffset: [0, -12] } : { strokeDashoffset: 0 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        />
                        <line x1="0" y1="16" x2="128" y2="16" stroke="#1e293b" strokeWidth="1" />
                    </svg>

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
                {/* Left Panel */}
                <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col p-4 gap-4 shrink-0 z-20 shadow-xl overflow-y-auto">
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

                    {/* SCD Comparison Toggle */}
                    <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                        <Info size={14} />
                        {showComparison ? 'Hide' : 'Show'} Type Comparison
                    </button>

                    {/* Comparison Matrix */}
                    <AnimatePresence>
                        {showComparison && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden"
                            >
                                <div className="p-3">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">📊 Type Comparison</div>
                                    <table className="w-full text-[10px]">
                                        <thead>
                                            <tr className="border-b border-slate-700">
                                                <th className="text-left pb-1 text-slate-500">Feature</th>
                                                <th className="text-center pb-1 text-slate-500">T1</th>
                                                <th className="text-center pb-1 text-slate-500">T2</th>
                                                <th className="text-center pb-1 text-slate-500">T3</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300">
                                            <tr className="border-b border-slate-700/50">
                                                <td className="py-1">History</td>
                                                <td className="text-center">❌</td>
                                                <td className="text-center">✅</td>
                                                <td className="text-center">⚠️</td>
                                            </tr>
                                            <tr className="border-b border-slate-700/50">
                                                <td className="py-1">Storage</td>
                                                <td className="text-center text-green-400">Low</td>
                                                <td className="text-center text-red-400">High</td>
                                                <td className="text-center text-yellow-400">Med</td>
                                            </tr>
                                            <tr className="border-b border-slate-700/50">
                                                <td className="py-1">Query</td>
                                                <td className="text-center text-green-400">Simple</td>
                                                <td className="text-center text-yellow-400">Medium</td>
                                                <td className="text-center text-green-400">Simple</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1">Use Case</td>
                                                <td className="text-center">Fix</td>
                                                <td className="text-center">Audit</td>
                                                <td className="text-center">Prev</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Incoming Data */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incoming Stream</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Customer</label>
                                <div className="bg-slate-900 p-2 rounded border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
                                    <Users size={12} className="text-blue-400" />
                                    Sarah Johnson (ID: 1)
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1">New Address</label>
                                <input
                                    type="text"
                                    value={incomingLocation}
                                    onChange={(e) => {
                                        setIncomingLocation(e.target.value);
                                        if (step > 0) setStep(0);
                                    }}
                                    className="w-full bg-slate-950 p-2 rounded border border-slate-700 focus:border-blue-500 text-white font-mono text-xs outline-none"
                                    placeholder="City, State"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Diff Engine */}
                    <div className="flex-1 min-h-[150px] relative">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Search size={12} /> Diff Engine
                        </div>

                        <div className={`bg-slate-950 rounded-lg border-2 p-3 relative overflow-hidden transition-colors duration-500
                             ${step === 2 && !isHashMatch ? 'border-red-500/50' : 'border-slate-800'}
                        `}>
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
                                        <span>Incoming</span>
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
                                        <span>Current</span>
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

                    {/* Performance Metrics */}
                    <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <TrendingUp size={12} /> Metrics
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-900 p-2 rounded">
                                <div className="text-[10px] text-slate-500 mb-1">Rows</div>
                                <div className="font-mono text-white">{currentRowCount}</div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded">
                                <div className="text-[10px] text-slate-500 mb-1">Growth</div>
                                <div className={`font-mono ${parseInt(storageGrowth) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {parseInt(storageGrowth) > 0 ? '+' : ''}{storageGrowth}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
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

                {/* Center: Table & Tips */}
                <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Database size={18} className="text-slate-400" /> DIM_CUSTOMER
                                </h2>
                                <p className="text-xs text-slate-500">E-commerce Shipping Address Master</p>
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

                        {/* Query Examples */}
                        {activeTab === 'type2' && (
                            <div className="mb-4 bg-slate-900/50 rounded-xl border border-slate-800 p-3">
                                <div className="text-xs font-bold text-slate-400 mb-2">📝 Interactive Queries</div>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setActiveQuery('current')}
                                        className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${activeQuery === 'current'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        CURRENT_FLAG = TRUE
                                    </button>
                                    <button
                                        onClick={() => setActiveQuery('asOf')}
                                        className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${activeQuery === 'asOf'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        AS-OF '2022-01-01'
                                    </button>
                                    <button
                                        onClick={() => setActiveQuery('history')}
                                        className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all ${activeQuery === 'history'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Customer #1 History
                                    </button>
                                    <button
                                        onClick={() => setActiveQuery(null)}
                                        className="px-3 py-1.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="p-3 font-medium">
                                            <Tooltip text="Auto-incremented surrogate key. Use this for relationships, not the natural key!">
                                                <div className="flex items-center gap-1 cursor-help">
                                                    SK <HelpCircle size={10} className="text-slate-500" />
                                                </div>
                                            </Tooltip>
                                        </th>
                                        <th className="p-3 font-medium">ID</th>
                                        <th className="p-3 font-medium">Name</th>
                                        <th className="p-3 font-medium">Address</th>
                                        {activeTab === 'type3' && <th className="p-3 font-medium text-blue-400">Prev_Addr</th>}
                                        <th className="p-3 font-medium">
                                            <Tooltip text="Date this version became effective. Use for BETWEEN queries.">
                                                <div className="flex items-center gap-1 cursor-help">
                                                    Start <HelpCircle size={10} className="text-slate-500" />
                                                </div>
                                            </Tooltip>
                                        </th>
                                        <th className="p-3 font-medium">
                                            <Tooltip text="NULL = current row. Otherwise, the date this version expired.">
                                                <div className="flex items-center gap-1 cursor-help">
                                                    End <HelpCircle size={10} className="text-slate-500" />
                                                </div>
                                            </Tooltip>
                                        </th>
                                        <th className="p-3 font-medium">
                                            <Tooltip text="Boolean flag for fast 'latest' queries. Index this column!">
                                                <div className="flex items-center gap-1 cursor-help">
                                                    Current <HelpCircle size={10} className="text-slate-500" />
                                                </div>
                                            </Tooltip>
                                        </th>
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

                            {filteredData.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                                    <Database size={32} className="mb-2 opacity-20" />
                                    <p className="text-xs">No records match the filter</p>
                                </div>
                            )}
                        </div>

                        {/* Interview Tips */}
                        <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                            <h4 className="text-yellow-400 font-bold mb-3">🎯 Interview Talking Points</h4>
                            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                                <li>• <strong className="text-yellow-300">Type 1:</strong> "Use for correcting data quality issues—like fixing typos. History not preserved."</li>
                                <li>• <strong className="text-yellow-300">Type 2:</strong> "Query 'current' with <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-400">CURRENT_FLAG = TRUE</code>, or use <code className="bg-slate-800 px-1 py-0.5 rounded text-purple-400">BETWEEN</code> for point-in-time queries."</li>
                                <li>• <strong className="text-yellow-300">Type 3:</strong> "Perfect when you only need Current vs Previous (e.g., Q4 vs Q3 sales region)."</li>
                                <li>• <strong className="text-yellow-300">Performance:</strong> "Type 2 grows unbounded—partition by year or implement archival."</li>
                                <li>• <strong className="text-yellow-300">Late-Arriving Facts:</strong> "Handle with surrogate keys + 'inferred members' (SK = -1)."</li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Panels */}
                    <div className="h-48 border-t border-slate-800 bg-slate-900/80 flex">
                        {/* Logs */}
                        <div className="flex-1 border-r border-slate-800 p-4 font-mono text-xs overflow-y-auto">
                            <div className="flex items-center gap-2 text-slate-400 mb-2 sticky top-0 bg-slate-900/80 backdrop-blur pb-2 border-b border-slate-800/50">
                                <Terminal size={12} /> System Log
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
                                    {logs.length === 0 && <span className="text-slate-600 italic">Waiting for pipeline...</span>}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* SQL */}
                        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-slate-950">
                            <div className="flex items-center gap-2 text-slate-400 mb-2 sticky top-0 bg-slate-950 pb-2 border-b border-slate-800/50">
                                <Code size={12} /> SQL Internals
                            </div>
                            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {highlightSql(getSql())}
                            </div>
                        </div>
                    </div>

                    {/* ⭐ TIME TRAVEL TIMELINE SLIDER - THE WOW FACTOR ⭐ */}
                    {activeTab === 'type2' && (
                        <div className="h-32 border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
                            <div className="max-w-5xl mx-auto h-full flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Database size={14} className="text-purple-400" />
                                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                                            ⏰ Time Travel - Point-in-Time Reconstruction
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setTimeTravelEnabled(!timeTravelEnabled);
                                            setActiveQuery(null);
                                        }}
                                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${timeTravelEnabled
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {timeTravelEnabled ? '✓ Enabled' : 'Enable'}
                                    </button>
                                </div>

                                {timeTravelEnabled && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex-1"
                                    >
                                        {/* Timeline Slider */}
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="2020-01-15"
                                                max="2025-01-01"
                                                value={timeTravelDate}
                                                onChange={(e) => setTimeTravelDate(e.target.value)}
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
                                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 
                                                    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50
                                                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-purple-400
                                                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                                                    [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0
                                                    [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-purple-500/50"
                                                style={{
                                                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((new Date(timeTravelDate).getTime() - new Date('2020-01-15').getTime()) /
                                                            (new Date('2025-01-01').getTime() - new Date('2020-01-15').getTime())) * 100
                                                        }%, #1e293b ${((new Date(timeTravelDate).getTime() - new Date('2020-01-15').getTime()) /
                                                            (new Date('2025-01-01').getTime() - new Date('2020-01-15').getTime())) * 100
                                                        }%, #1e293b 100%)`
                                                }}
                                            />

                                            {/* Timeline Markers */}
                                            <div className="absolute -top-5 left-0 right-0 flex justify-between text-[9px] text-slate-500 pointer-events-none">
                                                <span>2020</span>
                                                <span>2021</span>
                                                <span>2022</span>
                                                <span>2023</span>
                                                <span>2024</span>
                                                <span>2025</span>
                                            </div>
                                        </div>

                                        {/* Selected Date & SQL Display */}
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-xs text-slate-400">
                                                <span className="text-purple-400 font-mono font-bold text-sm">{timeTravelDate}</span>
                                                <span className="ml-2">— Showing {filteredData.length} row(s) active at this time</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                                                WHERE START_DATE &lt;= '{timeTravelDate}' AND (END_DATE &gt;= '{timeTravelDate}' OR END_DATE IS NULL)
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SCDSimulator;
