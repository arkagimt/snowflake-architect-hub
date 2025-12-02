import re

# Read the current file
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/QueryProfileVisualizer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the tab list section and clean it
# Remove any reference to rangejoin tab
content = re.sub(
    r"\{ id: 'rangejoin'.*?\},\s*",
    '',
    content,
    flags=re.DOTALL
)

# Find and remove ALL content between Tab 1 closing and Tab 3 opening (the remnant Range Join code)
# This is between ")}\n" after Spilling tab and before "{/* Tab 3: Pruning */}"
pattern = r"(\s+\)}\s+)\n+(.*?)\n+(\s+\{/\* Tab 3: Pruning \*/\})"
content = re.sub(pattern, r'\1\n\n                {/* Tab 2: Caching Layers */}', content, flags=re.DOTALL)

# Rename Tab 4 → Tab 2, Tab 3 stays Tab 3
content = content.replace('{/* Tab 4: Caching Layers */', '{/* Tab 2: Caching Layers */')
content = content.replace('{/* Tab 3: Pruning */', '{/* Tab 3: Pruning */')

# Write back
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/QueryProfileVisualizer.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("✅ Complete refactor done!")
print("   - Tab 1: Spilling")
print("   - Tab 2: Caching Layers")
print("   - Tab 3: Pruning")
