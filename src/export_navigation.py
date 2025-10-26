"""
Export navigation graph data to JSON for frontend visualization
"""

from pathfinder import IndoorPathfinder
import os

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

pf = IndoorPathfinder(
    os.path.join(base_path, 'data/floor-plans/basement-path-defined.DXF'),
    os.path.join(base_path, 'data/floor-plans/scott-lab-basement.jpg'),
    os.path.join(base_path, 'data/point_labels.csv')
)

print("Loading navigation data...")
pf.load_data()

print("\nExporting to JSON...")
pf.export_navigation_data('basement_navigation.json')

print("\nDone!")
