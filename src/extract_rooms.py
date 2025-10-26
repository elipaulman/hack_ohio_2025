"""
Extract Room Coordinates from DXF Floor Plans
Generates CSV template for manual room labeling

Usage: python extract_rooms.py <floor_name>
Example: python extract_rooms.py floor_3
"""

import ezdxf
import csv
import os
import sys


def analyze_dxf_structure(dxf_file):
    """Analyze DXF file structure"""
    print(f"\n[ANALYSIS] Scanning {os.path.basename(dxf_file)}...")
    
    doc = ezdxf.readfile(dxf_file)
    msp = doc.modelspace()
    
    entity_types = {}
    for entity in msp:
        entity_type = entity.dxftype()
        entity_types[entity_type] = entity_types.get(entity_type, 0) + 1
    
    print(f"\n[ENTITIES FOUND]")
    for entity_type in sorted(entity_types.keys()):
        count = entity_types[entity_type]
        print(f"  {entity_type}: {count}")


def extract_point_entities(dxf_file, output_csv):
    """Extract POINT entities from DXF and save to CSV"""
    print(f"\n[EXTRACTION] Loading POINT entities...")
    
    doc = ezdxf.readfile(dxf_file)
    msp = doc.modelspace()
    
    point_entities = []
    point_id = 0
    
    for entity in msp:
        if entity.dxftype() == 'POINT':
            try:
                x = entity.dxf.location.x
                y = entity.dxf.location.y
                point_entities.append({
                    'point_id': point_id,
                    'x': x,
                    'y': y,
                    'room_name': f'ROOM_{point_id}',
                    'notes': f'Room {point_id} - needs labeling'
                })
                point_id += 1
            except Exception as e:
                print(f"  Warning: Could not extract point - {e}")
    
    # Save to CSV
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(base_path, 'data', output_csv)
    
    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['point_id', 'x', 'y', 'room_name', 'notes'])
        writer.writeheader()
        writer.writerows(point_entities)
    
    print(f"\n[OK] Extracted {len(point_entities)} POINT entities")
    print(f"     Saved to: {output_path}")
    print(f"\n[ACTION REQUIRED]")
    print(f"  1. Edit {output_csv} and replace:")
    print(f"     - ROOM_# with actual room names (e.g., E200, W259)")
    print(f"     - notes with room descriptions")
    print(f"  2. Add calibration points:")
    print(f"     - Last row: ori,0.0,0.0,ori,Origin")
    print(f"     - Last+1 row: ref,100.39,130.19,ori-tr,Reference")
    print(f"  3. Rename file: mv {output_csv} {output_csv.replace('_rooms.csv', '_labels.csv')}")
    print(f"  4. Update pathfinding.py configuration")


def main():
    """Command-line interface"""
    if len(sys.argv) < 2:
        print("\n" + "="*70)
        print("EXTRACT ROOM COORDINATES FROM DXF")
        print("="*70)
        print("\nUSAGE:")
        print("  python extract_rooms.py <floor_name>")
        print("\nEXAMPLES:")
        print("  python extract_rooms.py floor_3")
        print("  python extract_rooms.py floor_4")
        print("  python extract_rooms.py floor_5")
        print("\nOUTPUT:")
        print("  Creates: data/<floor_name>_rooms.csv")
        print("\nNEXT STEPS:")
        print("  1. Edit CSV file with real room names")
        print("  2. Rename to *_labels.csv")
        print("  3. Update pathfinding.py configuration")
        print("="*70 + "\n")
        sys.exit(1)
    
    floor_name = sys.argv[1].lower()
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dxf_path = os.path.join(base_path, f'data/floor-plans/{floor_name}.DXF')
    
    if not os.path.exists(dxf_path):
        print(f"\n[ERROR] DXF file not found: {dxf_path}")
        sys.exit(1)
    
    try:
        print("\n" + "="*70)
        print(f"EXTRACTING ROOMS FROM: {floor_name.upper()}")
        print("="*70)
        
        analyze_dxf_structure(dxf_path)
        extract_point_entities(dxf_path, f'{floor_name}_rooms.csv')
        
        print(f"\n{'='*70}")
        print("EXTRACTION COMPLETE")
        print(f"{'='*70}\n")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
