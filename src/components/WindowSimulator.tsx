import React, { useState, useEffect } from 'react';

const WindowSimulator = ({ onBack }: { onBack: () => void }) => {
    const [windowFunc, setWindowFunc] = useState<'row_number' | 'rank' | 'dense_rank' | 'lead' | 'lag'>('row_number');
    const [usePartition, setUsePartition] = useState(false);
    const [sortedData, setSortedData] = useState<any[]>([]);
    const [isSorting, setIsSorting] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Cricket World Cup Data
    const teamsData = [
        { id: 1, team: 'India', points: 18, nrr: 2.570, group: 'A' },
        { id: 2, team: 'South Africa', points: 14, nrr: 1.261, group: 'A' },
        { id: 3, team: 'Australia', points: 14, nrr: 0.841, group: 'A' },
        { id: 4, team: 'New Zealand', points: 10, nrr: 0.743, group: 'A' },
        { id: 5, team: 'Pakistan', points: 8, nrr: -0.199, group: 'A' },
        { id: 6, team: 'Afghanistan', points: 8, nrr: -0.336, group: 'A' },
        { id: 7, team: 'England', points: 6, nrr: -0.572, group: 'B' }, // Changed group for demo
        { id: 8, team: 'Bangladesh', points: 4, nrr: -1.087, group: 'B' },
        { id: 9, team: 'Sri Lanka', points: 4, nrr: -1.419, group: 'B' },
        { id: 10, team: 'Netherlands', points: 4, nrr: -1.825, group: 'B' },
    ];

    const calculateWindowResults = (data: typeof teamsData) => {
        const sorted = [...data].sort((a, b) => {
            if (usePartition) {
                if (a.group !== b.group) return a.group.localeCompare(b.group);
            }
            return b.points - a.points || b.nrr - a.nrr;
        });

        let currentRank = 0;
        let currentDenseRank = 0;
        let lastPoints = -1;
        let lastGroup = '';
        let skipCount = 0;

        return sorted.map((team, idx) => {
            // Reset for partition
            if (usePartition && team.group !== lastGroup) {
                currentRank = 0;
                currentDenseRank = 0;
                lastPoints = -1;
                skipCount = 0;
                lastGroup = team.group;
            }

            const row_number = usePartition
                ? sorted.filter(t => t.group === team.group).findIndex(t => t.id === team.id) + 1
                : idx + 1;

            let rank: number;
            let dense_rank: number;

            if (team.points === lastPoints) {
                rank = currentRank;
                dense_rank = currentDenseRank;
                skipCount++;
            } else {
                currentRank += 1 + skipCount;
                currentDenseRank += 1;
                rank = currentRank;
                dense_rank = currentDenseRank;
                skipCount = 0;
            }

            lastPoints = team.points;

            // Lead/Lag calculations
            const partitionData = usePartition
                ? sorted.filter(t => t.group === team.group)
                : sorted;
            const posInPartition = partitionData.findIndex(t => t.id === team.id);

            const lead = posInPartition < partitionData.length - 1
                ? partitionData[posInPartition + 1]?.team
                : null;
            const lag = posInPartition > 0
                ? partitionData[posInPartition - 1]?.team
                : null;

            return { ...team, row_number, rank, dense_rank, lead, lag };
        });
    };

    const runAnimation = () => {
        setIsSorting(true);
        setShowResults(false);

        setTimeout(() => {
            setSortedData(calculateWindowResults(teamsData));
            setIsSorting(false);
            setTimeout(() => setShowResults(true), 300);
        }, 800);
    };

    useEffect(() => {
        setSortedData(calculateWindowResults(teamsData));
        setShowResults(true);
    }, [windowFunc, usePartition]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const functions = [
        { id: 'row_number', label: 'ROW_NUMBER()', icon: '#', desc: 'Unique sequential' },
        { id: 'rank', label: 'RANK()', icon: '🏆', desc: 'Ties skip ranks' },
        { id: 'dense_rank', label: 'DENSE_RANK()', icon: '🎖️', desc: 'Ties no skip' },
        { id: 'lead', label: 'LEAD()', icon: '⏭️', desc: 'Next row value' },
        { id: 'lag', label: 'LAG()', icon: '⏮️', desc: 'Previous row value' },
    ];

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                        🪟
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Window Functions Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Ranking • Lead/Lag • Partitions</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">

                {/* Left Panel: Controls */}
                <div className="w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Function</h3>
                        <div className="space-y-2">
                            {functions.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setWindowFunc(f.id as any)}
                                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition ${windowFunc === f.id
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="text-lg">{f.icon}</span>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">{f.label}</div>
                                        <div className="text-[10px] opacity-70">{f.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Partitioning</h3>
                        <button
                            onClick={() => setUsePartition(!usePartition)}
                            className={`w-full p-4 rounded-xl border-2 transition flex items-center justify-between ${usePartition
                                ? 'border-green-500 bg-green-900/20 text-white'
                                : 'border-slate-700 bg-slate-800/50 text-slate-400'
                                }`}
                        >
                            <div className="text-left">
                                <div className="font-bold text-sm">PARTITION BY group</div>
                                <div className="text-[10px] opacity-70">Reset rank per group</div>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${usePartition ? 'bg-green-500' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${usePartition ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="mt-auto">
                        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">SQL Syntax</div>
                            <code className="text-xs font-mono text-purple-300 block">
                                {windowFunc.toUpperCase()}() OVER (<br />
                                {usePartition && <span className="text-green-400">&nbsp;&nbsp;PARTITION BY group<br /></span>}
                                &nbsp;&nbsp;ORDER BY points DESC<br />
                                )
                            </code>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Visualization */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-950">
                    <div className="max-w-4xl mx-auto">

                        {/* Table Card */}
                        <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    🏏 Cricket World Cup Points Table
                                    {usePartition && <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">PARTITION BY group</span>}
                                </h4>
                                <button
                                    onClick={runAnimation}
                                    disabled={isSorting}
                                    className={`px-4 py-2 rounded-lg font-semibold transition ${isSorting ? 'bg-yellow-600 animate-pulse' : 'bg-green-600 hover:bg-green-500'
                                        } text-white`}
                                >
                                    {isSorting ? '🔄 Sorting...' : '▶ Run ORDER BY points DESC'}
                                </button>
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-slate-500 uppercase px-4">
                                <div className="col-span-3">Team</div>
                                <div className="text-center">Pts</div>
                                <div className="text-center">NRR</div>
                                <div className="text-center">Grp</div>
                                <div className="col-span-2 text-center bg-yellow-900/30 rounded px-1">
                                    {windowFunc === 'row_number' && 'ROW_#'}
                                    {windowFunc === 'rank' && 'RANK'}
                                    {windowFunc === 'dense_rank' && 'D_RANK'}
                                    {windowFunc === 'lead' && 'LEAD'}
                                    {windowFunc === 'lag' && 'LAG'}
                                </div>
                                <div className="col-span-4 text-center">Explanation</div>
                            </div>

                            {/* Team Rows */}
                            <div className="space-y-2">
                                {sortedData.map((team, idx) => {
                                    const isPartitionStart = usePartition && (idx === 0 || sortedData[idx - 1]?.group !== team.group);
                                    const isTied = windowFunc !== 'lead' && windowFunc !== 'lag' &&
                                        sortedData.some((t, i) => i !== idx && t.points === team.points && (!usePartition || t.group === team.group));

                                    const resultValue = windowFunc === 'row_number' ? team.row_number :
                                        windowFunc === 'rank' ? team.rank :
                                            windowFunc === 'dense_rank' ? team.dense_rank :
                                                windowFunc === 'lead' ? team.lead :
                                                    team.lag;

                                    // Find previous/next team for lead/lag arrows
                                    const prevTeam = idx > 0 ? sortedData[idx - 1] : null;
                                    const nextTeam = idx < sortedData.length - 1 ? sortedData[idx + 1] : null;

                                    return (
                                        <React.Fragment key={team.id}>
                                            {/* Partition Divider */}
                                            {isPartitionStart && usePartition && (
                                                <div className="flex items-center gap-4 py-2">
                                                    <div className="h-px flex-1 bg-slate-700"></div>
                                                    <span className="text-xs font-bold text-green-400 bg-slate-800 px-3 py-1 rounded-full border border-green-500/30">
                                                        Group {team.group}
                                                    </span>
                                                    <div className="h-px flex-1 bg-slate-700"></div>
                                                </div>
                                            )}

                                            <div
                                                className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all duration-500 ${isSorting
                                                    ? 'translate-y-4 opacity-0'
                                                    : 'translate-y-0 opacity-100'
                                                    } ${isTied && (windowFunc === 'rank' || windowFunc === 'dense_rank')
                                                        ? 'bg-yellow-900/10 border-yellow-500/30'
                                                        : 'bg-slate-800 border-slate-700'
                                                    }`}
                                                style={{ transitionDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="col-span-3 font-semibold text-white flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                                                        {team.id}
                                                    </span>
                                                    {team.team}
                                                </div>
                                                <div className="text-center font-mono text-slate-300">{team.points}</div>
                                                <div className="text-center font-mono text-slate-500 text-xs">{team.nrr}</div>
                                                <div className="text-center font-mono text-slate-500 text-xs">{team.group}</div>

                                                {/* Result Column */}
                                                <div className="col-span-2 text-center relative">
                                                    {showResults && (
                                                        <div className={`inline-flex items-center justify-center w-12 h-10 rounded-lg font-bold text-lg animate-slide ${(windowFunc === 'lead' || windowFunc === 'lag')
                                                            ? resultValue ? 'bg-purple-900/50 border border-purple-500 text-purple-400 text-xs' : 'bg-slate-700 text-slate-500'
                                                            : isTied ? 'bg-yellow-900/50 border-2 border-yellow-500 text-yellow-400' : 'bg-cyan-900/50 border border-cyan-500 text-cyan-400'
                                                            }`}>
                                                            {resultValue ?? 'NULL'}
                                                        </div>
                                                    )}

                                                    {/* Lead Arrow */}
                                                    {windowFunc === 'lead' && showResults && nextTeam && (!usePartition || nextTeam.group === team.group) && (
                                                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-purple-400">
                                                            ⬇
                                                        </div>
                                                    )}

                                                    {/* Lag Arrow */}
                                                    {windowFunc === 'lag' && showResults && prevTeam && (!usePartition || prevTeam.group === team.group) && (
                                                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-purple-400">
                                                            ⬆
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Explanation */}
                                                <div className="col-span-4 text-xs text-slate-400 pl-4 border-l border-slate-700">
                                                    {showResults && (
                                                        <>
                                                            {windowFunc === 'row_number' && (
                                                                isTied ? `Tied at ${team.points}pts but gets unique #${team.row_number}` : `Position ${team.row_number} in order`
                                                            )}
                                                            {windowFunc === 'rank' && (
                                                                isTied
                                                                    ? team.rank === 1
                                                                        ? '3-way tie for 1st → ranks 2,3 skipped!'
                                                                        : `Tied → same rank ${team.rank}`
                                                                    : `Rank ${team.rank}`
                                                            )}
                                                            {windowFunc === 'dense_rank' && (
                                                                isTied
                                                                    ? `Tied → same rank ${team.dense_rank}, NO skip!`
                                                                    : `Dense rank ${team.dense_rank} (sequential)`
                                                            )}
                                                            {windowFunc === 'lead' && (
                                                                team.lead ? `Next team: ${team.lead}` : 'Last in partition → NULL'
                                                            )}
                                                            {windowFunc === 'lag' && (
                                                                team.lag ? `Prev team: ${team.lag}` : 'First in partition → NULL'
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Interview Tips */}
                        <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
                            <h4 className="text-yellow-400 font-bold mb-3">🎉 Interview Talking Points</h4>
                            <ul className="text-sm text-slate-300 space-y-2">
                                <li>• <strong>ROW_NUMBER:</strong> Use when you need exactly one row per group (e.g., "latest order per customer")</li>
                                <li>• <strong>RANK vs DENSE_RANK:</strong> RANK for competitions (skip places), DENSE_RANK for pagination (no gaps)</li>
                                <li>• <strong>LEAD/LAG:</strong> Perfect for calculating period-over-period changes without self-joins!</li>
                                <li>• <strong>PARTITION BY:</strong> Resets the window function for each group. Like GROUP BY but keeps all rows.</li>
                                <li>• <strong>VPI Context:</strong> Use ROW_NUMBER() PARTITION BY part_id ORDER BY date DESC to get latest status per part!</li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default WindowSimulator;
