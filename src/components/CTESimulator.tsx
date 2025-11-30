import React, { useState, useEffect, useRef } from 'react';

// --- Types ---
interface BomItem {
    parent: string;
    child: string;
    qty: number;
}

interface ResultRow extends BomItem {
    level: number;
}

// --- Data ---
const sourceData: BomItem[] = [
    { parent: 'ENGINE-VPI-001', child: 'BLOCK-ASM', qty: 1 },
    { parent: 'ENGINE-VPI-001', child: 'PISTON-SET', qty: 6 },
    { parent: 'ENGINE-VPI-001', child: 'CRANKSHAFT', qty: 1 },
    { parent: 'BLOCK-ASM', child: 'CYLINDER-LINER', qty: 6 },
    { parent: 'BLOCK-ASM', child: 'CAM-BEARING', qty: 12 },
    { parent: 'PISTON-SET', child: 'PISTON-RING', qty: 3 },
    { parent: 'PISTON-SET', child: 'WRIST-PIN', qty: 1 },
    { parent: 'PISTON-RING', child: 'STEEL-COAT', qty: 1 },
    { parent: 'TURBO-ASSY', child: 'IMPELLER', qty: 1 }
];

const sqlLines = [
    { id: 1, text: "WITH RECURSIVE BOM_Hierarchy AS (" },
    { id: 2, text: "  -- ANCHOR: Find root components", type: 'comment' },
    { id: 3, text: "  SELECT Parent_ID, Child_ID, Qty," },
    { id: 4, text: "         1 AS Level" },
    { id: 5, text: "  FROM BOM_COMPONENTS" },
    { id: 6, text: "  WHERE Parent_ID = 'ENGINE-VPI-001'" },
    { id: 7, text: "" },
    { id: 8, text: "  UNION ALL", type: 'keyword' },
    { id: 9, text: "" },
    { id: 10, text: "  -- RECURSIVE: Find children", type: 'comment' },
    { id: 11, text: "  SELECT c.Parent_ID, c.Child_ID, c.Qty," },
    { id: 12, text: "         p.Level + 1" },
    { id: 13, text: "  FROM BOM_COMPONENTS c" },
    { id: 14, text: "  JOIN BOM_Hierarchy p" },
    { id: 15, text: "    ON c.Parent_ID = p.Child_ID" },
    { id: 16, text: ")" },
    { id: 17, text: "SELECT * FROM BOM_Hierarchy;" }
];

