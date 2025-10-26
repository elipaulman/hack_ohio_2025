import React, { useEffect, useState } from 'react';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1).map(line => {
    // Respect quoted fields that may contain commas
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    values.push(current.trim());

    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    return obj;
  });

  return rows;
}

function groupByRoom(rows) {
  return rows.reduce((acc, r) => {
    const room = (r.Room || 'Unknown').trim();
    if (!acc[room]) acc[room] = [];
    acc[room].push(r);
    return acc;
  }, {});
}

export default function ScottLabSchedule() {
  const [data, setData] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomFilter, setRoomFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1); // For mobile: 1=Mon, 2=Tue, etc.

  useEffect(() => {
    let mounted = true;
    fetch('/scott_lab_schedule.csv')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load schedule CSV');
        return r.text();
      })
      .then(text => {
        if (!mounted) return;
        const rows = parseCSV(text);
        setData(rows);
        setGrouped(groupByRoom(rows));
        setLoading(false);
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // When grouped rooms change, set a default selected room if not set
  useEffect(() => {
    const rooms = Object.keys(grouped).sort();
    if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0]);
    }
  }, [grouped, selectedRoom]);

  // Set selected day to today on mobile when component loads
  useEffect(() => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (today >= 1 && today <= 5) {
      setSelectedDay(today); // 1=Mon, 2=Tue, ..., 5=Fri
    }
  }, []);

  if (loading) return <div className="p-6">Loading Scott Lab schedule…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  // Build events for calendar: expand rows with multiple days into separate events
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };

  function parseTimeToMinutes(t) {
    if (!t) return null;
    const m = t.trim().toLowerCase().match(/(\d{1,2}):(\d{2})\s*(am|pm)/);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ampm = m[3];
    if (ampm === 'pm' && hh !== 12) hh += 12;
    if (ampm === 'am' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  const events = [];
  data.forEach(r => {
    const daysField = (r.Days || '').replace(/"/g, '').trim();
    if (!daysField) return;
    const starts = parseTimeToMinutes(r.Start);
    const ends = parseTimeToMinutes(r.End);
    if (starts == null || ends == null) return;
    const parts = daysField.split(',').map(s => s.trim());
    parts.forEach(p => {
      const short = p.slice(0,3); // e.g., Mon
      const d = dayMap[short];
      if (d) {
        events.push({
          day: d,
          start: starts,
          end: ends,
          title: r.Course || '',
          room: r.Room || '',
          raw: r
        });
      }
    });
  });

  if (events.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">No schedule events found</h2>
      </div>
    );
  }

  const rooms = Object.keys(grouped).sort();

  // allow filtering rooms by text
  const visibleRooms = rooms.filter(r => r.toLowerCase().includes(roomFilter.toLowerCase()));
  const showRoomEvents = events.filter(ev => selectedRoom ? ev.room === selectedRoom : true);

  // Determine time range (clamped to reasonable hours)
  const minStart = Math.min(...events.map(e => e.start));
  const maxEnd = Math.max(...events.map(e => e.end));
  const clampMin = Math.min(minStart, 8 * 60);
  const clampMax = Math.max(maxEnd, 20 * 60);
  const startHour = Math.floor(clampMin / 60);
  const endHour = Math.ceil(clampMax / 60);
  const hourCount = Math.max(6, endHour - startHour);

  const hourHeight = 60; // px per hour
  const calendarHeight = hourCount * hourHeight;

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  // Color per event (so different classes in same room can have different colors)
  const colorForEvent = (ev) => {
    const key = `${ev.title}|${ev.start}|${ev.end}`;
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (h * 31 + key.charCodeAt(i)) % 360;
    }
    // slightly varied saturation/lightness for better contrast
    return `hsl(${h}, 68%, 56%)`;
  };

  // helper to format minutes -> h:mm am/pm
  function formatTime(mins) {
    if (mins == null) return '';
    let hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const ampm = hh >= 12 ? 'pm' : 'am';
    hh = ((hh + 11) % 12) + 1;
    return `${hh}:${mm.toString().padStart(2, '0')} ${ampm}`;
  }

  // compute current time marker
  const nowDate = new Date();
  const todayWeekday = nowDate.getDay();
  const nowDayIndex = (todayWeekday >= 1 && todayWeekday <= 5) ? (todayWeekday - 1) : null;
  const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const topNow = ((currentMinutes - startHour * 60) / 60) * hourHeight;
  const showNow = nowDayIndex !== null && currentMinutes >= startHour * 60 && currentMinutes <= endHour * 60;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="container mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Scott Lab — Weekly Schedule (Mon–Fri)</h1>
        <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">Classes placed into weekday/time blocks. Times shown are local class times.</p>

        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <label className="text-sm font-medium">Room</label>
            <select value={selectedRoom || ''} onChange={e => setSelectedRoom(e.target.value)} className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded text-sm max-w-[150px] sm:max-w-[200px] truncate">
              {visibleRooms.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <input placeholder="Filter rooms" value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded text-sm w-24 sm:w-32" />
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">{rooms.length} rooms</div>
          </div>
        </div>

        {/* Mobile day selector */}
        <div className="mb-3 flex sm:hidden gap-1 overflow-x-auto">
          {weekdays.map((wd, idx) => (
            <button
              key={wd}
              onClick={() => setSelectedDay(idx + 1)}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                selectedDay === idx + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border'
              }`}
            >
              {wd}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex">
            {/* Time labels column */}
            <div style={{ width: 75, borderRight: '1px solid #eee' }} className="pt-2 sm:w-[70px]">
              <div style={{ height: 32 }} className="hidden sm:block"></div>
              <div style={{ position: 'relative', height: calendarHeight }}>
                {Array.from({ length: hourCount + 1 }).map((_, i) => {
                  const hh = startHour + i;
                  const label = `${((hh + 11) % 12) + 1}:00 ${hh >= 12 ? 'pm' : 'am'}`;
                  return (
                    <div key={i} style={{ height: hourHeight, borderTop: '1px solid #f5f5f5', paddingTop: 6 }} className="text-[10px] sm:text-xs text-gray-500 text-right pr-1 sm:pr-2">{label}</div>
                  );
                })}
                {showNow && (
                  <div style={{ position: 'absolute', top: topNow - 10, left: 2 }} className="text-[10px] sm:text-xs text-red-600 sm:left-[6px]">Now {formatTime(currentMinutes)}</div>
                )}
              </div>
            </div>

            {/* Days columns - Desktop: all days, Mobile: selected day only */}
            <div className="flex-1 relative">
              {/* Desktop view - all 5 days */}
              <div className="hidden sm:grid" style={{ gridTemplateColumns: `repeat(${weekdays.length}, 1fr)`, position: 'relative' }}>
                {weekdays.map((wd, colIdx) => (
                  <div key={wd} style={{ borderLeft: '1px solid #f0f0f0' }}>
                    <div className="text-center font-medium" style={{ height: 32, lineHeight: '32px', background: colIdx === nowDayIndex ? 'rgba(255,77,79,0.04)' : 'transparent' }}>{wd}</div>
                    <div style={{ position: 'relative', height: calendarHeight }}>
                      {/* horizontal lines */}
                      {Array.from({ length: hourCount }).map((_, i) => (
                        <div key={i} style={{ position: 'absolute', top: i * hourHeight, left: 0, right: 0, height: 1, background: '#fafafa' }} />
                      ))}

                      {/* events for this day (only for selected room) */}
                      {showRoomEvents.filter(ev => ev.day === colIdx + 1).map((ev, i) => {
                        const top = ((ev.start - startHour * 60) / 60) * hourHeight;
                        const height = ((ev.end - ev.start) / 60) * hourHeight;
                        const bg = colorForEvent(ev);
                        return (
                          <div key={i} style={{ position: 'absolute', top, left: 6, right: 6, height: Math.max(18, height - 4), background: bg, color: '#fff', borderRadius: 6, padding: '4px 6px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{ev.title}</div>
                            <div style={{ fontSize: 11, opacity: 0.95 }}>{ev.room} • {formatTime(ev.start)} - {formatTime(ev.end)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile view - single day */}
              <div className="sm:hidden">
                <div style={{ position: 'relative', height: calendarHeight }}>
                  {/* horizontal lines */}
                  {Array.from({ length: hourCount }).map((_, i) => (
                    <div key={i} style={{ position: 'absolute', top: i * hourHeight, left: 0, right: 0, height: 1, background: '#fafafa' }} />
                  ))}

                  {/* events for selected day (only for selected room) */}
                  {showRoomEvents.filter(ev => ev.day === selectedDay).map((ev, i) => {
                    const top = ((ev.start - startHour * 60) / 60) * hourHeight;
                    const height = ((ev.end - ev.start) / 60) * hourHeight;
                    const bg = colorForEvent(ev);
                    return (
                      <div key={i} style={{ position: 'absolute', top, left: 4, right: 4, height: Math.max(18, height - 4), background: bg, color: '#fff', borderRadius: 6, padding: '4px 6px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{ev.title}</div>
                        <div style={{ fontSize: 10, opacity: 0.95 }}>{ev.room} • {formatTime(ev.start)} - {formatTime(ev.end)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
