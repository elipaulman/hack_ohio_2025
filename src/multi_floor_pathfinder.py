"""
Multi-Floor Pathfinding with Stairs and Elevator Logic
Handles pathfinding across multiple floors using stairwells and elevators
"""

from pathfinder import IndoorPathfinder
from pathfinding import FloorNavigationConfig
import os
import numpy as np


class StairwellMapper:
    """Maps stairwell connections between floors"""
    
    # Stairwell naming convention rules:
    # - Stairs ending with S: Direct connection (W101S floor_1 <-> W201S floor_2 <-> W001S basement)
    # - SS/SN/SW/SE: Special directional stairs with specific mappings
    
    @staticmethod
    def get_stair_connections():
        """
        Define all stairwell connections between floors
        Returns dict of {stair_name: {floor: connected_stair}}
        """
        connections = {
            # W101S: basement W001S <-> floor_1 W101S <-> floor_2 W201S
            'W101S': {
                'floor_1_to_basement': 'W001S',
                'floor_1_to_floor_2': 'W201S',
            },
            'W001S': {
                'basement_to_floor_1': 'W101S',
            },
            'W201S': {
                'floor_2_to_floor_1': 'W101S',
            },
            
            # W102SS/W002SS/W202SS connections
            'W102SS': {
                'floor_1_to_basement': 'W002SS',
                'floor_1_to_floor_2': 'W202SS',
            },
            'W002SS': {
                'basement_to_floor_1': 'W102SS',
            },
            'W202SS': {
                'floor_2_to_floor_1': 'W102SS',
            },
            
            # W103SN special case
            'W103SN': {
                'floor_1_to_basement': 'W003S',  # Down to W003S (if exists)
                'floor_1_to_floor_2_exit': 'W103SS',  # Exit via W103SS
                'floor_1_to_floor_2_arrive': 'W203SN',  # Arrive at W203SN
            },
            'W203SN': {
                'floor_2_to_floor_1': 'W103SN',
            },
            
            # W104S: basement W004S <-> floor_1 W104S <-> floor_2 W204S
            'W104S': {
                'floor_1_to_basement': 'W004S',
                'floor_1_to_floor_2': 'W204S',
            },
            'W004S': {
                'basement_to_floor_1': 'W104S',
            },
            'W204S': {
                'floor_2_to_floor_1': 'W104S',
            },
            
            # E102S: basement E002S <-> floor_1 E102S <-> floor_2 E202S
            'E102S': {
                'floor_1_to_basement': 'E002S',
                'floor_1_to_floor_2': 'E202S',
            },
            'E002S': {
                'basement_to_floor_1': 'E102S',
            },
            'E202S': {
                'floor_2_to_floor_1': 'E102S',
            },
            
            # E103S: basement E003S <-> floor_1 E103S <-> floor_2 E203S
            'E103S': {
                'floor_1_to_basement': 'E003S',
                'floor_1_to_floor_2': 'E203S',
            },
            'E003S': {
                'basement_to_floor_1': 'E103S',
            },
            'E203S': {
                'floor_2_to_floor_1': 'E103S',
            },
            
            # E104S: floor_1 E104S <-> floor_2 E204S
            'E104S': {
                'floor_1_to_floor_2': 'E204S',
            },
            'E204S': {
                'floor_2_to_floor_1': 'E104S',
            },
            
            # E105SW/SE special case
            'E105SW': {
                'floor_1_to_basement': 'E005S',
            },
            'E105SE': {
                'floor_1_to_floor_2': 'E205S',
            },
            'E005S': {
                'basement_to_floor_1': 'E105SW',
            },
            'E205S': {
                'floor_2_to_floor_1': 'E105SE',
            },
        }
        
        return connections
    
    @staticmethod
    def get_connected_stair(stair_name, from_floor, to_floor):
        """
        Get the connected stairwell when moving between floors
        
        Args:
            stair_name: Name of the stairwell (e.g., 'W101S')
            from_floor: Current floor ('basement', 'floor_1', 'floor_2')
            to_floor: Target floor ('basement', 'floor_1', 'floor_2')
            
        Returns:
            Dictionary with 'exit_stair' and 'arrive_stair' (may be same or different)
        """
        connections = StairwellMapper.get_stair_connections()
        
        if stair_name not in connections:
            return None
        
        stair_config = connections[stair_name]
        connection_key = f'{from_floor}_to_{to_floor}'
        
        # Check for special exit/arrive case
        exit_key = f'{connection_key}_exit'
        arrive_key = f'{connection_key}_arrive'
        
        if exit_key in stair_config and arrive_key in stair_config:
            # Special case like W103SN
            return {
                'exit_stair': stair_config[exit_key],
                'arrive_stair': stair_config[arrive_key]
            }
        elif connection_key in stair_config:
            # Normal case - same stair for exit and arrival
            connected = stair_config[connection_key]
            return {
                'exit_stair': stair_name,
                'arrive_stair': connected
            }
        
        return None


