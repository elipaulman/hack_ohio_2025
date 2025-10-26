# Indoor Navigation Pathfinding System

## Quick Start (30 seconds)

```bash
# List all rooms on a floor
python pathfinding.py floor_1

# Find route from room A to room B
python pathfinding.py floor_1 E100 W170

# Generate route on Floor 2
python pathfinding.py floor_2 E200 N250

# Or use basement
python pathfinding.py basement N048 E001
```

---

## Overview

The pathfinding system provides **A* pathfinding** for multi-floor indoor navigation in Scott Laboratory. It processes CAD floor plans (DXF files) and generates optimal routes between classrooms with visual maps.

### ✨ Features
- ✅ Dynamic configuration for unlimited floors
- ✅ Real-time route visualization (300 DPI)
- ✅ JSON export for frontend integration
- ✅ Supports double-door rooms, restrooms, elevators
- ✅ Automatic calibration point detection

---

## File Structure

```
src/
├── pathfinding.py              # MAIN ENTRY POINT
├── pathfinder.py               # Core A* algorithm
├── extract_rooms.py            # DXF analysis tool
└── README.md                   # This file
```

---

## Usage Guide

### 1. List Available Rooms

```bash
python pathfinding.py floor_1
```

**Output:**
```
======================================================================
AVAILABLE ROOMS:
======================================================================
  E100            (2 doors)
  E105            (2 doors)
  W170            (1 door)
  ...
```

### 2. Find a Route

```bash
python pathfinding.py floor_1 E100 W170
```

**What it does:**
1. Loads the DXF floor plan
2. Builds navigation graph (rooms + corridors)
3. Runs A* pathfinding algorithm
4. Generates visualization PNG
5. Exports JSON for frontend

**Output:**
```
[OK] Loaded 154 nodes (41 rooms, 106 pathway nodes)
[OK] 163 connections
Finding path: E100 -> W170
[OK] Path: 32 waypoints, 173.66 units
[OK] Saved: output/route_floor_1_E100_to_W170.png
```

### 3. Check Available Floors

Currently configured floors:
- **basement** - 39 rooms, 153 nodes
- **floor_1** - 41 rooms, 154 nodes  
- **floor_2** - 63 rooms, 203 nodes

### 4. Room Naming Convention

#### Basement
- Building standard names: N048, E001, W097
- Restrooms: E115T, W166T (T suffix)

#### Floor 1
- Format: `E100`, `W170`, `N151`
- Restrooms: `E115T`, `W166T`
- Lounges: `E100A`, `W188M` (A/M suffix)

#### Floor 2
- Format: `E200`, `W259`, `N250`
- Restrooms: `E235T`, `W266T`
- Elevators: `EElev1`, `WElev2`
- Stairs: `E202S`, `W203SN`

---

## Output Files

### Route Visualization (`output/route_*.png`)

High-quality floor plan with:
- **Red line** = optimal path
- **Green dot** = starting room
- **Blue square** = destination room
- **Gray lines** = all available corridors

### Navigation JSON (`output/*_navigation.json`)

Structured data containing:
```json
{
  "metadata": {
    "total_nodes": 154,
    "total_edges": 163,
    "total_rooms": 41
  },
  "nodes": [
    {"id": 0, "x": 69.53, "y": 30.94, "label": "E100", "type": "room"},
    ...
  ],
  "edges": [
    {"from": 0, "to": 1, "distance": 8.42},
    ...
  ],
  "rooms": {
    "E100": [{"id": 0, "x": 69.53, "y": 30.94}],
    ...
  }
}
```

---

## Advanced Usage

### Extract Rooms from New Floor

1. **Place DXF file** in `data/floor-plans/`:
   ```
   floor_3.DXF
   scott-lab-3rd-floor.jpg
   ```

2. **Extract coordinates:**
   ```bash
   python extract_rooms.py floor_3
   ```

3. **Edit generated CSV** (`data/floor_3_rooms.csv`):
   - Replace generic names (ROOM_0, ROOM_1, etc.)
   - Add actual room names from building
   - Format: `point_id,x,y,room_name,notes`

4. **Rename to production** file:
   ```bash
   mv data/floor_3_rooms.csv data/floor_3_labels.csv
   ```

