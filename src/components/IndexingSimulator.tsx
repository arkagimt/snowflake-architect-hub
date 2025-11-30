import React, { useState, useEffect } from 'react';
import SnowflakeClusteringViz from './SnowflakeClusteringViz';
import FinOpsControlCenter from './FinOpsControlCenter';

const IndexingSimulator = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<'tsql' | 'snowflake' | 'comparison' | 'finops'>('tsql');
    const [indexType, setIndexType] = useState<'heap' | 'clustered' | 'nonclustered' | 'covering'>('heap');
    const [searchId, setSearchId] = useState<number | null>(null);
    const [searchSteps, setSearchSteps] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Sample data for visualization
    const sampleData = [
        { id: 1, name: 'BLOCK-ASM', category: 'Assembly', price: 450 },
        { id: 2, name: 'PISTON-SET', category: 'Engine', price: 280 },
        { id: 3, name: 'CRANKSHAFT', category: 'Engine', price: 890 },
        { id: 5, name: 'CAM-BEARING', category: 'Bearing', price: 45 },
        { id: 8, name: 'CYLINDER-LINER', category: 'Engine', price: 320 },
        { id: 9, name: 'WRIST-PIN', category: 'Engine', price: 65 },
        { id: 13, name: 'PISTON-RING', category: 'Engine', price: 35 },
        { id: 21, name: 'STEEL-COAT', category: 'Coating', price: 120 },
    ];

    // B-Tree structure for visualization
    const btreeStructure = {
        root: { keys: [5, 13], children: ['left', 'middle', 'right'] },
        left: { keys: [1, 2, 3], isLeaf: true, pointers: [1, 2, 3] },
        middle: { keys: [5, 8, 9], isLeaf: true, pointers: [5, 8, 9] },
        right: { keys: [13, 21], isLeaf: true, pointers: [13, 21] },
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const simulateSearch = (id: number) => {
        setSearchId(id);
        setSearchSteps([]);
        setIsSearching(true);

        const steps: string[] = [];

        if (indexType === 'heap') {
            // Table scan
            steps.push('Starting TABLE SCAN (no index)...');
            sampleData.forEach((row, idx) => {
                steps.push(`Checking row ${idx + 1}: ID = ${row.id} ${row.id === id ? '✅ FOUND!' : '❌'}`);
            });
            steps.push(`Rows scanned: ${sampleData.length} | Complexity: O(n)`);
        } else if (indexType === 'clustered' || indexType === 'nonclustered') {
            // B-Tree search
            steps.push('Starting B-TREE INDEX SEEK...');
            steps.push(`ROOT NODE: Checking keys [5, 13]`);

            if (id < 5) {
                steps.push(`${id} < 5 → Navigate to LEFT child`);
                steps.push(`LEAF NODE: Keys [1, 2, 3]`);
            } else if (id < 13) {
                steps.push(`5 ≤ ${id} < 13 → Navigate to MIDDLE child`);
                steps.push(`LEAF NODE: Keys [5, 8, 9]`);
            } else {
                steps.push(`${id} ≥ 13 → Navigate to RIGHT child`);
                steps.push(`LEAF NODE: Keys [13, 21]`);
            }

            const found = sampleData.find(r => r.id === id);
            if (found) {
                if (indexType === 'clustered') {
                    steps.push(`✅ FOUND! Data stored with index leaf.`);
                } else {
                    steps.push(`✅ FOUND key! Following RID pointer to data page...`);
                    steps.push(`KEY LOOKUP: Retrieved row from heap.`);
                }
            } else {
                steps.push(`❌ Key ${id} not found in leaf node.`);
            }
            steps.push(`Rows scanned: ~3 | Complexity: O(log n)`);
        } else if (indexType === 'covering') {
            steps.push('Starting COVERING INDEX SEEK...');
            steps.push(`ROOT NODE: Checking keys [5, 13]`);
            if (id < 5) {
                steps.push(`${id} < 5 → Navigate to LEFT child`);
            } else if (id < 13) {
                steps.push(`5 ≤ ${id} < 13 → Navigate to MIDDLE child`);
            } else {
                steps.push(`${id} ≥ 13 → Navigate to RIGHT child`);
            }
            steps.push(`✅ All columns INCLUDED in index!`);
            steps.push(`NO KEY LOOKUP needed - data in index leaf.`);
            steps.push(`Rows scanned: ~3 | Complexity: O(log n) | FASTEST!`);
        }

        // Animate steps
        steps.forEach((step, idx) => {
            setTimeout(() => {
                setSearchSteps(prev => [...prev, step]);
                if (idx === steps.length - 1) setIsSearching(false);
            }, idx * 400);
        });
    };

    // T-SQL Index Types
    const tsqlIndexTypes = [
        {
            id: 'clustered',
            title: 'Clustered Index',
            icon: '🎉',
            description: 'Physically sorts and stores data rows. ONE per table. The table IS the index.',
            syntax: `-- Create clustered index (usually on PK)
CREATE CLUSTERED INDEX IX_Parts_PartID
ON dbo.Parts (Part_ID);

-- Or via Primary Key
ALTER TABLE dbo.Parts
ADD CONSTRAINT PK_Parts PRIMARY KEY CLUSTERED (Part_ID);`,
            pros: ['Fast range queries', 'No extra storage', 'Data physically sorted'],
            cons: ['Only ONE per table', 'Insert/Update can cause page splits', 'Wide keys = slower'],
            useCase: 'Primary key, frequently used in ORDER BY, range scans (dates)'
        },
        {
            id: 'nonclustered',
            title: 'Non-Clustered Index',
            icon: '📑',
            description: 'Separate structure pointing to data rows. Multiple allowed. Like an index in a book.',
            syntax: `-- Basic non-clustered index
CREATE NONCLUSTERED INDEX IX_Parts_Category
ON dbo.Parts (Category);

-- Composite index (multiple columns)
CREATE NONCLUSTERED INDEX IX_Parts_Cat_Date
ON dbo.Parts (Category, Created_Date DESC);`,
            pros: ['Multiple per table (up to 999)', 'Flexible - any column(s)', 'Can include columns'],
            cons: ['Extra storage', 'Key lookup overhead', 'Maintenance cost on writes'],
            useCase: 'WHERE clause columns, JOIN columns, frequently filtered columns'
        },
        {
            id: 'covering',
            title: 'Covering Index (INCLUDE)',
            icon: '📉',
            description: 'Non-clustered index that INCLUDES all columns needed. Eliminates key lookups!',
            syntax: `-- Covering index with INCLUDE
CREATE NONCLUSTERED INDEX IX_Parts_Covering
ON dbo.Parts (Category, Plant_Code)
INCLUDE (Part_Name, Unit_Price, Quantity);

-- Query that benefits:
SELECT Part_Name, Unit_Price, Quantity
WHERE Category = 'Engine' AND Plant_Code = 'VPI';
-- All columns in index = NO KEY LOOKUP!`,
            pros: ['Eliminates key lookups', 'Fastest read performance', 'Index-only scan'],
            cons: ['Larger index size', 'More maintenance', 'Include cols not in sort'],
            useCase: 'High-frequency queries with specific column patterns'
        },
        {
            id: 'filtered',
            title: 'Filtered Index',
            icon: '🔍',
            description: 'Index with WHERE clause. Smaller, faster, cheaper for subset of data.',
            syntax: `-- Filtered index on active parts only
CREATE NONCLUSTERED INDEX IX_Parts_Active
ON dbo.Parts (Part_ID, Category)
WHERE Is_Active = 1;

-- Filtered index on recent data
CREATE NONCLUSTERED INDEX IX_Orders_Recent
ON dbo.Orders (Order_Date, Customer_ID)
WHERE Order_Date >= '2024-01-01';`,
            pros: ['Smaller index', 'Faster maintenance', 'Less storage'],
            cons: ['Only for queries matching filter', 'Can cause plan issues'],
            useCase: 'Queries that always filter on same condition (active records, recent dates)'
        },
        {
            id: 'columnstore',
            title: 'Columnstore Index',
            icon: '📊',
            description: 'Column-oriented storage. MASSIVE compression. Best for analytics/reporting.',
            syntax: `-- Clustered columnstore (entire table)
CREATE CLUSTERED COLUMNSTORE INDEX CCI_Sales
ON dbo.Fact_Sales;

-- Non-clustered columnstore (hybrid)
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Sales
ON dbo.Fact_Sales (Order_Date, Product_ID, Amount);`,
            pros: ['10x compression', 'Batch mode processing', 'Perfect for aggregations'],
            cons: ['Slower single-row lookups', 'Update performance impact', 'Memory intensive'],
            useCase: 'Data warehouse fact tables, analytics, reporting queries with SUM/AVG/COUNT'
        }
    ];

    // Snowflake "Indexing" (actually optimization strategies)
    const snowflakeStrategies = [
        {
            id: 'clustering',
            title: 'Clustering Keys',
            icon: '🎉',
            description: 'Snowflake\'s alternative to indexes. Co-locates related data in micro-partitions.',
            syntax: `-- Add clustering key
ALTER TABLE marts.fct_sales
CLUSTER BY (order_date, region);

-- Check clustering depth (lower = better)
SELECT SYSTEM$CLUSTERING_INFORMATION(
  'marts.fct_sales', '(order_date, region)'
);

-- Monitor automatic reclustering
SELECT * FROM TABLE(INFORMATION_SCHEMA.AUTOMATIC_CLUSTERING_HISTORY(
  DATE_RANGE_START => DATEADD('day', -7, CURRENT_DATE())
));`,
            impact: 'Can reduce scan by 90%+',
            bestFor: 'Large tables (1TB+) with consistent filter patterns'
        },
        {
            id: 'search_optimization',
            title: 'Search Optimization Service',
            icon: '🔎',
            description: 'Serverless feature for point lookups. Like a hash index. Great for selective queries.',
            syntax: `-- Enable search optimization
ALTER TABLE dim_customer
ADD SEARCH OPTIMIZATION;

-- Enable for specific columns
ALTER TABLE dim_customer ADD SEARCH OPTIMIZATION
ON EQUALITY(customer_id, email);

-- Check status
SHOW TABLES LIKE 'dim_customer';
-- Look for SEARCH_OPTIMIZATION = ON`,
            impact: 'Dramatically faster point lookups',
            bestFor: 'Equality predicates (=), high-cardinality columns, VARIANT/OBJECT types'
        },
        {
            id: 'materialized_views',
            title: 'Materialized Views',
            icon: '📑',
            description: 'Pre-computed results. Like a covering index for complex aggregations.',
            syntax: `-- Create materialized view
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
  order_date,
  region,
  SUM(amount) AS total_amount,
  COUNT(*) AS order_count
GROUP BY order_date, region;

-- Query automatically uses MV
SELECT * FROM fct_sales  -- Snowflake may use MV!
WHERE order_date = '2024-01-15';`,
            impact: 'Pre-aggregated = instant results',
            bestFor: 'Repeated aggregation patterns, dashboard queries'
        },
        {
            id: 'query_acceleration',
            title: 'Query Acceleration Service',
            icon: '⚡',
            description: 'Serverless compute for ad-hoc analytical queries. Offloads scanning work.',
            syntax: `-- Enable at warehouse level
ALTER WAREHOUSE analytics_wh SET
  ENABLE_QUERY_ACCELERATION = TRUE
  QUERY_ACCELERATION_MAX_SCALE_FACTOR = 8;

-- Check if query was accelerated
SELECT query_id, 
       query_acceleration_bytes_scanned,
       query_acceleration_partitions_scanned
WHERE query_acceleration_bytes_scanned > 0;`,
            impact: 'Faster ad-hoc queries',
            bestFor: 'Large scans, unpredictable workloads, BI tool queries'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
            blue: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
            orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
            cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
            purple: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
        };
        return colors[color] || colors.green;
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
                        ← Back
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
                        📊
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Indexing Strategy Simulator
                        </h1>
                        <p className="text-xs text-slate-500">T-SQL Indexes • Snowflake Optimization</p>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
                <div className="flex gap-2 justify-center">
                    {[
                        { id: 'tsql', label: 'T-SQL Indexes', icon: '🗄️' },
                        { id: 'snowflake', label: 'Snowflake Optimization', icon: '❄️' },
                        { id: 'comparison', label: 'Side-by-Side', icon: '⚖️' },
                        { id: 'finops', label: 'FinOps Control Center', icon: '💰' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">

                {/* T-SQL TAB */}
                {activeTab === 'tsql' && (
                    <div className="h-full flex">
                        {/* Left: Interactive Demo */}
                        <div className="w-1/2 border-r border-slate-800 p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-white mb-4">🎮 Interactive B-Tree Search</h3>

                            {/* Index Type Selector */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {[
                                    { id: 'heap', label: 'Heap (No Index)', color: 'red' },
                                    { id: 'clustered', label: 'Clustered', color: 'green' },
                                    { id: 'nonclustered', label: 'Non-Clustered', color: 'blue' },
                                    { id: 'covering', label: 'Covering', color: 'purple' },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => { setIndexType(type.id as any); setSearchSteps([]); setSearchId(null); }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${indexType === type.id
                                            ? type.color === 'red' ? 'bg-red-600 text-white' :
                                                type.color === 'green' ? 'bg-green-600 text-white' :
                                                    type.color === 'blue' ? 'bg-blue-600 text-white' :
                                                        'bg-purple-600 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* B-Tree Visualization */}
                            {indexType !== 'heap' && (
                                <div className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase mb-3">B-Tree Structure</div>
                                    <div className="flex flex-col items-center gap-4">
                                        {/* Root */}
                                        <div className={`px-4 py-2 rounded-lg border-2 ${searchSteps.some(s => s.includes('ROOT')) ? 'border-green-500 bg-green-900/30' : 'border-slate-600 bg-slate-800'
                                            }`}>
                                            <span className="mono text-sm">[5 | 13]</span>
                                        </div>
                                        {/* Branches */}
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <span>↙</span><span>↓</span><span>↘</span>
                                        </div>
                                        {/* Leaves */}
                                        <div className="flex gap-4">
                                            {[
                                                { keys: '[1,2,3]', highlight: searchId !== null && searchId < 5 },
                                                { keys: '[5,8,9]', highlight: searchId !== null && searchId >= 5 && searchId < 13 },
                                                { keys: '[13,21]', highlight: searchId !== null && searchId >= 13 },
                                            ].map((leaf, idx) => (
                                                <div key={idx} className={`px-3 py-2 rounded-lg border-2 ${leaf.highlight && searchSteps.length > 2 ? 'border-green-500 bg-green-900/30' : 'border-slate-600 bg-slate-800'
                                                    }`}>
                                                    <span className="mono text-xs">{leaf.keys}</span>
                                                    {indexType === 'clustered' && (
                                                        <div className="text-[10px] text-slate-500 mt-1">+ Data</div>
                                                    )}
                                                    {indexType === 'nonclustered' && (
                                                        <div className="text-[10px] text-slate-500 mt-1">→ RID</div>
                                                    )}
                                                    {indexType === 'covering' && (
                                                        <div className="text-[10px] text-purple-400 mt-1">+ INCLUDE</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Heap Visualization */}
                            {indexType === 'heap' && (
                                <div className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase mb-3">Heap (Unsorted Data Pages)</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {sampleData.map((row, idx) => (
                                            <div key={row.id} className={`p-2 rounded border text-xs ${searchSteps.some(s => s.includes(`ID = ${row.id}`) && s.includes('FOUND'))
                                                ? 'border-green-500 bg-green-900/30'
                                                : searchSteps.some(s => s.includes(`ID = ${row.id}`))
                                                    ? 'border-yellow-500 bg-yellow-900/20'
                                                    : 'border-slate-700 bg-slate-800'
                                                }`}>
                                                <div className="text-slate-400">ID: {row.id}</div>
                                                <div className="text-white truncate">{row.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search Demo */}
                            <div className="bg-slate-800 rounded-xl p-4 mb-4">
                                <div className="text-xs text-slate-500 uppercase mb-3">Search for Part ID</div>
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 3, 5, 8, 13, 21, 99].map(id => (
                                        <button
                                            key={id}
                                            onClick={() => simulateSearch(id)}
                                            disabled={isSearching}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-mono transition ${searchId === id ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            {id}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Steps */}
                            {searchSteps.length > 0 && (
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase mb-3">Execution Steps</div>
                                    <div className="space-y-1 mono text-xs">
                                        {searchSteps.map((step, idx) => (
                                            <div key={idx} className={`py-1 animate-slide ${step.includes('✅') ? 'text-green-400' :
                                                step.includes('❌') ? 'text-red-400' :
                                                    step.includes('Complexity') ? 'text-cyan-400 font-bold' :
                                                        'text-slate-400'
                                                }`}>
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Index Types Reference */}
                        <div className="w-1/2 p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-white mb-4">📚 T-SQL Index Types</h3>
                            <div className="space-y-4">
                                {tsqlIndexTypes.map(idx => (
                                    <div key={idx.id} className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                                        <div className="bg-slate-800 p-3 border-b border-slate-700 flex items-center gap-3">
                                            <span className="text-xl">{idx.icon}</span>
                                            <div>
                                                <h4 className="font-bold text-white">{idx.title}</h4>
                                                <p className="text-xs text-slate-400">{idx.description}</p>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="bg-slate-950 rounded-lg p-3 mb-3 overflow-x-auto">
                                                <pre className="text-[11px] mono text-slate-400 whitespace-pre-wrap">{idx.syntax}</pre>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <div>
                                                    <div className="text-[10px] font-bold text-green-400 mb-1">✅ Pros</div>
                                                    <ul className="text-[10px] text-slate-400 space-y-0.5">
                                                        {idx.pros.map((p, i) => <li key={i}>• {p}</li>)}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-red-400 mb-1">❌ Cons</div>
                                                    <ul className="text-[10px] text-slate-400 space-y-0.5">
                                                        {idx.cons.map((c, i) => <li key={i}>• {c}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-cyan-400">
                                                <span className="font-bold text-slate-500">USE CASE: </span>{idx.useCase}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SNOWFLAKE TAB - Enhanced with Interactive Clustering Visualization */}
                {activeTab === 'snowflake' && (
                    <SnowflakeClusteringViz />
                )}

                {/* COMPARISON TAB */}
                {activeTab === 'comparison' && (
                    <div className="h-full p-6 overflow-y-auto">
                        <div className="max-w-5xl mx-auto">
                            <h3 className="text-lg font-bold text-white mb-6 text-center">⚖️ T-SQL vs Snowflake: Index Strategy Comparison</h3>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-800">
                                        <th className="p-3 text-left text-slate-400">Concept</th>
                                        <th className="p-3 text-left text-blue-400">🗄️ T-SQL (SQL Server)</th>
                                        <th className="p-3 text-left text-cyan-400">❄️ Snowflake</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Primary Index</td>
                                        <td className="p-3 text-slate-300">Clustered Index (B-Tree)</td>
                                        <td className="p-3 text-slate-300">Clustering Key (not an index!)</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Secondary Index</td>
                                        <td className="p-3 text-slate-300">Non-Clustered Index</td>
                                        <td className="p-3 text-slate-300">Search Optimization Service</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Point Lookup</td>
                                        <td className="p-3 text-slate-300">Index Seek O(log n)</td>
                                        <td className="p-3 text-slate-300">Search Optimization or Pruning</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Range Scan</td>
                                        <td className="p-3 text-slate-300">Index Range Scan</td>
                                        <td className="p-3 text-slate-300">Partition Pruning via Zone Maps</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Analytics/Agg</td>
                                        <td className="p-3 text-slate-300">Columnstore Index</td>
                                        <td className="p-3 text-slate-300">Native columnar (always!)</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Pre-computed</td>
                                        <td className="p-3 text-slate-300">Indexed View</td>
                                        <td className="p-3 text-slate-300">Materialized View</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Maintenance</td>
                                        <td className="p-3 text-slate-300">REBUILD / REORGANIZE</td>
                                        <td className="p-3 text-slate-300">Automatic Reclustering</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-semibold text-white">Statistics</td>
                                        <td className="p-3 text-slate-300">UPDATE STATISTICS</td>
                                        <td className="p-3 text-slate-300">Automatic (Cloud Services)</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Interview Tips */}
                            <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                                <h4 className="text-green-400 font-bold mb-3">🎉 Interview Tips</h4>
                                <ul className="text-sm text-slate-300 space-y-2">
                                    <li>• <strong>T-SQL:</strong> Know when to use Clustered vs Non-Clustered. Covering indexes eliminate Key Lookups.</li>
                                    <li>• <strong>Snowflake:</strong> Emphasize "no traditional indexes" - it's columnar storage with micro-partitions.</li>
                                    <li>• <strong>Key difference:</strong> T-SQL = you create indexes. Snowflake = you guide the optimizer with clustering keys.</li>
                                    <li>• <strong>Migration tip:</strong> T-SQL columnstore → Snowflake is natural fit. Regular indexes don't migrate.</li>
                                    <li>• <strong>Your VPI context:</strong> Mention Dynamic Tables + Clustering for your near real-time reporting solution!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* FINOPS CONTROL CENTER TAB */}
                {activeTab === 'finops' && (
                    <FinOpsControlCenter />
                )}
            </div>
        </div>
    );
};

export default IndexingSimulator;
