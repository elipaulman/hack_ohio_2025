import React from 'react';

const OSU_SCARLET = '#B23A3A';
const OSU_GRAY = '#666666';

function HomePage({ onNavigate }) {
  return (
    <div className="min-h-screen" style={{ background: '#fafafa', color: OSU_GRAY }}>
      <main className="container mx-auto px-4 py-10">
        <header className="rounded-2xl shadow-md overflow-hidden mb-8" style={{ background: `linear-gradient(90deg, ${OSU_SCARLET} 0%, rgba(178,58,58,0.9) 60%)` }}>
          <div className="p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Ohio State Navigation</h1>
              <p className="mt-2 text-sm md:text-base opacity-90">Indoor & outdoor wayfinding across the Ohio State campus — start from a building, jump to floor plans, or calibrate indoor tracking.</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <button onClick={() => onNavigate && onNavigate('outdoor-map')} style={{ background: '#ffffff', color: OSU_SCARLET }} className="px-4 py-2 rounded-lg font-medium shadow">Open Outdoor Map</button>
              <button onClick={() => onNavigate && onNavigate('indoor-nav')} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }} className="px-4 py-2 rounded-lg font-medium">Open Indoor Nav</button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary cards */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="text-xl font-semibold" style={{ color: OSU_SCARLET }}>Quick Actions</h2>
              <p className="text-sm text-gray-600 mt-1">Fast access to common tasks on campus</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => onNavigate && onNavigate('outdoor-map')} className="flex items-center gap-3 p-4 rounded-xl border hover:shadow-md" style={{ borderColor: '#f0f0f0' }}>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl" aria-hidden>🗺️</div>
                  <div className="text-left">
                    <div className="font-medium">Campus Map</div>
                    <div className="text-sm text-gray-500">See outdoor routes and building locations</div>
                  </div>
                </button>

                <button onClick={() => onNavigate && onNavigate('indoor-nav')} className="flex items-center gap-3 p-4 rounded-xl border hover:shadow-md" style={{ borderColor: '#f0f0f0' }}>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl" aria-hidden>📍</div>
                  <div className="text-left">
                    <div className="font-medium">Indoor Navigation</div>
                    <div className="text-sm text-gray-500">Open floor plans, calibrate position, and start tracking</div>
                  </div>
                </button>

                <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: '#f0f0f0' }}>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl" aria-hidden>🏫</div>
                  <div className="text-left">
                    <div className="font-medium">Scott Lab</div>
                    <div className="text-sm text-gray-500">40.00245, -83.01426 — Open indoor map for Scott Lab</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: '#f0f0f0' }}>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl" aria-hidden>📅</div>
                  <div className="text-left">
                    <div className="font-medium">Class Schedule</div>
                    <div className="text-sm text-gray-500">Quick access to Scott Lab schedule and events</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="font-semibold">Campus Spotlight</h3>
              <p className="text-sm text-gray-600 mt-2">Featured location: Scott Laboratory. Use indoor navigation for floor plans and real-time tracking inside the building.</p>

              <div className="mt-4 flex gap-3">
                <button onClick={() => onNavigate && onNavigate('indoor-nav')} className="px-4 py-2 rounded-lg" style={{ background: OSU_SCARLET, color: '#fff' }}>Open Scott Lab Map</button>
                <button type="button" aria-label="View Scott Lab details" className="px-4 py-2 rounded-lg" style={{ border: '1px solid #eee', background: 'transparent' }}>View Details</button>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside>
            <div className="bg-white rounded-2xl p-6 shadow space-y-4">
              <h4 className="font-semibold">Status</h4>
              <div className="text-sm text-gray-600">Indoor positioning: <strong>Calibrated</strong></div>
              <div className="text-sm text-gray-600">Outdoor GPS: <strong>Available</strong></div>

              <div className="pt-2">
                <h5 className="font-medium">Quick Links</h5>
                <div className="mt-2 flex flex-col gap-2">
                  <button onClick={() => onNavigate && onNavigate('outdoor-map')} className="text-left px-3 py-2 rounded-lg" style={{ border: '1px solid #f0f0f0' }}>Open Outdoor Map</button>
                  <button onClick={() => onNavigate && onNavigate('indoor-nav')} className="text-left px-3 py-2 rounded-lg" style={{ border: '1px solid #f0f0f0' }}>Open Indoor Navigator</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
