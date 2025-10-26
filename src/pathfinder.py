"""
Indoor Navigation Pathfinder - A* Algorithm ENHANCED
Improved graph with line endpoints + intermediate points on lines
"""

import ezdxf
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.image import imread
from collections import defaultdict
import heapq
import csv
import os


class IndoorPathfinder:
    """A* pathfinding with enhanced geometry"""
    
    def __init__(self, dxf_path, image_path, labels_csv):
        self.dxf_path = dxf_path
        self.image_path = image_path
        self.labels_csv = labels_csv
        
        self.nodes = {}
        self.graph = defaultdict(list)
        self.room_to_nodes = defaultdict(list)
        self.origin_point = None
        self.all_lines = []
    
    def load_data(self):
        """Load and process DXF data"""
        print("Loading navigation data...")
        self._load_dxf_lines()
        self._build_corridor_network_enhanced()
        self._add_door_points()
        self._build_graph_with_intermediate_nodes()
        self._connect_doors_to_corridors()
        
        labeled_rooms = len(self.room_to_nodes)
        total_nodes = len(self.nodes)
        labeled_count = sum(len(pts) for pts in self.room_to_nodes.values())
        pathway_nodes = total_nodes - labeled_count - (1 if self.origin_point else 0)
        
        print(f"[OK] Loaded {total_nodes} nodes ({labeled_rooms} rooms, {pathway_nodes} pathway nodes)")
        print(f"[OK] {sum(len(neighbors) for neighbors in self.graph.values()) // 2} connections")
    
    def _load_dxf_lines(self):
        """Load all LINE entities"""
        doc = ezdxf.readfile(self.dxf_path)
        msp = doc.modelspace()
        
        for entity in msp:
            if entity.dxftype() == 'LINE':
                start = np.array([entity.dxf.start.x, entity.dxf.start.y])
                end = np.array([entity.dxf.end.x, entity.dxf.end.y])
                self.all_lines.append((start, end))
        
        print(f"  * {len(self.all_lines)} corridor lines loaded")
    
    def _build_corridor_network_enhanced(self):
        """Build corridor network from line endpoints"""
        snap_tolerance = 0.05
        node_id = 0
        self.endpoint_to_node = {}
        
        for start_line, end_line in self.all_lines:
            for endpoint in [start_line, end_line]:
                found_node = None
                for existing_ep, existing_node_id in self.endpoint_to_node.items():
                    dist = np.linalg.norm(endpoint - existing_ep)
                    if dist <= snap_tolerance:
                        found_node = existing_node_id
                        break
                
                if found_node is not None:
                    self.endpoint_to_node[tuple(endpoint)] = found_node
                else:
                    self.nodes[node_id] = (endpoint[0], endpoint[1], None)
                    self.endpoint_to_node[tuple(endpoint)] = node_id
                    
                    if abs(endpoint[0]) < 0.01 and abs(endpoint[1]) < 0.01:
                        self.origin_point = tuple(endpoint)
                    
                    node_id += 1
        
        print(f"  * {len(self.nodes)} corridor nodes created")
    
    def _add_door_points(self):
        """Add room doors"""
        with open(self.labels_csv, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                x = float(row['x'])
                y = float(row['y'])
                label = row['room_name'].strip()
                
                node_id = len(self.nodes)
                self.nodes[node_id] = (x, y, label)
                
                if label and label != 'ori':
                    base_room = label.split('_')[0].upper()  # Store in uppercase for case-insensitive lookup
                    self.room_to_nodes[base_room].append(node_id)
                
                if abs(x) < 0.01 and abs(y) < 0.01:
                    self.origin_point = (x, y)
        
        print(f"  * {sum(len(nodes) for nodes in self.room_to_nodes.values())} door nodes added")
    
    def _point_to_line_distance(self, point, line_start, line_end):
        """Distance from point to line"""
        line_vec = line_end - line_start
        point_vec = point - line_start
        
        line_len = np.linalg.norm(line_vec)
        if line_len < 1e-10:
            return np.linalg.norm(point_vec)
        
        t = np.dot(point_vec, line_vec) / (line_len ** 2)
        t = max(0, min(1, t))
        
        proj = line_start + t * line_vec
        return np.linalg.norm(point - proj)
    
    def _build_graph_with_intermediate_nodes(self):
        """Build graph considering points on lines"""
        edges_added = 0
        
        for start_line, end_line in self.all_lines:
            start_node = self.endpoint_to_node.get(tuple(start_line))
            end_node = self.endpoint_to_node.get(tuple(end_line))
            
            if start_node is None or end_node is None or start_node == end_node:
                continue
            
            # Find all nodes on this line
            nodes_on_line = []
            for node_id, (nx, ny, _) in self.nodes.items():
                point = np.array([nx, ny])
                dist_to_line = self._point_to_line_distance(point, start_line, end_line)
                
                if dist_to_line < 0.5:  # Point is near line
                    # Calculate position along line
                    line_vec = end_line - start_line
                    point_vec = point - start_line
                    line_len_sq = np.dot(line_vec, line_vec)
                    
                    if line_len_sq > 0:
                        t = np.dot(point_vec, line_vec) / line_len_sq
                        if -0.05 < t < 1.05:
                            nodes_on_line.append((node_id, t))
            
            # Sort by position along line
            nodes_on_line.sort(key=lambda x: x[1])
            
            # Connect in sequence
            all_nodes = [start_node] + [n[0] for n in nodes_on_line if n[0] != start_node and n[0] != end_node] + [end_node]
            all_nodes = list(dict.fromkeys(all_nodes))  # Remove duplicates
            
            for i in range(len(all_nodes) - 1):
                node_a = all_nodes[i]
                node_b = all_nodes[i + 1]
                
                if node_a != node_b:
                    xa, ya, _ = self.nodes[node_a]
                    xb, yb, _ = self.nodes[node_b]
                    distance = np.sqrt((xb - xa)**2 + (yb - ya)**2)
                    
                    if not any(neighbor == node_b for neighbor, _ in self.graph[node_a]):
                        self.graph[node_a].append((node_b, distance))
                        self.graph[node_b].append((node_a, distance))
                        edges_added += 1
        
        print(f"  * {edges_added} corridor connections (with intermediate points)")
    
    def _connect_doors_to_corridors(self):
        """Connect doors to corridors ONLY through actual LINE segments"""
        connections_added = 0
        snap_distance = 2.0  # How close door must be to a line to connect
        
        for room, door_nodes in self.room_to_nodes.items():
            for door_node in door_nodes:
                dx, dy, _ = self.nodes[door_node]
                door_point = np.array([dx, dy])
                
                connected_count = 0
                
                # For each line in the floor plan
                for line_start, line_end in self.all_lines:
                    # Check if door is close to this specific line
                    dist_to_line = self._point_to_line_distance(door_point, line_start, line_end)
                    
                    if dist_to_line < snap_distance:
                        # Door is near this line - find nodes ON this line to connect to
                        line_vec = line_end - line_start
                        point_vec = door_point - line_start
                        line_len_sq = np.dot(line_vec, line_vec)
                        
                        if line_len_sq > 0:
                            # Find projection of door onto the line
                            t_door = np.dot(point_vec, line_vec) / line_len_sq
                            t_door = max(0, min(1, t_door))
                            
                            # Find closest corridor node ON this line
                            best_node = None
                            best_dist = float('inf')
                            
                            for node_id, (nx, ny, nlabel) in self.nodes.items():
                                if node_id == door_node or nlabel is not None:
                                    continue
                                
                                point = np.array([nx, ny])
                                dist_to_line = self._point_to_line_distance(point, line_start, line_end)
                                
                                # Node must be ON this line
                                if dist_to_line < 0.5:
                                    point_vec = point - line_start
                                    t_node = np.dot(point_vec, line_vec) / line_len_sq
                                    
                                    # Node must be within line bounds
                                    if -0.05 < t_node < 1.05:
                                        # Distance from door to node
                                        node_dist = np.sqrt((nx - dx)**2 + (ny - dy)**2)
                                        if node_dist < best_dist and node_dist < 20:
                                            best_node = node_id
                                            best_dist = node_dist
                            
                            # Connect to the best node on this line
                            if best_node is not None and connected_count < 2:
                                if not any(neighbor == best_node for neighbor, _ in self.graph[door_node]):
                                    distance = best_dist
                                    self.graph[door_node].append((best_node, distance))
                                    self.graph[best_node].append((door_node, distance))
                                    connections_added += 1
                                    connected_count += 1
        
        print(f"  * {connections_added} door-to-corridor connections")
    
    def find_path(self, start_room, end_room):
        """Find path with A*"""
        start_nodes = self.room_to_nodes.get(start_room, [])
        end_nodes = self.room_to_nodes.get(end_room, [])
        
        if not start_nodes:
            raise ValueError(f"Room '{start_room}' not found")
        if not end_nodes:
            raise ValueError(f"Room '{end_room}' not found")
        
        print(f"\nFinding path: {start_room} -> {end_room}")
        
        best_path = None
        best_distance = float('inf')
        
        for start_node in start_nodes:
            for end_node in end_nodes:
                path, dist = self._astar(start_node, end_node)
                if path and dist < best_distance:
                    best_path = path
                    best_distance = dist
        
        if best_path:
            labeled = sum(1 for nid in best_path if self.nodes[nid][2] and self.nodes[nid][2] != 'ori')
            print(f"[OK] Path: {len(best_path)} waypoints, {best_distance:.2f} units")
        else:
            print("[X] No path")
        
        return best_path, best_distance
    
    def _heuristic(self, node_id, goal_id):
        """A* heuristic"""
        x1, y1, _ = self.nodes[node_id]
        x2, y2, _ = self.nodes[goal_id]
        return np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    def _astar(self, start, goal):
        """A* algorithm"""
        counter = 0
        open_set = [(0, counter, start)]
        counter += 1
        
        g_score = {start: 0}
        f_score = {start: self._heuristic(start, goal)}
        came_from = {start: None}
        visited = set()
        
        while open_set:
            current_f, _, current = heapq.heappop(open_set)
            
            if current in visited:
                continue
            visited.add(current)
            
            if current == goal:
                path = []
                node = goal
                while node is not None:
                    path.append(node)
                    node = came_from[node]
                return path[::-1], g_score[goal]
            
            for neighbor, edge_weight in self.graph[current]:
                if neighbor in visited:
                    continue
                
                tentative_g = g_score[current] + edge_weight
                
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self._heuristic(neighbor, goal)
                    
                    heapq.heappush(open_set, (f_score[neighbor], counter, neighbor))
                    counter += 1
        
        return [], float('inf')
    
    def _load_calibration_points(self):
        """Load calibration reference points from CSV"""
        origin_x = 0.0
        origin_y = 0.0
        ref_x = None
        ref_y = None
        
        with open(self.labels_csv, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row['room_name'].strip()
                if label == 'ori':
                    origin_x = float(row['x'])
                    origin_y = float(row['y'])
                elif label in ('ref', 'tr-ori', 'ori-tr'):
                    ref_x = float(row['x'])
                    ref_y = float(row['y'])
        
        if ref_x is None or ref_y is None:
            raise ValueError("CSV must contain 'ori' (origin) and 'ref', 'tr-ori', or 'ori-tr' (reference) calibration points")
        
        return origin_x, origin_y, ref_x, ref_y
    
    def visualize_path(self, path, start_room, end_room, output_file='navigation_path.png'):
        """Generate clean floor plan image without path overlay (for frontend rendering)"""
        print(f"Generating floor plan image...")
        
        img = imread(self.image_path)
        img = np.fliplr(img)
        img_height, img_width = img.shape[0], img.shape[1]
        
        # Load calibration points from CSV
        origin_x, origin_y, ref_x, ref_y = self._load_calibration_points()
        
        # Calculate scale from reference points
        dxf_width = ref_x - origin_x
        dxf_height = ref_y - origin_y
        
        scale_x = img_width / dxf_width
        scale_y = img_height / dxf_height
        
        print(f"[Calibration] DXF bounds: ({origin_x}, {origin_y}) to ({ref_x}, {ref_y})")
        print(f"[Calibration] Image size: {img_width}x{img_height}")
        print(f"[Calibration] Scale: {scale_x:.4f} px/unit (X), {scale_y:.4f} px/unit (Y)")
        
        def to_pixel(x, y):
            # Map from DXF coords to image pixels
            px = (x - origin_x) * scale_x
            py = (y - origin_y) * scale_y
            return px, py
        
        fig, ax = plt.subplots(figsize=(18, 14))
        ax.imshow(img, extent=[0, img_width, 0, img_height], origin='lower')
        
        # Draw all connections in light gray (for reference)
        for node_id, neighbors in self.graph.items():
            x1, y1, label1 = self.nodes[node_id]
            px1, py1 = to_pixel(x1, y1)
            for neighbor_id, _ in neighbors:
                if neighbor_id > node_id:
                    x2, y2, label2 = self.nodes[neighbor_id]
                    px2, py2 = to_pixel(x2, y2)
                    
                    is_door = (label1 and label1 != 'ori') or (label2 and label2 != 'ori')
                    ax.plot([px1, px2], [py1, py2], 'gray', alpha=0.1, linewidth=0.5, linestyle='--' if is_door else '-')
        
        # Draw door nodes
        for node_id, (x, y, label) in self.nodes.items():
            if label and label != 'ori':
                px, py = to_pixel(x, y)
                ax.plot(px, py, 'o', color='lightblue', markersize=5, alpha=0.5)
        
        # Export path data to JSON separately
        self._export_path_to_json(path, start_room, end_room, origin_x, origin_y, scale_x, scale_y)
        
        ax.set_xlim(0, img_width)
        ax.set_ylim(0, img_height)
        ax.axis('off')
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"[OK] Saved: {output_file}")
        plt.close()
    
    def _export_path_to_json(self, path, start_room, end_room, origin_x, origin_y, scale_x, scale_y):
        """Export path data to JSON for frontend rendering"""
        import json
        
        # Convert DXF coordinates to pixel coordinates
        path_data = {
            'start_room': start_room,
            'end_room': end_room,
            'waypoints': [],
            'total_distance': 0,
            'calibration': {
                'origin_x': origin_x,
                'origin_y': origin_y,
                'scale_x': scale_x,
                'scale_y': scale_y
            }
        }
        
        # Add waypoints
        total_dist = 0
        for i, node_id in enumerate(path):
            x, y, label = self.nodes[node_id]
            px = (x - origin_x) * scale_x
            py = (y - origin_y) * scale_y
            
            waypoint = {
                'index': i,
                'node_id': node_id,
                'dxf_coords': {'x': float(x), 'y': float(y)},
                'pixel_coords': {'x': float(px), 'y': float(py)},
                'label': label if label else None
            }
            path_data['waypoints'].append(waypoint)
            
            # Calculate distance
            if i > 0:
                prev_x, prev_y, _ = self.nodes[path[i-1]]
                dist = np.sqrt((x - prev_x)**2 + (y - prev_y)**2)
                total_dist += dist
        
        path_data['total_distance'] = float(total_dist)
        
        # Save to JSON file with same name as PNG but .json extension
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_file = os.path.join(base_path, 'output', 
                                 f'path_{start_room}_to_{end_room}.json')
        
        with open(json_file, 'w') as f:
            json.dump(path_data, f, indent=2)
        
        print(f"[OK] Path data exported to: {json_file}")
    
    def print_available_rooms(self):
        print("\n" + "="*70)
        print("AVAILABLE ROOMS:")
        print("="*70)
        for room in sorted(self.room_to_nodes.keys()):
            doors = len(self.room_to_nodes[room])
            print(f"  {room:15s} ({doors} door{'s' if doors > 1 else ''})")
        print("="*70)

    def export_dxf_text_entities(self, output_csv='extracted_rooms.csv'):
        """Extract all TEXT entities from DXF file and save to CSV for review"""
        import csv
        doc = ezdxf.readfile(self.dxf_path)
        msp = doc.modelspace()
        
        text_entities = []
        for entity in msp:
            if entity.dxftype() == 'TEXT':
                text_content = entity.dxf.text
                x = entity.dxf.insert.x
                y = entity.dxf.insert.y
                text_entities.append({
                    'x': x,
                    'y': y,
                    'text': text_content
                })
        
        # Save to CSV
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_path = os.path.join(base_path, 'data', output_csv)
        
        with open(output_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['x', 'y', 'text'])
            writer.writeheader()
            writer.writerows(sorted(text_entities, key=lambda t: t['text']))
        
        print(f"\n[OK] Extracted {len(text_entities)} text entities")
        print(f"     Saved to: {output_path}")
        
        # Print summary
        print(f"\n[SUMMARY] Unique room labels found:")
        unique_rooms = {}
        for entity in text_entities:
            text = entity['text'].strip()
            if text and not text.startswith('Sheet'):
                if text not in unique_rooms:
                    unique_rooms[text] = 0
                unique_rooms[text] += 1
        
        for room in sorted(unique_rooms.keys()):
            print(f"  {room}: {unique_rooms[room]} occurrence(s)")
        
        return output_path

    def export_dxf_point_entities(self, output_csv='extracted_points.csv'):
        """Extract all POINT entities from DXF file and save to CSV for review"""
        import csv
        doc = ezdxf.readfile(self.dxf_path)
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
                        'notes': 'Extracted POINT entity - needs manual naming'
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
        print(f"\n[ACTION] Edit this file to:")
        print(f"     1. Rename room names from ROOM_# to actual classroom names")
        print(f"     2. Update notes with room descriptions")
        print(f"     3. Add origin (0,0,ori) and reference point if needed")
        
        return output_path

    def export_navigation_data(self, output_file='navigation_data.json'):
        """Export lines, nodes, and graph for frontend visualization"""
        import json
        
        # Prepare node data
        nodes_list = []
        for node_id, (x, y, label) in self.nodes.items():
            nodes_list.append({
                'id': node_id,
                'x': float(x),
                'y': float(y),
                'label': label if label else None,
                'type': 'room' if label and label not in ['ori', 'ref'] else 'pathway'
            })
        
        # Prepare edge/line data
        edges_list = []
        seen_edges = set()
        for node_id, neighbors in self.graph.items():
            for neighbor_id, distance in neighbors:
                # Avoid duplicates (undirected graph)
                edge_key = tuple(sorted([node_id, neighbor_id]))
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    x1, y1, _ = self.nodes[node_id]
                    x2, y2, _ = self.nodes[neighbor_id]
                    edges_list.append({
                        'from': node_id,
                        'to': neighbor_id,
                        'distance': float(distance),
                        'start': {'x': float(x1), 'y': float(y1)},
                        'end': {'x': float(x2), 'y': float(y2)}
                    })
        
        # Prepare room mapping
        rooms = {}
        for room_name, node_ids in self.room_to_nodes.items():
            rooms[room_name] = [
                {
                    'id': nid,
                    'x': float(self.nodes[nid][0]),
                    'y': float(self.nodes[nid][1])
                }
                for nid in node_ids
            ]
        
        # Create export data
        export_data = {
            'metadata': {
                'total_nodes': len(self.nodes),
                'total_edges': len(edges_list),
                'total_rooms': len(rooms),
                'dxf_file': self.dxf_path,
                'image_file': self.image_path,
                'labels_file': self.labels_csv
            },
            'nodes': nodes_list,
            'edges': edges_list,
            'rooms': rooms,
            'calibration': {
                'origin': {'x': 0.0, 'y': 0.0},
                'reference': None
            }
        }
        
        # Load calibration points from CSV if available
        try:
            origin_x, origin_y, ref_x, ref_y = self._load_calibration_points()
            export_data['calibration']['origin'] = {'x': float(origin_x), 'y': float(origin_y)}
            export_data['calibration']['reference'] = {'x': float(ref_x), 'y': float(ref_y)}
        except:
            pass
        
        # Save to file
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_path = os.path.join(base_path, 'output', output_file)
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"[OK] Navigation data exported to {output_path}")
        print(f"     - {len(nodes_list)} nodes")
        print(f"     - {len(edges_list)} edges")
        print(f"     - {len(rooms)} rooms")
        
        return output_path