5. **Update configuration** in `pathfinding.py`:
   ```python
   'floor_3': {
       'dxf': 'floor_3.DXF',
       'image': 'scott-lab-3rd-floor.jpg',
       'labels': 'floor_3_labels.csv',
       'output_prefix': 'floor_3'
   }
   ```

6. **Test it:**
   ```bash
   python pathfinding.py floor_3
   python pathfinding.py floor_3 ROOM1 ROOM2
   ```

---

## Examples

### Example 1: Find Lab Location

```bash
python pathfinding.py floor_1 E100
```

Outputs all 41 available rooms on Floor 1.

### Example 2: Route Between Buildings Wings

```bash
python pathfinding.py basement N048 W097
```

Finds path from North wing (N048) to West wing (W097) in basement.

### Example 3: Find Nearest Restroom

```bash
python pathfinding.py floor_2 E200 E235T
```

Route from E200 classroom to nearest restroom (E235T).

### Example 4: Cross Multiple Zones

```bash
python pathfinding.py floor_1 E100 N151
```

Path from East corridor (E100) through North wing (N151).

---

## Performance

| Operation | Time |
|-----------|------|
| DXF Parse | 0.5s |
| Graph Build | 0.5s |
| Pathfinding | <100ms |
| Visualization | 2-3s |
| **Total** | **~4s** |

---

## Troubleshooting

### "Room not found" error

```bash
# Solution: Check exact room name
python pathfinding.py floor_1
# Compare your room name with available list
python pathfinding.py floor_1 E100 W170
```

**Note:** Room names are case-sensitive!

### Missing image file warning

```
[WARNING] Image file not found: scott-lab-1st-floor.jpg
          Visualization will still work but without floor plan background
```

**Solution:** Ensure JPG file exists in `data/floor-plans/`

### "Cannot find path" error

**Possible causes:**
- Rooms on different disconnected sections
- Room name typo (check capitalization)
- Floor not configured yet

---

## Architecture

### Data Flow

```
DXF File (CAD drawing)
    ↓
Parse LINEs (corridors) + POINTs (rooms)
    ↓
Build graph: nodes (rooms+corridors) + edges (connections)
    ↓
A* pathfinding algorithm
    ↓
Visualization (PNG) + JSON export
```

### Graph Structure

- **Nodes**: Room coordinates + corridor endpoints + intermediate points
- **Edges**: Direct connections between adjacent rooms/corridors
- **Weights**: Euclidean distance between nodes

### A* Heuristic

- Uses Euclidean distance to goal
- Optimal path guaranteed
- Efficient search through graph

---

## File Descriptions

### `pathfinding.py`

Main entry point. Handles:
- Configuration management
- Floor validation
- Pathfinding execution
- Output generation

**Key class:** `FloorNavigationConfig` - centralized floor settings

### `pathfinder.py`

Core pathfinding engine. Handles:
- DXF parsing
- Graph construction
- A* algorithm
- Visualization & JSON export

**Key class:** `IndoorPathfinder` - reusable pathfinding core

### `extract_rooms.py`

DXF analysis tool. Handles:
- Extract POINT entities from DXF
- Display entity summary
- Generate CSV template for manual labeling

**One-time use:** Use when adding new floors

---

## Integration with Frontend

Generated JSON files can be used directly in web applications:

```javascript
// Load navigation graph
fetch('/output/floor_1_navigation.json')
  .then(r => r.json())
  .then(data => {
    console.log(`${data.metadata.total_rooms} rooms available`);
    renderNavigationGraph(data);
  });
```

---

## System Requirements

- Python 3.8+
- `ezdxf` - DXF file parsing
- `numpy` - Mathematical operations
- `matplotlib` - Visualization

**Install dependencies:**
```bash
pip install ezdxf numpy matplotlib
```

---

## Next Steps

1. ✅ **Generate routes** using available floors
2. 🔄 **Extract remaining floors** (floor_3, floor_4, floor_5)
3. 🎨 **Integrate with frontend** using JSON exports
4. 📍 **Add real-time tracking** with sensor fusion
5. 🗺️ **Enable multi-floor routing** with stairwell connections

---

## Support

For issues or questions:
1. Check "Troubleshooting" section above
2. Verify room names: `python pathfinding.py <floor>`
3. Ensure DXF and image files exist in `data/floor-plans/`
4. Check configuration in `pathfinding.py`

---

**Built for HackOHI/O 2025 - Indoor Navigation Challenge**
