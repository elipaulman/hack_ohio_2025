"""
View exported navigation JSON data
"""

import json
import os

output_file = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'output/basement_navigation.json'
)

with open(output_file, 'r') as f:
    data = json.load(f)

print("="*70)
print("NAVIGATION DATA STRUCTURE")
print("="*70)

print("\nMETADATA:")
print(f"  Total Nodes: {data['metadata']['total_nodes']}")
print(f"  Total Edges: {data['metadata']['total_edges']}")
print(f"  Total Rooms: {data['metadata']['total_rooms']}")

print("\nCALIBRATION:")
print(f"  Origin: {data['calibration']['origin']}")
print(f"  Reference: {data['calibration']['reference']}")

print("\nSAMPLE NODES (first 3):")
for node in data['nodes'][:3]:
    print(f"  {node}")

print("\nSAMPLE EDGES (first 3):")
for edge in data['edges'][:3]:
    print(f"  {edge}")

print("\nSAMPLE ROOMS (first 3):")
for i, (room_name, coords) in enumerate(list(data['rooms'].items())[:3]):
    print(f"  {room_name}: {coords}")

print("\n" + "="*70)
print("JSON file ready for frontend use at:")
print(f"  output/basement_navigation.json")
print("="*70)
