import React, { useState } from 'react';

const DBTLayersViz = () => {
    const [activeLayer, setActiveLayer] = useState<'staging' | 'intermediate' | 'marts'>('staging');

    const layers = {
        staging: {
            title: 'Staging Layer (stg_)',
            color: 'cyan',
            purpose: 'Raw data with light transformations. 1:1 with source tables.',
            naming: 'stg_<source>__<table>',
            example: 'stg_oracle__po_headers',
            code: `-- models/staging/stg_oracle__po_headers.sql
WITH source AS (
    SELECT * FROM {{ source('oracle', 'PO_HEADERS_ALL') }}
),
cleaned AS (
    SELECT
        po_header_id,
        segment1 AS po_number,
        vendor_id,
        CAST(creation_date AS DATE) AS created_date,
        authorization_status AS status
    FROM source
    WHERE NVL(cancel_flag, 'N') != 'Y'
)
SELECT * FROM cleaned`
        },
        intermediate: {
            title: 'Intermediate Layer (int_)',
            color: 'yellow',
            purpose: 'Business logic, joins, aggregations. Not exposed to end users.',
            naming: 'int_<entity>__<transformation>',
            example: 'int_po__with_lines',
            code: `-- models/intermediate/int_po__with_lines.sql
WITH po_headers AS (
    SELECT * FROM {{ ref('stg_oracle__po_headers') }}
),
po_lines AS (
    SELECT * FROM {{ ref('stg_oracle__po_lines') }}
),
joined AS (
    SELECT
        h.po_number,
        h.vendor_id,
        l.line_num,
        l.item_id,
        l.quantity,
        l.unit_price
    FROM po_headers h
    JOIN po_lines l ON h.po_header_id = l.po_header_id
)
SELECT * FROM joined`
        },
        marts: {
            title: 'Marts Layer (dim_, fct_)',
            color: 'green',
            purpose: 'Business-ready tables for BI tools. Dimensional modeling.',
            naming: 'dim_<entity> or fct_<process>',
            example: 'fct_purchase_orders',
            code: `-- models/marts/fct_purchase_orders.sql
WITH po_data AS (
    SELECT * FROM {{ ref('int_po__with_lines') }}
),
final AS (
    SELECT
        {{ dbt_utils.generate_surrogate_key(['po_number', 'line_num']) }} AS po_line_key,
        po_number,
        line_num,
        item_id,
        quantity,
        unit_price,
        quantity * unit_price AS line_amount
    FROM po_data
)
SELECT * FROM final`
        }
    };

    const current = layers[activeLayer];

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-6">🧱 DBT Project Structure</h3>

                <div className="flex gap-6">
                    {/* Layer Selector */}
                    <div className="w-64 space-y-2">
                        {Object.entries(layers).map(([key, layer]) => (
                            <button
                                key={key}
                                onClick={() => setActiveLayer(key as any)}
                                className={`w-full p-4 rounded-xl text-left transition ${activeLayer === key
                                    ? `bg-${layer.color}-500/20 border-2 border-${layer.color}-500`
                                    : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className={`font-bold ${activeLayer === key ? `text-${layer.color}-400` : 'text-white'}`}>
                                    {layer.title}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{layer.purpose.slice(0, 50)}...</div>
                            </button>
                        ))}

                        {/* DAG */}
                        <div className="mt-6 p-4 bg-slate-800 rounded-xl">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-3">DAG Flow</div>
                            <div className="flex flex-col items-center gap-2 text-xs">
                                <div className={`px-3 py-1 rounded mono ${activeLayer === 'staging' ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-700 text-slate-500'}`}>
                                    stg_*
                                </div>
                                <div className="text-slate-600">↓</div>
                                <div className={`px-3 py-1 rounded mono ${activeLayer === 'intermediate' ? 'bg-yellow-500/30 text-yellow-400' : 'bg-slate-700 text-slate-500'}`}>
                                    int_*
                                </div>
                                <div className="text-slate-600">↓</div>
                                <div className={`px-3 py-1 rounded mono ${activeLayer === 'marts' ? 'bg-green-500/30 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                                    dim_* / fct_*
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Display */}
                    <div className="flex-1">
                        <div className={`bg-${current.color}-900/20 border border-${current.color}-500/30 rounded-t-xl p-4`}>
                            <h4 className="font-bold text-white">{current.title}</h4>
                            <p className="text-sm text-slate-300 mt-1">{current.purpose}</p>
                            <div className="mt-2 flex gap-4 text-xs">
                                <div><span className="text-slate-500">Naming:</span> <span className="text-cyan-400 mono">{current.naming}</span></div>
                                <div><span className="text-slate-500">Example:</span> <span className="text-orange-400 mono">{current.example}</span></div>
                            </div>
                        </div>
                        <div className="bg-slate-950 rounded-b-xl p-4 overflow-x-auto">
                            <pre className="text-xs mono text-slate-400 whitespace-pre">{current.code}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DBTLayersViz;