class MultiFloorPathfinder:
    """Pathfinding across multiple floors using stairs and elevators"""
    
    def __init__(self):
        self.pathfinders = {}
        self.stair_mapper = StairwellMapper()
        self._load_all_floors()
    
    def _load_all_floors(self):
        """Load pathfinder for each available floor"""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        for floor_name in ['basement', 'floor_1', 'floor_2']:
            try:
                config = FloorNavigationConfig.get_floor_config(floor_name)
                
                dxf_file = os.path.join(base_path, 'data/floor-plans', config['dxf'])
                image_file = os.path.join(base_path, 'data/floor-plans', config['image'])
                labels_file = os.path.join(base_path, 'data', config['labels'])
                
                if os.path.exists(dxf_file) and os.path.exists(labels_file):
                    pf = IndoorPathfinder(dxf_file, image_file, labels_file)
                    pf.load_data()
                    self.pathfinders[floor_name] = pf
                    print(f"[OK] Loaded {floor_name}")
            except Exception as e:
                print(f"[ERROR] Failed to load {floor_name}: {e}")
    
    def find_multi_floor_path(self, start_floor, start_room, end_floor, end_room):
        """
        Find path across multiple floors
        
        Args:
            start_floor: Starting floor name ('basement', 'floor_1', 'floor_2')
            start_room: Starting room name
            end_floor: Destination floor name
            end_room: Destination room name
            
        Returns:
            Dictionary with path segments for each floor and transition points
        """
        start_room = start_room.upper()
        end_room = end_room.upper()
        
        if start_floor == end_floor:
            # Same floor - use single floor pathfinding
            pf = self.pathfinders.get(start_floor)
            if not pf:
                raise ValueError(f"Floor '{start_floor}' not loaded")
            
            path, distance = pf.find_path(start_room, end_room)
            if not path:
                raise ValueError(f"No path found on {start_floor}")
            
            # Convert to waypoints format
            waypoints = []
            for idx, node_id in enumerate(path):
                x, y, label = pf.nodes[node_id]
                waypoints.append({
                    'floor': start_floor,
                    'index': idx,
                    'node_id': node_id,
                    'dxf_coords': {'x': x, 'y': y},
                    'pixel_coords': {'x': x * 25.4, 'y': y * 25.4},
                    'label': label
                })
            
            return {
                'start_room': start_room,
                'start_floor': start_floor,
                'end_room': end_room,
                'end_floor': end_floor,
                'total_distance': distance,
                'floors': [start_floor],
                'segments': [{
                    'floor': start_floor,
                    'waypoints': waypoints,
                    'distance': distance
                }]
            }
        
        # Multi-floor pathfinding
        return self._find_cross_floor_path(start_floor, start_room, end_floor, end_room)
    
    def _find_cross_floor_path(self, start_floor, start_room, end_floor, end_room):
        """Find path across multiple floors using stairs"""
        # For now, implement simple one-transition logic (start floor -> stairs -> end floor)
        # TODO: Implement multi-hop pathfinding for more than 2 floors
        
        start_pf = self.pathfinders.get(start_floor)
        end_pf = self.pathfinders.get(end_floor)
        
        if not start_pf or not end_pf:
            raise ValueError("One or both floors not loaded")
        
        # Find all stairs on the starting floor
        start_stairs = self._get_stairs_on_floor(start_floor)
        
        # Try to find a path using each available stairwell
        best_path = None
        best_distance = float('inf')
        best_transition = None
        
        for stair_name in start_stairs:
            # Get the connected stair on the destination floor
            connection = self.stair_mapper.get_connected_stair(
                stair_name, start_floor, end_floor
            )
            
            if not connection:
                continue
            
            exit_stair = connection['exit_stair']
            arrive_stair = connection['arrive_stair']
            
            try:
                # Segment 1: Start room to exit stair on start floor
                path1, dist1 = start_pf.find_path(start_room, exit_stair.upper())
                
                # Segment 2: Arrival stair to end room on end floor
                path2, dist2 = end_pf.find_path(arrive_stair.upper(), end_room)
                
                if path1 and path2:
                    total_dist = dist1 + dist2
                    if total_dist < best_distance:
                        best_distance = total_dist
                        best_path = (path1, path2)
                        best_transition = {
                            'exit_stair': exit_stair,
                            'arrive_stair': arrive_stair,
                            'from_floor': start_floor,
                            'to_floor': end_floor
                        }
            except ValueError:
                # Stair not found or no path
                continue
        
        if not best_path:
            raise ValueError(f"No path found from {start_floor}/{start_room} to {end_floor}/{end_room}")
        
        # Build the complete path data
        path1, path2 = best_path
        segments = []
        all_waypoints = []
        waypoint_idx = 0
        
        # Segment 1: Start floor
        segment1_waypoints = []
        for node_id in path1:
            x, y, label = start_pf.nodes[node_id]
            waypoint = {
                'floor': start_floor,
                'index': waypoint_idx,
                'node_id': node_id,
                'dxf_coords': {'x': x, 'y': y},
                'pixel_coords': {'x': x * 25.4, 'y': y * 25.4},
                'label': label,
                'is_transition': label and label.upper() == best_transition['exit_stair'].upper()
            }
            segment1_waypoints.append(waypoint)
            all_waypoints.append(waypoint)
            waypoint_idx += 1
        
        segments.append({
            'floor': start_floor,
            'waypoints': segment1_waypoints,
            'distance': sum(np.linalg.norm(
                np.array([start_pf.nodes[path1[i]][:2]]) - 
                np.array([start_pf.nodes[path1[i+1]][:2]])
            ) for i in range(len(path1)-1)) if len(path1) > 1 else 0
        })
        
        # Add transition marker
        all_waypoints.append({
            'floor': 'transition',
            'index': waypoint_idx,
            'transition_type': 'stairs',
            'from_floor': start_floor,
            'to_floor': end_floor,
            'exit_stair': best_transition['exit_stair'],
            'arrive_stair': best_transition['arrive_stair']
        })
        waypoint_idx += 1
        
        # Segment 2: End floor
        segment2_waypoints = []
        for node_id in path2:
            x, y, label = end_pf.nodes[node_id]
            waypoint = {
                'floor': end_floor,
                'index': waypoint_idx,
                'node_id': node_id,
                'dxf_coords': {'x': x, 'y': y},
                'pixel_coords': {'x': x * 25.4, 'y': y * 25.4},
                'label': label,
                'is_transition': label and label.upper() == best_transition['arrive_stair'].upper()
            }
            segment2_waypoints.append(waypoint)
            all_waypoints.append(waypoint)
            waypoint_idx += 1
        
        segments.append({
            'floor': end_floor,
            'waypoints': segment2_waypoints,
            'distance': sum(np.linalg.norm(
                np.array([end_pf.nodes[path2[i]][:2]]) - 
                np.array([end_pf.nodes[path2[i+1]][:2]])
            ) for i in range(len(path2)-1)) if len(path2) > 1 else 0
        })
        
        return {
            'start_room': start_room,
            'start_floor': start_floor,
            'end_room': end_room,
            'end_floor': end_floor,
            'total_distance': best_distance,
            'floors': [start_floor, end_floor],
            'transition': best_transition,
            'segments': segments,
            'waypoints': all_waypoints  # All waypoints across all floors
        }
    
    def _get_stairs_on_floor(self, floor_name):
        """Get list of all stairwells on a given floor"""
        pf = self.pathfinders.get(floor_name)
        if not pf:
            return []
        
        stairs = []
        for room_name in pf.room_to_nodes.keys():
            # Check if it's a stairwell (ends with S, SS, SN, SW, SE)
            if (room_name.endswith('S') or room_name.endswith('SS') or 
                room_name.endswith('SN') or room_name.endswith('SW') or 
                room_name.endswith('SE')):
                stairs.append(room_name)
        
        return stairs


def find_multi_floor_path(start_floor, start_room, end_floor, end_room):
    """
    Convenience function for multi-floor pathfinding
    
    Args:
        start_floor: Starting floor ('basement', 'floor_1', 'floor_2')
        start_room: Starting room name
        end_floor: Destination floor
        end_room: Destination room name
    
    Returns:
        Path data dictionary with segments for each floor
    """
    print(f"\n{'='*70}")
    print(f"MULTI-FLOOR NAVIGATION")
    print(f"{'='*70}")
    print(f"From: {start_floor.upper()} / {start_room}")
    print(f"To:   {end_floor.upper()} / {end_room}")
    print(f"{'='*70}\n")
    
    mfp = MultiFloorPathfinder()
    result = mfp.find_multi_floor_path(start_floor, start_room, end_floor, end_room)
    
    if result:
        print(f"\n[OK] Multi-floor path found!")
        print(f"  Total distance: {result['total_distance']:.2f} units")
        print(f"  Floors traversed: {' -> '.join(result['floors'])}")
        if 'transition' in result:
            trans = result['transition']
            print(f"  Transition: {trans['exit_stair']} -> {trans['arrive_stair']}")
        print(f"  Total waypoints: {len(result['waypoints'])}")
    
    return result

