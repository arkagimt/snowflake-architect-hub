import re

# Read the file
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/QueryProfileVisualizer.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and remove all rangejoin tab content
output_lines = []
skip_section = False
tab2_found = False

for i, line in enumerate(lines):
    # Check for Tab 2 Range Join start
    if r'{/* Tab 2: Range' in line or  '{/* Tab 2: Range' in line:
        skip_section = True
        tab2_found = True
        continue
    
    # Check for Tab 3 or Tab 4 start (end of Range Join section)
    if skip_section and ('{/* Tab 3:' in line or '{/* Tab 4:' in line):
        skip_section = False
        # Rename this to Tab 2 if it's caching
        if 'Caching' in line:
            output_lines.append(line.replace('Tab 4', 'Tab 2').replace('Tab 3', 'Tab 2'))
            continue
    
    # Check for individual rangejoin conditional blocks
    if "activeTab === 'rangejoin'" in line:
        # Find the matching closing ) - skip this entire block
        skip_section = True
        continue
    
    # When we find a closing for activeTab conditional
    if skip_section and ')}\n' in line and lines[i-1].strip().startswith('</div>'):
        skip_section = False
        continue
    
    if not skip_section:
        output_lines.append(line)

# Write back
with open(r'c:/Users/arkag/Downloads/vitejs-vite-qjakl7hc/src/components/QueryProfileVisualizer.tsx', 'w', encoding='utf-8', newline='') as f:
    f.writelines(output_lines)

print(f"✅ Removed Range Join! Tab 2 {'found and removed' if tab2_found else 'not found'}.")
print(f"Total lines: {len(lines)} → {len(output_lines)}")
