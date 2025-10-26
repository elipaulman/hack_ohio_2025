"""
Flask backend server for Indoor Navigator
Serves frontend and provides pathfinding API
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys
import json

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from pathfinding import run_pathfinding
from multi_floor_pathfinder import find_multi_floor_path

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'frontend', 'public')

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')
CORS(app)

DATA_DIR = os.path.join(BASE_DIR, 'output')


@app.route('/')
def index():
    """Serve the main index.html"""
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/api/pathfinding')
def get_pathfinding():
    """
    Calculate pathfinding between two points (single or multi-floor)
    Query params: 
      - start_floor: starting floor name (basement, floor_1, floor_2)
      - start: room ID (e.g. E100) OR
      - start_x, start_y: pixel coordinates to find nearest node
      - end_floor: destination floor name
      - end: destination room ID
      
    For backward compatibility, 'floor' param applies to both start and end if start_floor/end_floor not specified
    """
    try:
        # Get floor parameters (support both old and new API)
        floor = request.args.get('floor', 'basement').lower()
        start_floor = request.args.get('start_floor', floor).lower()
        end_floor = request.args.get('end_floor', floor).lower()
        end = request.args.get('end', '').upper()
        
        # Check if we have pixel coordinates for start position
        start_x = request.args.get('start_x')
        start_y = request.args.get('start_y')
        start_room = request.args.get('start', '').upper()

        print(f"\n[DEBUG] Pathfinding request:")
        print(f"  Start floor: {start_floor}")
        print(f"  End floor: {end_floor}")
        print(f"  Start coords: ({start_x}, {start_y})")
        print(f"  Start room: {start_room}")
        print(f"  End room: {end}")

        if not end:
            return jsonify({'error': 'Destination room (end) must be specified'}), 400

        # Determine start point
        if start_x and start_y:
            # User clicked on map - find nearest node
            try:
                start_x = float(start_x)
                start_y = float(start_y)
                print(f"[DEBUG] Finding nearest node to pixel ({start_x}, {start_y})")
                
                # Load navigation data to find closest node
                nav_file = os.path.join(DATA_DIR, f'{start_floor}_navigation.json')
                if os.path.exists(nav_file):
                    with open(nav_file, 'r') as f:
                        nav_data = json.load(f)
                    
                    # Find closest node to clicked position
                    min_distance = float('inf')
                    closest_room = None
                    
                    for room_id, nodes in nav_data.get('rooms', {}).items():
                        for node in nodes:
                            # Use pixel coordinates from the node
                            if 'pixel_coords' in node:
                                px = node['pixel_coords']['x']
                                py = node['pixel_coords']['y']
                                distance = ((px - start_x)**2 + (py - start_y)**2)**0.5
                                
                                if distance < min_distance:
                                    min_distance = distance
                                    closest_room = room_id
                    
                    if closest_room:
                        start_room = closest_room
                        print(f"[DEBUG] Closest node found: {start_room} (distance: {min_distance:.2f} pixels)")
                    else:
                        print("[DEBUG] No closest node found, trying pathfinding anyway")
                        
            except (ValueError, TypeError) as e:
                print(f"[DEBUG] Error processing coordinates: {e}")
                return jsonify({'error': 'Invalid start coordinates'}), 400
        
        if not start_room:
            return jsonify({'error': 'Start position must be specified (room ID or coordinates)'}), 400

        # Check if this is multi-floor pathfinding
        if start_floor != end_floor:
            # Get ADA compliance setting
            ada_compliance = request.args.get('ada_compliance', 'false').lower() == 'true'
            mode_text = "elevator" if ada_compliance else "stairs"
            
            print(f"[DEBUG] Multi-floor pathfinding: {start_floor}/{start_room} -> {end_floor}/{end}")
            print(f"[DEBUG] Mode: {mode_text.upper()}")
            
            result = find_multi_floor_path(start_floor, start_room, end_floor, end, ada_compliance)
            
            if result is None:
                print(f"[DEBUG] No path found between floors")
                return jsonify({'error': f'No {mode_text} path found from {start_floor}/{start_room} to {end_floor}/{end}'}), 404
            
            print(f"[DEBUG] Multi-floor path found! {len(result.get('waypoints', []))} total waypoints")
            return jsonify(result)
        else:
            # Single floor pathfinding
            print(f"[DEBUG] Single floor pathfinding: {start_room} -> {end}")
            
            # Run pathfinding (skip image generation for speed)
            result = run_pathfinding(start_floor, start_room, end, export_json=False, generate_image=False)

            if result is None:
                print(f"[DEBUG] No path found between {start_room} and {end}")
                return jsonify({'error': f'No path found between {start_room} and {end}'}), 404

            print(f"[DEBUG] Path found! {len(result.get('waypoints', []))} waypoints")
            return jsonify(result)

    except ValueError as e:
        print(f"[DEBUG] ValueError: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"[DEBUG] Exception in pathfinding: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Pathfinding error: {str(e)}'}), 500


@app.route('/api/find-closest-node')
def find_closest_node():
    """
    Find the closest node to given pixel coordinates
    Query params: floor, x, y
    Returns: room_id, distance, pixel coordinates
    """
    try:
        floor = request.args.get('floor', 'floor_1').lower()
        x = float(request.args.get('x', 0))
        y = float(request.args.get('y', 0))
        
        print(f"\n[DEBUG] Finding closest node:")
        print(f"  Floor: {floor}")
        print(f"  Clicked at: ({x}, {y})")
        
        # Load navigation data
        nav_file = os.path.join(DATA_DIR, f'{floor}_navigation.json')
        if not os.path.exists(nav_file):
            return jsonify({'error': f'Navigation data not found for floor: {floor}'}), 404
        
        with open(nav_file, 'r') as f:
            nav_data = json.load(f)
        
        # Get calibration data to convert DXF to pixels
        # Standard scale: 25.4 pixels per DXF unit (based on Scott Lab floor plans)
        PIXELS_PER_UNIT = 25.4
        
        # Find closest node to clicked position
        min_distance = float('inf')
        closest_room = None
        closest_pixel_x = None
        closest_pixel_y = None
        
        for room_id, nodes in nav_data.get('rooms', {}).items():
            for node in nodes:
                # Convert DXF coordinates to pixels
                dxf_x = node.get('x', 0)
                dxf_y = node.get('y', 0)
                px = dxf_x * PIXELS_PER_UNIT
                py = dxf_y * PIXELS_PER_UNIT
                
                distance = ((px - x)**2 + (py - y)**2)**0.5
                
                if distance < min_distance:
                    min_distance = distance
                    closest_room = room_id
                    closest_pixel_x = px
                    closest_pixel_y = py
        
        if closest_room:
            print(f"[DEBUG] Closest node found: {closest_room}")
            print(f"[DEBUG]    Distance: {min_distance:.2f} pixels")
            print(f"[DEBUG]    Node coords: ({closest_pixel_x:.2f}, {closest_pixel_y:.2f})")
            
            return jsonify({
                'room_id': closest_room,
                'distance': round(min_distance, 2),
                'pixel_x': closest_pixel_x,
                'pixel_y': closest_pixel_y
            })
        else:
            print("[DEBUG] No nodes found")
            return jsonify({'error': 'No nodes found'}), 404
            
    except Exception as e:
        print(f"[DEBUG] Exception finding closest node: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/navigation/<floor>')
def get_navigation_data(floor):
    """
    Get navigation data (rooms, nodes, edges) for a specific floor
    """
    try:
        floor = floor.lower()
        json_file = os.path.join(DATA_DIR, f'{floor}_navigation.json')

        if not os.path.exists(json_file):
            return jsonify({'error': f'Navigation data not found for floor: {floor}'}), 404

        with open(json_file, 'r') as f:
            data = json.load(f)

        return jsonify(data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/available-floors')
def get_available_floors():
    """
    Get list of available floors
    """
    try:
        floors = []
        for floor in ['basement', 'floor_1', 'floor_2']:
            json_file = os.path.join(DATA_DIR, f'{floor}_navigation.json')
            if os.path.exists(json_file):
                floors.append(floor)

        return jsonify({'floors': floors})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/output/<path:filename>')
def serve_output(filename):
    """Serve files from output directory (for navigation JSON)"""
    return send_from_directory(DATA_DIR, filename)


@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/api/routes')
def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify({'routes': routes})


@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from public directory (catch-all, must be last)"""
    file_path = os.path.join(STATIC_DIR, filename)
    if os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, filename)
    # If file not found, return 404
    return jsonify({'error': 'Not found'}), 404


if __name__ == '__main__':
    print("\n" + "="*70)
    print("INDOOR NAVIGATOR - BACKEND SERVER")
    print("="*70)
    print("\nServer starting on http://localhost:5000")
    print("\nAvailable Endpoints:")
    print("  GET  /                         -> Frontend app")
    print("  GET  /api/pathfinding          -> Calculate route (params: floor, start, end)")
    print("  GET  /api/navigation/<floor>   -> Get floor navigation data")
    print("  GET  /api/available-floors     -> List available floors")
    print("  GET  /health                   -> Health check")
    print("\nExample Requests:")
    print("  http://localhost:5000/api/pathfinding?floor=floor_1&start=E100&end=W170")
    print("  http://localhost:5000/api/navigation/floor_1")
    print("  http://localhost:5000/api/available-floors")
    print("\n" + "="*70 + "\n")

    app.run(debug=True, port=5000, host='0.0.0.0')