def main(start_room=None, end_room=None):
    """
    Navigate between two rooms
    
    Args:
        start_room (str): Starting room name (e.g., 'N048')
        end_room (str): Destination room name (e.g., 'E001')
    """
    print("="*70)
    print("INDOOR NAVIGATION - A* PATHFINDING")
    print("="*70)
    
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    dxf_file = os.path.join(base_path, 'data/floor-plans/basement-path-defined.DXF')
    image_file = os.path.join(base_path, 'data/floor-plans/scott-lab-basement.jpg')
    labels_file = os.path.join(base_path, 'data/point_labels.csv')
    
    pf = IndoorPathfinder(dxf_file, image_file, labels_file)
    pf.load_data()
    
    # If rooms not provided, prompt user
    if start_room is None or end_room is None:
        pf.print_available_rooms()
        start_room = input("Enter start room: ").strip().upper()
        end_room = input("Enter end room: ").strip().upper()
    else:
        start_room = start_room.upper()
        end_room = end_room.upper()
    
    try:
        path, distance = pf.find_path(start_room, end_room)
        if path:
            output = os.path.join(base_path, f'output/route_{start_room}_to_{end_room}.png')
            pf.visualize_path(path, start_room, end_room, output)
            print(f"\n{'='*70}")
            print(f"NAVIGATION COMPLETE")
            print(f"{'='*70}")
            print(f"Route: {start_room} → {end_room}")
            print(f"Distance: {distance:.2f} units")
            print(f"Waypoints: {len(path)}")
            print(f"{'='*70}\n")
        else:
            print(f"\n[X] No path found between {start_room} and {end_room}")
    except ValueError as e:
        print(f"\n[X] Error: {e}")


if __name__ == "__main__":
    main()