const CTESimulator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // State
    const [currentStep, setCurrentStep] = useState(0);
    const [results, setResults] = useState<ResultRow[]>([]);
    const [inputBuffer, setInputBuffer] = useState<ResultRow[]>([]);
    const [outputBuffer, setOutputBuffer] = useState<ResultRow[]>([]);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
    const [highlightType, setHighlightType] = useState<'anchor' | 'union' | 'recursive' | 'terminate'>('anchor');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeConcept, setActiveConcept] = useState<string>('');
    const [matchedItems, setMatchedItems] = useState<string[]>([]);
    const [iteration, setIteration] = useState(0);

    // UI State
    const [stepLabel, setStepLabel] = useState("Ready");
    const [stepTitle, setStepTitle] = useState("Welcome to the Simulator");
    const [stepDesc, setStepDesc] = useState("This interactive tool visualizes how a Recursive CTE explodes a BOM hierarchy level by level. Click Next Step to begin.");
    const [isFinished, setIsFinished] = useState(false);

    const resultEndRef = useRef<HTMLTableRowElement>(null);

    // Auto-scroll
    useEffect(() => {
        resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [results]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
            if (e.key === 'ArrowRight' && !isFinished) handleNextStep();
            if (e.key === 'r' || e.key === 'R') resetSimulation();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep, isFinished, inputBuffer, outputBuffer]);

    // Reset
    const resetSimulation = () => {
        setCurrentStep(0);
        setResults([]);
        setInputBuffer([]);
        setOutputBuffer([]);
        setCurrentLevel(0);
        setHighlightedLines([]);
        setHighlightType('anchor');
        setIsProcessing(false);
        setActiveConcept('');
        setMatchedItems([]);
        setIteration(0);
        setIsFinished(false);
        setStepLabel("Ready");
        setStepTitle("Welcome to the Simulator");
        setStepDesc("This interactive tool visualizes how a Recursive CTE explodes a BOM hierarchy level by level. Click Next Step to begin.");
    };

    // Next Step
    const handleNextStep = () => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);

        switch (nextStep) {
            case 1: // Anchor
                setStepLabel("Step 1 of 7");
                setStepTitle("Anchor Query Executes");
                setStepDesc("The Anchor Member runs first — and only once. It finds all components where parent is 'ENGINE-VPI-001' and assigns them Level 1.");
                setHighlightedLines([2, 3, 4, 5, 6]);
                setHighlightType('anchor');
                setActiveConcept('anchor');

                const anchors = sourceData.filter(d => d.parent === 'ENGINE-VPI-001');
                const anchorRows = anchors.map(a => ({ ...a, level: 1 }));

                setResults(anchorRows);
                setOutputBuffer(anchorRows);
                setCurrentLevel(1);
                setMatchedItems(anchors.map(a => `${a.parent}-${a.child}`));
                break;

            case 2: // UNION ALL
                setStepLabel("Step 2 of 7");
                setStepTitle("UNION ALL Connects");
                setStepDesc("The UNION ALL stacks results together. Output moves to input buffer — these items become 'parents' for the next search.");
                setHighlightedLines([8]);
                setHighlightType('union');
                setActiveConcept('union');

                setInputBuffer(outputBuffer);
                setOutputBuffer([]);
                setIsProcessing(true);
                setIteration(1);
                setMatchedItems([]);
                break;

            case 3: // Recursion 1
                setStepLabel("Step 3 of 7");
                setStepTitle("Recursive Query — Iteration 1");
                setStepDesc("The Recursive Member JOINs input buffer against source table. Found children for BLOCK-ASM and PISTON-SET!");
                setHighlightedLines([10, 11, 12, 13, 14, 15]);
                setHighlightType('recursive');
                setActiveConcept('recursive');

                const lvl2Found: ResultRow[] = [];
                const matched: string[] = [];
                inputBuffer.forEach(parent => {
                    const children = sourceData.filter(d => d.parent === parent.child);
                    children.forEach(c => {
                        lvl2Found.push({ ...c, level: 2 });
                        matched.push(`${c.parent}-${c.child}`);
                    });
                });

                setResults(prev => [...prev, ...lvl2Found]);
                setOutputBuffer(lvl2Found);
                setCurrentLevel(2);
                setMatchedItems(matched);
                break;

            case 4: // Prep Loop 2
                setStepLabel("Step 4 of 7");
                setStepTitle("Loop Repeats — Setup");
                setStepDesc("Level 2 results move to input buffer. The database automatically loops again.");
                setHighlightedLines([14, 15]);
                setHighlightType('recursive');
                setActiveConcept('recursive');

                setInputBuffer(outputBuffer);
                setOutputBuffer([]);
                setIteration(2);
                setMatchedItems([]);
                break;

            case 5: // Recursion 2
                setStepLabel("Step 5 of 7");
                setStepTitle("Recursive Query — Iteration 2");
                setStepDesc("Checking Level 2 items for children... Found PISTON-RING has a child: STEEL-COAT!");
                setHighlightedLines([10, 11, 12, 13, 14, 15]);
                setHighlightType('recursive');
                setActiveConcept('recursive');

                const lvl3Found: ResultRow[] = [];
                const matched3: string[] = [];
                inputBuffer.forEach(parent => {
                    const children = sourceData.filter(d => d.parent === parent.child);
                    children.forEach(c => {
                        lvl3Found.push({ ...c, level: 3 });
                        matched3.push(`${c.parent}-${c.child}`);
                    });
                });

                setResults(prev => [...prev, ...lvl3Found]);
                setOutputBuffer(lvl3Found);
                setCurrentLevel(3);
                setMatchedItems(matched3);
                break;

            case 6: // Termination check
                setStepLabel("Step 6 of 7");
                setStepTitle("Termination Check");
                setStepDesc("Level 3 moves to input. Searching for children of STEEL-COAT... Result: 0 rows. The CTE terminates!");
                setHighlightedLines([16]);
                setHighlightType('terminate');
                setActiveConcept('terminate');

                setInputBuffer(outputBuffer);
                setOutputBuffer([]);
                setIsProcessing(false);
                setIteration(3);
                setMatchedItems([]);
                break;

            case 7: // Complete
                setStepLabel("Complete");
                setStepTitle("Hierarchy Exploded! ✅");
                setStepDesc(`The recursive CTE has finished. You now have a flat table representing the entire BOM tree. Total: ${results.length} components across 3 levels.`);
                setHighlightedLines([17]);
                setHighlightType('terminate');
                setActiveConcept('terminate');
                setIsFinished(true);
                break;
        }
    };

    // Color helpers
    const getConceptColor = (concept: string) => {
        switch (concept) {
            case 'anchor': return { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' };
            case 'union': return { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' };
            case 'recursive': return { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' };
            case 'terminate': return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' };
            default: return { bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-slate-400' };
        }
    };

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return 'text-cyan-400';
            case 2: return 'text-purple-400';
            case 3: return 'text-orange-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Additional Styles for CTE */}
            <style>{`
        .conveyor-belt {
          background: repeating-linear-gradient(90deg, #1e293b 0px, #1e293b 15px, #0f172a 15px, #0f172a 30px);
          background-size: 30px 100%;
        }
        .conveyor-active { animation: moveBelt 1s linear infinite; }
        @keyframes moveBelt { from { background-position: 0 0; } to { background-position: 30px 0; } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.4); }
          50% { box-shadow: 0 0 30px rgba(251, 146, 60, 0.6); }
        }
        .pulse-glow { animation: pulse-glow 1s infinite; }
      `}</style>

            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-2xl">
                        🔁
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            Recursive CTE Simulator
                        </h1>
                        <p className="text-xs text-slate-500">Interactive BOM Hierarchy Explosion</p>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <span className="text-xs text-slate-600 hidden sm:block">Press → for next, R to reset</span>
                    <button onClick={resetSimulation} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition">
                        Reset
                    </button>
                    <button
                        onClick={handleNextStep}
                        disabled={isFinished}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2
          ${isFinished ? 'bg-green-600 text-white cursor-default' : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 hover:opacity-90 shadow-lg shadow-cyan-500/25'}`}
                    >
                        {isFinished ? '✅ Complete' : 'Next Step →'}
                    </button>
                </div>
            </header>

            {/* Concept Cards */}
            <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-4">
                <div className="flex gap-3 justify-center flex-wrap">
                    {[
                        { id: 'anchor', num: 1, title: 'Anchor Query', desc: 'Find root nodes' },
                        { id: 'union', num: 2, title: 'UNION ALL', desc: 'Stack results' },
                        { id: 'recursive', num: 3, title: 'Recursive Query', desc: 'Find children' },
                        { id: 'terminate', num: 4, title: 'Termination', desc: 'Stop when empty' }
                    ].map(card => {
                        const colors = getConceptColor(card.id);
                        const isActive = activeConcept === card.id;
                        return (
                            <div
                                key={card.id}
                                className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 min-w-[140px]
              ${isActive ? `${colors.bg} ${colors.border} shadow-lg` : 'bg-slate-800/50 border-slate-700/50 opacity-60'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${colors.bg} ${colors.text}`}>
                                        {card.num}
                                    </span>
                                    <span className={`text-sm font-semibold ${isActive ? colors.text : 'text-slate-400'}`}>
                                        {card.title}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">{card.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: SQL */}
                <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
                    <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span>{'</>'}</span> SQL Query
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto mono text-sm leading-relaxed">
                        {sqlLines.map(line => {
                            const isHighlighted = highlightedLines.includes(line.id);
                            const colors = getConceptColor(highlightType);
                            return (
                                <div
                                    key={line.id}
                                    className={`py-1 px-3 rounded-md transition-all duration-300 border-l-2
                ${isHighlighted ? `${colors.bg} ${colors.border}` : 'border-transparent hover:bg-slate-800/50'}`}
                                >
                                    <span className={
                                        line.type === 'comment' ? 'text-slate-600 italic' :
                                            line.type === 'keyword' ? 'text-purple-400 font-semibold' : 'text-slate-400'
                                    }>
                                        {line.text || '\u00A0'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Center: Visualization */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Source Data */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/30">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📂</span> BOM_COMPONENTS (Source)
                        </div>
                        <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                            {sourceData.map((item, idx) => {
                                const isMatched = matchedItems.includes(`${item.parent}-${item.child}`);
                                return (
                                    <div
                                        key={idx}
                                        className={`p-2 rounded-lg text-xs transition-all duration-300
                  ${isMatched ? 'bg-orange-500/20 border border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-800/50 border border-slate-700/50'}`}
                                    >
                                        <div className="text-slate-500 truncate text-[10px]">{item.parent}</div>
                                        <div className="text-center text-slate-600 text-[10px]">↓</div>
                                        <div className={`font-semibold mono truncate ${isMatched ? 'text-orange-400' : 'text-slate-300'}`}>
                                            {item.child}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Process Zone */}
                    <div className="flex-1 flex items-center justify-center p-8 relative">
                        <div className="flex items-center gap-8 w-full max-w-3xl">

                            {/* Input Buffer */}
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                    <span>📥</span> Input Buffer
                                </div>
                                <div className={`min-h-[140px] rounded-xl border-2 border-dashed p-3 transition-all duration-300
              ${inputBuffer.length > 0 ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
                                    {inputBuffer.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-sm">Waiting...</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {inputBuffer.map((item, idx) => (
                                                <div key={idx} className="bg-slate-800 rounded-lg p-2 border-l-2 border-cyan-500 flex justify-between items-center animate-slide">
                                                    <span className="mono text-sm font-semibold text-slate-200">{item.child}</span>
                                                    <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-400">Lvl {item.level}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Process Icon */}
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-500
              ${isFinished ? 'bg-green-500 text-white shadow-lg shadow-green-500/40' : isProcessing ? 'bg-orange-500 text-white pulse-glow' : 'bg-slate-800 text-slate-500 border-2 border-slate-700'}`}>
                                    {isFinished ? '✅' : isProcessing ? '🔄' : '🔒'}
                                </div>
                                <span className={`text-xs font-semibold transition-opacity ${isProcessing ? 'text-orange-400 opacity-100' : 'opacity-0'}`}>
                                    JOINING...
                                </span>
                            </div>

                            {/* Output Buffer */}
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                    Output <span>📤</span>
                                </div>
                                <div className={`min-h-[140px] rounded-xl border-2 border-dashed p-3 transition-all duration-300
              ${outputBuffer.length > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
                                    {outputBuffer.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                                            {currentStep === 6 ? '∅ No rows found' : 'No results yet'}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {outputBuffer.map((item, idx) => (
                                                <div key={idx} className="bg-slate-800 rounded-lg p-2 border-l-2 border-green-500 flex justify-between items-center animate-slide">
                                                    <span className="mono text-sm font-semibold text-slate-200">{item.child}</span>
                                                    <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-slate-400">Lvl {item.level}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Conveyor Belt */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                            <div className={`w-64 h-2 conveyor-belt rounded-full ${isProcessing ? 'conveyor-active' : ''}`}></div>
                            <span className="text-xs text-slate-600 uppercase tracking-wider">Recursive Loop</span>
                        </div>
                    </div>

                    {/* Result Table */}
                    <div className="h-48 border-t border-slate-800 bg-slate-900/50 p-4 overflow-hidden flex flex-col">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>🏁</span> Final Result Set
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs uppercase text-slate-500 bg-slate-800/50 sticky top-0">
                                    <tr>
                                        <th className="text-left p-2 rounded-l-lg">Level</th>
                                        <th className="text-left p-2">Parent</th>
                                        <th className="text-left p-2">Child</th>
                                        <th className="text-left p-2 rounded-r-lg">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {results.map((row, idx) => (
                                        <tr key={idx} className="animate-slide">
                                            <td className={`p-2 mono font-semibold ${getLevelColor(row.level)}`}>{row.level}</td>
                                            <td className="p-2 text-slate-400">{row.parent}</td>
                                            <td className="p-2 text-orange-300 font-semibold mono">{row.child}</td>
                                            <td className="p-2 text-slate-500">{row.qty}</td>
                                        </tr>
                                    ))}
                                    <tr ref={resultEndRef}></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Explanation */}
                <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
                    <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <span>💡</span> Explanation
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto">
                        <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${getConceptColor(activeConcept || 'anchor').text}`}>
                            {stepLabel}
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 mb-4 leading-snug">{stepTitle}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{stepDesc}</p>

                        {currentLevel > 0 && (
                            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Variables</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Current Level</span>
                                        <span className="mono font-semibold text-green-400">{currentLevel}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Rows Added</span>
                                        <span className="mono font-semibold text-green-400">{outputBuffer.length || (currentStep === 6 ? 0 : '-')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Total Results</span>
                                        <span className="mono font-semibold text-green-400">{results.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {iteration > 0 && !isFinished && (
                            <div className="mt-4 flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                <span className="text-xs text-slate-400">Iteration:</span>
                                <span className="mono font-semibold text-orange-400">{iteration}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CTESimulator;
