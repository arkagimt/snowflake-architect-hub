import React, { useState } from 'react';

const BridgeTableVisualizer = () => {
    const [hasBridge, setHasBridge] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [showProblem, setShowProblem] = useState(false);

    const employees = [
        { id: 1, name: 'Alice Chen', role: 'Data Engineer' },
        { id: 2, name: 'Bob Kumar', role: 'Tech Lead' },
        { id: 3, name: 'Carol Smith', role: 'Analyst' },
    ];

    const projects = [
        { id: 101, name: 'VPI Analytics', status: 'Active' },
        { id: 102, name: 'ERP Migration', status: 'Active' },
        { id: 103, name: 'Data Lake', status: 'Planning' },
    ];

    // Many-to-many mappings
    const mappings = [
        { empId: 1, projId: 101, role: 'Developer', hours: 20 },
        { empId: 1, projId: 102, role: 'Lead', hours: 15 },
        { empId: 2, projId: 101, role: 'Reviewer', hours: 10 },
        { empId: 2, projId: 102, role: 'Lead', hours: 25 },
        { empId: 2, projId: 103, role: 'Architect', hours: 5 },
        { empId: 3, projId: 101, role: 'Analyst', hours: 30 },
    ];

    const addBridge = () => {
        if (isAnimating || hasBridge) return;
        setIsAnimating(true);
        setTimeout(() => {
            setHasBridge(true);
            setIsAnimating(false);
        }, 1000);
    };

    const reset = () => {
        setHasBridge(false);
        setSelectedEmployee(null);
        setShowProblem(false);
    };

    const showCartesianProblem = () => {
        setShowProblem(true);
    };

    const getEmployeeProjects = (empId: number) => {
        return mappings.filter(m => m.empId === empId);
    };

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">🌉 Many-to-Many Relationships</h3>
                        <p className="text-sm text-slate-400">
                            Employees ↔ Projects: One employee can work on many projects, one project can have many employees
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!hasBridge && (
                            <button
                                onClick={showCartesianProblem}
                                className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-400 rounded-lg text-sm hover:bg-red-600/30"
                            >
                                ⚠️ Show Cartesian Problem
                            </button>
                        )}
                        <button
                            onClick={addBridge}
                            disabled={isAnimating || hasBridge}
                            className={`px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${isAnimating ? 'bg-yellow-600 text-white animate-pulse' :
                                hasBridge ? 'bg-green-600 text-white cursor-default' :
                                    'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                        >
                            {isAnimating ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : hasBridge ? (
                                <>✅ Bridge Added</>
                            ) : (
                                <>🌉 Add Bridge Table</>
                            )}
                        </button>
                        {hasBridge && (
                            <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm">
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Visualization */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 mb-6">
                    <div className="flex items-start justify-between gap-8">

                        {/* Employees Table */}
                        <div className="flex-1">
                            <div className="bg-blue-900/30 border-2 border-blue-500 rounded-xl p-4">
                                <div className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                                    <span>👤</span> EMPLOYEES
                                </div>
                                <div className="space-y-2">
                                    {employees.map(emp => {
                                        const isSelected = selectedEmployee === emp.id;
                                        const hasConnection = hasBridge && getEmployeeProjects(emp.id).length > 0;
                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => hasBridge && setSelectedEmployee(isSelected ? null : emp.id)}
                                                className={`p-3 rounded-lg transition cursor-pointer ${isSelected ? 'bg-blue-500/30 border border-blue-400' :
                                                    hasConnection ? 'bg-slate-800 hover:bg-slate-700' :
                                                        'bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-semibold text-white text-sm">{emp.name}</div>
                                                        <div className="text-xs text-slate-400">{emp.role}</div>
                                                    </div>
                                                    <div className="text-xs mono text-slate-500">ID: {emp.id}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Bridge Table (appears in center) */}
                        <div className="flex-1 flex items-center justify-center min-h-[280px]">
                            {!hasBridge ? (
                                <div className={`text-center ${isAnimating ? 'animate-pulse' : ''}`}>
                                    <div className="text-4xl mb-3 text-slate-600">?</div>
                                    <div className="text-sm text-slate-500">
                                        {isAnimating ? 'Creating bridge...' : 'No direct relationship possible'}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-2">Many-to-Many requires a bridge table</div>
                                </div>
                            ) : (
                                <div className="bg-emerald-900/30 border-2 border-emerald-500 rounded-xl p-4 w-full animate-slide">
                                    <div className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2">
                                        <span>🌉</span> EMPLOYEE_PROJECT_MAPPING
                                    </div>
                                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                        {mappings.map((m, idx) => {
                                            const isHighlighted = selectedEmployee === m.empId;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-2 rounded text-xs flex justify-between items-center transition ${isHighlighted ? 'bg-emerald-500/30 border border-emerald-400' : 'bg-slate-800/50'
                                                        }`}
                                                >
                                                    <div className="flex gap-3">
                                                        <span className="text-blue-400 mono">E:{m.empId}</span>
                                                        <span className="text-slate-500">→</span>
                                                        <span className="text-orange-400 mono">P:{m.projId}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <span className="text-slate-400">{m.role}</span>
                                                        <span className="text-slate-500">{m.hours}h</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                                        ✅ Stores additional attributes: <span className="text-emerald-400">role, hours</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Projects Table */}
                        <div className="flex-1">
                            <div className="bg-orange-900/30 border-2 border-orange-500 rounded-xl p-4">
                                <div className="text-xs font-bold text-orange-400 uppercase mb-3 flex items-center gap-2">
                                    <span>📁</span> PROJECTS
                                </div>
                                <div className="space-y-2">
                                    {projects.map(proj => {
                                        const isConnected = hasBridge && selectedEmployee &&
                                            mappings.some(m => m.empId === selectedEmployee && m.projId === proj.id);
                                        return (
                                            <div
                                                key={proj.id}
                                                className={`p-3 rounded-lg transition ${isConnected ? 'bg-orange-500/30 border border-orange-400' : 'bg-slate-800/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-semibold text-white text-sm">{proj.name}</div>
                                                        <div className="text-xs text-slate-400">{proj.status}</div>
                                                    </div>
                                                    <div className="text-xs mono text-slate-500">ID: {proj.id}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hint */}
                    {hasBridge && !selectedEmployee && (
                        <div className="mt-6 text-center text-sm text-slate-500">
                            👆 Click on an employee to see their project connections
                        </div>
                    )}
                </div>

                {/* Cartesian Problem Modal */}
                {showProblem && !hasBridge && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 mb-6 animate-slide">
                        <h4 className="text-red-400 font-bold mb-3">⚠️ The Cartesian Product Problem</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm text-slate-300 mb-3">
                                    <strong>Without bridge table:</strong> Direct JOIN creates explosion
                                </div>
                                <div className="bg-slate-900 rounded-lg p-3 mono text-xs">
                                    <div className="text-red-400">-- BAD: Creates duplicates!</div>
                                    <div className="text-slate-400">SELECT * FROM Employees e</div>
                                    <div className="text-slate-400">JOIN Projects p</div>
                                    <div className="text-slate-400">  ON <span className="text-red-400">???</span> -- No FK relationship!</div>
                                    <div className="mt-2 text-red-400">-- Result: 3 × 3 = 9 rows (Cartesian)</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-300 mb-3">
                                    <strong>With bridge table:</strong> Proper relationship
                                </div>
                                <div className="bg-slate-900 rounded-lg p-3 mono text-xs">
                                    <div className="text-green-400">-- GOOD: Only matching rows</div>
                                    <div className="text-slate-400">SELECT * FROM Employees e</div>
                                    <div className="text-slate-400">JOIN Emp_Proj_Map m ON e.id = m.emp_id</div>
                                    <div className="text-slate-400">JOIN Projects p ON m.proj_id = p.id</div>
                                    <div className="mt-2 text-green-400">-- Result: Only 6 valid mappings</div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowProblem(false)}
                            className="mt-4 text-xs text-slate-500 hover:text-slate-300"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* SQL Reference */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                        <h4 className="font-bold text-white mb-3">📜 Bridge Table DDL</h4>
                        <div className="bg-slate-950 rounded-lg p-4 mono text-xs text-slate-400">
                            <div><span className="text-purple-400">CREATE TABLE</span> employee_project_mapping (</div>
                            <div className="pl-4">emp_id <span className="text-cyan-400">INT</span> <span className="text-orange-400">REFERENCES</span> employees(id),</div>
                            <div className="pl-4">proj_id <span className="text-cyan-400">INT</span> <span className="text-orange-400">REFERENCES</span> projects(id),</div>
                            <div className="pl-4">role <span className="text-cyan-400">VARCHAR</span>(50),</div>
                            <div className="pl-4">hours_allocated <span className="text-cyan-400">INT</span>,</div>
                            <div className="pl-4"><span className="text-yellow-400">PRIMARY KEY</span> (emp_id, proj_id)</div>
                            <div>);</div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5">
                        <h4 className="font-bold text-white mb-3">🛣️ Query Pattern</h4>
                        <div className="bg-slate-950 rounded-lg p-4 mono text-xs text-slate-400">
                            <div><span className="text-green-400">-- Find all projects for Alice</span></div>
                            <div><span className="text-purple-400">SELECT</span> e.name, p.name, m.role</div>
                            <div><span className="text-purple-400">FROM</span> employees e</div>
                            <div><span className="text-cyan-400">JOIN</span> employee_project_mapping m</div>
                            <div className="pl-4"><span className="text-purple-400">ON</span> e.id = m.emp_id</div>
                            <div><span className="text-cyan-400">JOIN</span> projects p</div>
                            <div className="pl-4"><span className="text-purple-400">ON</span> m.proj_id = p.id</div>
                            <div><span className="text-purple-400">WHERE</span> e.name = <span className="text-yellow-400">'Alice Chen'</span>;</div>
                        </div>
                    </div>
                </div>

                {/* Interview Tips */}
                {hasBridge && (
                    <div className="mt-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5 animate-slide">
                        <h4 className="text-emerald-400 font-bold mb-3">🎉 Interview Talking Points</h4>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>• <strong>Bridge tables</strong> (also called junction/associative tables) resolve M:M relationships</li>
                            <li>• <strong>Composite primary key:</strong> (emp_id, proj_id) ensures unique combinations</li>
                            <li>• <strong>Extra attributes:</strong> Bridge tables can store relationship-specific data (role, hours, start_date)</li>
                            <li>• <strong>VPI Example:</strong> BOM_COMPONENT_SUBSTITUTES could be a bridge between components that are interchangeable</li>
                            <li>• <strong>Avoid fan trap:</strong> Always join through the bridge, never directly between the two main tables</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BridgeTableVisualizer;
