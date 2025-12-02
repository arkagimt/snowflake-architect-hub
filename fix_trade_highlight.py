import re

# Read file
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/TimeSeriesSimulator.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match the Trade Stream rendering
old_pattern = r'''className=\{`p-3 rounded-lg border-2 transition-all \$\{idx === currentTradeIndex
                                                        \? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/30'
                                                        : 'bg-slate-800/50 border-slate-700'
                                                    \}`\}
                                            >
                                                <div className="text-xs text-slate-400">T\{trade\.id\}</div>
                                                <div className="text-sm font-mono text-white font-bold">\{trade\.timestamp\}</div>
                                                <div className="text-xs text-slate-300">\$\{trade\.price\}</div>'''

# New enhanced code
new_code = '''className={`p-3 rounded-lg border-2 transition-all relative ${
                                                    idx === currentTradeIndex
                                                        ? 'bg-orange-500/30 border-orange-400'
                                                        : 'bg-slate-800/50 border-slate-700'
                                                    }`}
                                                style={idx === currentTradeIndex ? {
                                                    boxShadow: '0 0 30px rgba(251, 146, 60, 0.7), 0 0 60px rgba(251, 146, 60, 0.4)',
                                                    borderWidth: '3px'
                                                } : {}}
                                            >
                                                {/* Pulsing Glow Background */}
                                                {idx === currentTradeIndex && (
                                                    <motion.div
                                                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                        className="absolute -inset-1 bg-orange-500/20 rounded-lg -z-10 blur-sm"
                                                    />
                                                )}
                                                <div className="text-xs text-slate-400 flex items-center justify-between">
                                                    <span>T{trade.id}</span>
                                                    {idx === currentTradeIndex && (
                                                        <motion.span 
                                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                                            transition={{ repeat: Infinity, duration: 1 }}
                                                            className="text-orange-400 font-bold text-[9px] uppercase flex items-center gap-1"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                                            Processing
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <div className={`text-sm font-mono font-bold ${
                                                    idx === currentTradeIndex ? 'text-orange-300' : 'text-white'
                                                }`}>
                                                    {trade.timestamp}
                                                </div>
                                                <div className="text-xs text-slate-300">${trade.price}</div>'''

# Also update scale from 1.05 to 1.08
content = content.replace('scale: idx === currentTradeIndex ? 1.05 : 1', 'scale: idx === currentTradeIndex ? 1.08 : 1')

# Replace the old with new
content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

# Write back
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/TimeSeriesSimulator.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("✅ Enhanced Trade Stream highlighting applied!")
