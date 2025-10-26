"""
Extract points from floor_1.DXF and update floor_1_labels.csv
"""
import csv

# Read DXF file and extract points
with open('data/floor-plans/floor_1.DXF', 'r') as f:
    lines = [line.strip() for line in f.readlines()]

ENTITY_TYPES = ['POINT', 'LINE', 'CIRCLE', 'ARC', 'POLYLINE', 'LWPOLYLINE', 'MTEXT', 'TEXT', 'INSERT', 'BLOCK', 'ENDBLK', 'ENDSEC', 'EOF']

points = []
i = 0
while i < len(lines):
    if lines[i] == '0' and i + 1 < len(lines) and lines[i + 1] == 'POINT':
        x, y = None, None
        j = i + 2
        while j < len(lines) - 1:
            if lines[j] == '0' and j + 1 < len(lines) and lines[j + 1] in ENTITY_TYPES:
                break
            if lines[j] == '10':
                x = float(lines[j + 1])
            elif lines[j] == '20':
                y = float(lines[j + 1])
            j += 1
        
        if x is not None and y is not None:
            points.append((x, y))
    i += 1

print(f'Extracted {len(points)} points from floor_1.DXF')

# Read existing labels to preserve room names and notes
with open('data/floor_1_labels.csv', 'r') as f:
    reader = csv.DictReader(f)
    old_labels = list(reader)

print(f'Existing CSV has {len(old_labels)} entries')

# Create updated CSV with new coordinates but keeping existing labels
new_rows = []

# Use the smaller count to avoid index errors
num_entries = min(len(points), len(old_labels))

for idx in range(num_entries):
    x, y = points[idx]
    old_entry = old_labels[idx]
    
    new_rows.append({
        'point_id': idx,
        'x': f'{x:.6f}',
        'y': f'{y:.6f}',
        'room_name': old_entry['room_name'],
        'notes': old_entry['notes']
    })

# Handle extra points from DXF if any
if len(points) > len(old_labels):
    for idx in range(len(old_labels), len(points)):
        x, y = points[idx]
        # Check if these are calibration points (last two)
        if idx == len(points) - 2:
            room_name = 'ori'
            notes = 'Origin calibration point'
        elif idx == len(points) - 1:
            room_name = 'ori-tr'
            notes = 'Reference calibration point'
        else:
            room_name = f'NEW_POINT_{idx}'
            notes = 'Needs label'
        
        new_rows.append({
            'point_id': idx,
            'x': f'{x:.6f}',
            'y': f'{y:.6f}',
            'room_name': room_name,
            'notes': notes
        })

# Write updated CSV
with open('data/floor_1_labels.csv', 'w', newline='') as f:
    fieldnames = ['point_id', 'x', 'y', 'room_name', 'notes']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(new_rows)

print(f'Updated floor_1_labels.csv with {len(new_rows)} points')

if len(points) > len(old_labels):
    print(f'\nWARNING: {len(points) - len(old_labels)} new points found that need labels!')
    print(f'Points {len(old_labels)} to {len(points)-1} need room names and descriptions.')
elif len(old_labels) > len(points):
    print(f'\nWARNING: CSV had {len(old_labels) - len(points)} more entries than DXF points!')

