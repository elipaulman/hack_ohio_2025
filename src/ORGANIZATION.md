# Source Code Organization

## Directory Structure

```
src/
├── pathfinding.py              ⭐ MAIN ENTRY POINT
├── pathfinder.py               ⭐ CORE ALGORITHM
├── extract_rooms.py            🔧 SETUP TOOL
├── README.md                   📖 USAGE GUIDE
├── ORGANIZATION.md             📋 THIS FILE
├── extract_floor_rooms.py      (legacy, will be removed)
└── _old_*.py.bak              (archived old scripts)
```

---

## Essential Scripts (What You Need)

### 1. `pathfinding.py` ⭐ **MAIN ENTRY POINT**

**Purpose:** Run pathfinding from one place to another

**Usage:**
```bash
# List all rooms on a floor
python pathfinding.py floor_1

# Find a route
python pathfinding.py floor_1 E100 W170

# Works with all configured floors
python pathfinding.py basement N048 E001
python pathfinding.py floor_2 E200 N250
```

**What it does:**
- Loads floor configuration
- Builds navigation graph
- Runs A* pathfinding
- Generates visualization (PNG)
- Exports navigation data (JSON)

**Key Features:**
- Single entry point for all floors
- Centralized configuration
- Clear command-line interface
- Comprehensive error handling

---

### 2. `pathfinder.py` ⭐ **CORE ALGORITHM**

**Purpose:** A* pathfinding engine (reusable component)

**Classes:**
- `IndoorPathfinder` - Main pathfinding class

**Methods:**
- `load_data()` - Parse DXF and build graph
- `find_path(start, end)` - A* algorithm
- `visualize_path()` - Generate PNG
- `export_navigation_data()` - Generate JSON
- `print_available_rooms()` - List all rooms

**Status:** Production-ready, reusable across all floors

---

### 3. `extract_rooms.py` 🔧 **SETUP TOOL**

**Purpose:** Extract room coordinates from new DXF files

**Usage:**
```bash
# Extract from a new floor
python extract_rooms.py floor_3
```

**What it does:**
1. Analyzes DXF structure (shows entity types)
2. Extracts POINT entities (room locations)
3. Generates CSV template
4. Provides instructions for labeling

**Workflow:**
```
DXF File
   ↓
python extract_rooms.py floor_N
   ↓
Edit CSV with real room names
   ↓
Rename to *_labels.csv
   ↓
Update pathfinding.py configuration
   ↓
Done! Use: python pathfinding.py floor_N
```

---

## Supporting Files

### `README.md` 📖

Complete documentation with:
- Quick start examples
- Usage guide
- Room naming conventions
- Output file descriptions
- Troubleshooting
- Architecture overview

**Read this for detailed information**

---

## Archived Files (for reference only)

```
_old_run_floor_pathfinding.py.bak    (now: pathfinding.py)
_old_export_navigation.py.bak        (functionality merged)
_old_view_json.py.bak                (functionality merged)
extract_floor_rooms.py               (replaced by extract_rooms.py)
```

These are kept for reference but NOT needed for normal usage.

---

## Quick Start

### 1. Find a Route (Most Common)

```bash
cd src
python pathfinding.py floor_1 E100 W170
```

### 2. List All Rooms on a Floor

```bash
python pathfinding.py floor_2
```

### 3. Add a New Floor

```bash
# 1. Extract coordinates
python extract_rooms.py floor_3

# 2. Edit data/floor_3_rooms.csv with real room names

# 3. Rename file
mv ../data/floor_3_rooms.csv ../data/floor_3_labels.csv

# 4. Update pathfinding.py configuration (add floor_3 entry)

# 5. Use it
python pathfinding.py floor_3 ROOM1 ROOM2
```

---

## Configuration (In `pathfinding.py`)

```python
FLOORS = {
    'basement': {
        'dxf': 'basement-path-defined.DXF',
        'image': 'scott-lab-basement.jpg',
        'labels': 'basement_labels.csv',
        'output_prefix': 'basement'
    },
    'floor_1': { ... },
    'floor_2': { ... },
    # Add new floors here
}
```

**To add a new floor:**
1. Add entry to `FLOORS` dictionary
2. Ensure files exist in `data/floor-plans/`
3. Ensure labels CSV exists in `data/`
4. Run: `python pathfinding.py <floor_name>`

---

## File Sizes (Approx)

| File | Lines | Purpose |
|------|-------|---------|
| pathfinding.py | 150 | Main entry point |
| pathfinder.py | 625 | Core algorithm |
| extract_rooms.py | 120 | Setup tool |
| README.md | 400+ | Documentation |

---

## Dependencies

All scripts use:
- `ezdxf` - DXF parsing
- `numpy` - Math operations
- `matplotlib` - Visualization
- `csv` - CSV handling

Install with:
```bash
pip install ezdxf numpy matplotlib
```

---

## Next Steps

1. ✅ Use `pathfinding.py` to generate routes
2. 🔄 Extract remaining floors (3, 4, 5) using `extract_rooms.py`
3. 📊 Use JSON exports in frontend
4. 🎨 Integrate with web application
5. 📍 Add real-time tracking

---

## Summary

**Clean, organized structure:**
- 3 active Python files (essential only)
- 1 comprehensive README
- Clear single entry point
- Legacy files archived

**Everything you need to:**
- Generate routes between rooms
- Add new floors
- Export data for frontend

**All code is:**
- ✅ Modular
- ✅ Reusable
- ✅ Well-documented
- ✅ Production-ready
