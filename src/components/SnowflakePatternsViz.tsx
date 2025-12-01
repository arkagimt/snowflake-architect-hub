import React from 'react';

const SnowflakePatternsViz = () => {
    const patterns = [
        {
            title: 'Dynamic Tables',
            icon: '⚡',
            description: 'Auto-refreshing materialized views. Solved your VPI data availability issue!',
            code: `CREATE DYNAMIC TABLE marts.fct_inventory
  TARGET_LAG = '10 minutes'
  WAREHOUSE = ETL_WH
AS SELECT * FROM int_inventory;`,
            pros: ['No scheduling', 'Auto dependency', 'Incremental'],
            useCase: 'Near real-time reporting'
        },
        {
            title: 'Streams + Tasks',
            icon: '🌊',
            description: 'CDC pattern. Track changes and process incrementally.',
            code: `CREATE STREAM stg_stream ON TABLE stg_data;
CREATE TASK process_changes
  SCHEDULE = '5 MINUTE'
  WHEN SYSTEM$STREAM_HAS_DATA('stg_stream')
AS MERGE INTO target ...;`,
            pros: ['Fine control', 'CDC built-in', 'Custom logic'],
            useCase: 'SCD Type 2, complex transforms'
        },
        {
            title: 'Zero-Copy Clone',
            icon: '📋',
            description: 'Instant copies without storage cost. Perfect for dev/test.',
            code: `CREATE DATABASE dev_db CLONE prod_db;
CREATE TABLE backup CLONE source 
  AT(TIMESTAMP => '2024-01-15'::TIMESTAMP);`,
            pros: ['Instant', 'No storage cost', 'Time Travel'],
            useCase: 'Testing, backups, CI/CD'
        },
        {
            title: 'Transient Tables',
            icon: '⏳',
            description: 'No Fail-safe period. Lower storage cost for staging data.',
            code: `CREATE TRANSIENT TABLE stg_temp (
  id INT,
  data VARIANT
);
-- 1-day Time Travel only, no Fail-safe`,
            pros: ['Lower cost', 'Good for ETL', 'Fast cleanup'],
            useCase: 'Staging, temp tables'
        }
    ];

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-6">❄️ Snowflake-Specific Patterns</h3>

                <div className="grid grid-cols-2 gap-6">
                    {patterns.map((p, idx) => (
                        <div key={idx} className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="bg-cyan-900/30 p-4 border-b border-slate-700 flex items-center gap-3">
                                <span className="text-2xl">{p.icon}</span>
                                <div>
                                    <h4 className="font-bold text-white">{p.title}</h4>
                                    <p className="text-xs text-slate-400">{p.description}</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="bg-slate-950 rounded-lg p-3 mb-3 overflow-x-auto">
                                    <pre className="text-[11px] mono text-slate-400 whitespace-pre">{p.code}</pre>
                                </div>
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {p.pros.map((pro, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-400 rounded">
                                            ✓ {pro}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-500">
                                    <span className="text-cyan-400">Best for:</span> {p.useCase}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SnowflakePatternsViz;
