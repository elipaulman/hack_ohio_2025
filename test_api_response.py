import requests
import json

# Test multi-floor API
response = requests.get('http://localhost:5000/api/pathfinding', params={
    'start_floor': 'floor_1',
    'end_floor': 'basement',
    'start': 'E100',
    'end': 'W066'
})

if response.status_code == 200:
    data = response.json()
    print('API Response Structure:')
    print(f'  Floors: {data.get("floors", [])}')
    print(f'  Total distance: {data.get("total_distance", 0):.2f}')
    print(f'  Segments: {len(data.get("segments", []))}')
    
    for i, segment in enumerate(data.get('segments', [])):
        print(f'\n  Segment {i}: {segment["floor"]}')
        print(f'    Waypoints: {len(segment["waypoints"])}')
        print(f'    Distance: {segment["distance"]:.2f}')
        
        # Show first and last waypoint
        if segment['waypoints']:
            first = segment['waypoints'][0]
            last = segment['waypoints'][-1]
            print(f'    Start: {first.get("label", "unknown")} at ({first["pixel_coords"]["x"]:.1f}, {first["pixel_coords"]["y"]:.1f})')
            print(f'    End: {last.get("label", "unknown")} at ({last["pixel_coords"]["x"]:.1f}, {last["pixel_coords"]["y"]:.1f})')
    
    if 'transition' in data:
        trans = data['transition']
        print(f'\n  Transition: {trans["exit_stair"]} ({trans["from_floor"]}) -> {trans["arrive_stair"]} ({trans["to_floor"]})')
else:
    print(f'Error: {response.status_code}')
    print(response.text)

