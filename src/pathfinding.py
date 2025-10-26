"""
Indoor Navigation Pathfinding - Main Entry Point
Unified interface for finding optimal routes between classrooms
Usage: python pathfinding.py <floor> [start_room] [end_room]
"""

from pathfinder import IndoorPathfinder
import os
import sys


class FloorNavigationConfig:
    """Configuration for all available floors"""
    FLOORS = {
        'basement': {
            'dxf': 'basement-path-defined.DXF',
            'image': 'scott-lab-basement.jpg',
            'labels': 'basement_labels.csv',
            'output_prefix': 'basement'
        },
        'floor_1': {
            'dxf': 'floor_1.DXF',
            'image': 'scott-lab-1st-floor.jpg',
            'labels': 'floor_1_labels.csv',
            'output_prefix': 'floor_1'
        },
        'floor_2': {
            'dxf': 'floor_2.DXF',
            'image': 'scott-lab-2nd-floor.jpg',
            'labels': 'floor_2_labels.csv',
            'output_prefix': 'floor_2'
        },
    }
    
    @classmethod
    def get_floor_config(cls, floor_name):
        """Get configuration for a floor"""
        floor = floor_name.lower()
        if floor not in cls.FLOORS:
            raise ValueError(f"Floor '{floor_name}' not configured. Available: {list(cls.FLOORS.keys())}")
        return cls.FLOORS[floor]
    
    @classmethod
    def get_available_floors(cls):
        """Get list of available floors"""
        return [f for f, cfg in cls.FLOORS.items() if cfg['dxf'] is not None and cfg['labels'] is not None]


def run_pathfinding(floor_name, start_room=None, end_room=None, export_json=True, generate_image=False):
    """
    Run pathfinding for a specific floor
    
    Args:
        floor_name (str): Floor name (basement, floor_1, floor_2, etc.)
        start_room (str): Starting room name
        end_room (str): Destination room name
        export_json (bool): Export navigation data to JSON
    """
    print("\n" + "="*70)
    print(f"INDOOR NAVIGATION - {floor_name.upper()}")
    print("="*70)
    
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config = FloorNavigationConfig.get_floor_config(floor_name)
    
    # Build full file paths
    dxf_file = os.path.join(base_path, 'data/floor-plans', config['dxf'])
    image_file = os.path.join(base_path, 'data/floor-plans', config['image'])
    labels_file = os.path.join(base_path, 'data', config['labels'])
    
    # Verify files exist
    if not os.path.exists(dxf_file):
        raise FileNotFoundError(f"DXF file not found: {dxf_file}")
    if not os.path.exists(labels_file):
        raise FileNotFoundError(f"Labels file not found: {labels_file}")
    if not os.path.exists(image_file):
        print(f"[WARNING] Image file not found: {image_file}")
        print(f"          Visualization will still work but without floor plan background")
    
    print(f"\n[CONFIG]")
    print(f"  DXF:    {os.path.basename(dxf_file)}")
    print(f"  Image:  {os.path.basename(image_file)}")
    print(f"  Labels: {os.path.basename(labels_file)}")
    
    # Initialize pathfinder
    pf = IndoorPathfinder(dxf_file, image_file, labels_file)
    pf.load_data()
    
    # Export navigation data to JSON
    if export_json:
        output_json = f'{config["output_prefix"]}_navigation.json'
        pf.export_navigation_data(output_json)
    
    # If rooms provided, find path
    if start_room and end_room:
        try:
            start_room = start_room.upper()
            end_room = end_room.upper()
            
            path, distance = pf.find_path(start_room, end_room)
            
            if path:
                # Only generate PNG if requested (slow, skip for API calls)
                if generate_image:
                    output_png = os.path.join(
                        base_path,
                        f'output/route_{config["output_prefix"]}_{start_room}_to_{end_room}.png'
                    )
                    pf.visualize_path(path, start_room, end_room, output_png)
                    output_file = os.path.basename(output_png)
                else:
                    output_file = 'N/A (image generation skipped for speed)'
                
                print(f"\n{'='*70}")
                print(f"NAVIGATION COMPLETE")
                print(f"{'='*70}")
                print(f"Floor:     {floor_name}")
                print(f"Route:     {start_room} -> {end_room}")
                print(f"Distance:  {distance:.2f} units")
                print(f"Waypoints: {len(path)}")
                print(f"Output:    {output_file}")
                print(f"{'='*70}\n")
                
                # Build path data to return to API
                waypoints = []
                for idx, node_id in enumerate(path):
                    x, y, label = pf.nodes[node_id]  # Nodes are tuples (x, y, label)
                    waypoints.append({
                        'index': idx,
                        'node_id': node_id,
                        'dxf_coords': {
                            'x': x,
                            'y': y
                        },
                        'pixel_coords': {
                            'x': x * 25.4,  # Convert DXF to pixels
                            'y': y * 25.4
                        },
                        'label': label
                    })
                
                path_data = {
                    'start_room': start_room,
                    'end_room': end_room,
                    'distance': distance,
                    'waypoints': waypoints
                }
                
                # Return the path data for API use
                return path_data
            else:
                print(f"\n[X] No path found between {start_room} and {end_room}")
                return None
        except ValueError as e:
            print(f"\n[X] Error: {e}")
            return None
    else:
        pf.print_available_rooms()
        return None


def main():
    """Command-line interface"""
    if len(sys.argv) < 2:
        print("\n" + "="*70)
        print("INDOOR NAVIGATION PATHFINDING")
        print("="*70)
        print("\nUSAGE:")
        print("  python pathfinding.py <floor> [start_room] [end_room]")
        print(f"\nAVAILABLE FLOORS: {', '.join(FloorNavigationConfig.get_available_floors())}")
        print("\nEXAMPLES:")
        print("  python pathfinding.py basement")
        print("  python pathfinding.py basement N048 E001")
        print("  python pathfinding.py floor_1")
        print("  python pathfinding.py floor_1 E100 W170")
        print("  python pathfinding.py floor_2 E200 N250")
        print("\nSEE: README.md for detailed documentation")
        print("="*70 + "\n")
        sys.exit(1)
    
    floor = sys.argv[1]
    start_room = sys.argv[2] if len(sys.argv) > 2 else None
    end_room = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        run_pathfinding(floor, start_room, end_room)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
