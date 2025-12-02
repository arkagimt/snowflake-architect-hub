import re

# Read the file
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/QueryProfileVisualizer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Range Join useEffect (lines 148-172)
pattern1 = r"    // Range Join Animation\r?\n    useEffect\(\(\) => \{.*?\}, \[isRunning, activeTab, isOptimized\]\);\r?\n\r?\n"
content = re.sub(pattern1, '', content, flags=re.DOTALL)

# Remove Range Join tab button from tabs list
pattern2 = r"\{ id: 'rangejoin' as TabType, label: 'Range Join / ASOF', icon: <Zap size=\{14\} /> \},\r?\n\s*"
content = re.sub(pattern2, '', content)

# Find and remove the entire Range Join tab content (Tab 2)
# It starts with {/* Tab 2: Range Join */} and ends before {/* Tab 3: Pruning */}
pattern3 = r"\{/\* Tab 2: Range Join \*/\}.*?\{/\* Tab 3: Pruning \*/\}"
content = re.sub(pattern3, r'{/* Tab 3: Pruning */', content, flags=re.DOTALL)

# Write back
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/QueryProfileVisualizer.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("✅ Range Join removed successfully! Caching is now Tab 2.") 
