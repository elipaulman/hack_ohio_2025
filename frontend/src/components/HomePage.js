import React from 'react';
import {
  MapPin,
  Map,
  ParkingSquare,
  Calendar,
  Navigation,
  Rocket,
  Info,
  CheckCircle,
  Activity,
  Footprints,
  Lock,
  Smartphone,
  ArrowRight
} from 'lucide-react';

const OSU_SCARLET = '#BB0000';
const OSU_GRAY = '#666666';

function HomePage({ onNavigate }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #fafafa 0%, #f0f0f0 100%)', color: OSU_GRAY }}>
      <main className="container mx-auto px-4 py-6 md:py-12 max-w-7xl">

        {/* Hero Section - Professional Design */}
        <header className="relative rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12" style={{
          background: `linear-gradient(135deg, ${OSU_SCARLET} 0%, #CC0000 50%, #990000 100%)`,
          boxShadow: '0 20px 60px rgba(187, 0, 0, 0.3)'
        }}>
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
          }} />

          <div className="relative p-8 md:p-12 pb-16 md:pb-12 text-white">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-block px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-xs md:text-sm font-semibold">Your Complete Campus Navigation Solution</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                From Your Driveway to Your Classroom
              </h1>

              <p className="text-base md:text-lg lg:text-xl opacity-95 leading-relaxed mb-8 max-w-3xl mx-auto">
                The only navigation app you need at Ohio State. Find parking, navigate across campus, and locate your exact room — all in one place.
              </p>

              {/* Journey Steps - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                  <div className="mb-2 flex justify-center">
                    <ParkingSquare size={40} strokeWidth={2.5} />
                  </div>
                  <div className="font-bold text-sm md:text-base mb-1">1. Find Parking</div>
                  <div className="text-xs md:text-sm opacity-90">Open garage locations</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                  <div className="mb-2 flex justify-center">
                    <Map size={40} strokeWidth={2.5} />
                  </div>
                  <div className="font-bold text-sm md:text-base mb-1">2. Walk to Building</div>
                  <div className="text-xs md:text-sm opacity-90">Outdoor navigation</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                  <div className="mb-2 flex justify-center">
                    <MapPin size={40} strokeWidth={2.5} />
                  </div>
                  <div className="font-bold text-sm md:text-base mb-1">3. Find Your Room</div>
                  <div className="text-xs md:text-sm opacity-90">Indoor positioning</div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onNavigate('outdoor-map')}
                  className="group relative overflow-hidden px-10 py-5 rounded-xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: '#ffffff',
                    color: OSU_SCARLET,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Rocket size={24} strokeWidth={2.5} />
                    <span>Start Navigating Now</span>
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('about')}
                  className="group px-10 py-5 rounded-xl font-bold text-base md:text-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Info size={24} strokeWidth={2.5} />
                    <span>Learn More</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Wave Decoration */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '40px', background: 'rgba(255,255,255,0.05)' }}>
            <svg className="absolute bottom-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ width: '100%', height: '40px' }}>
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="rgba(255,255,255,0.3)"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="rgba(255,255,255,0.2)"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="rgba(255,255,255,0.1)"></path>
            </svg>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Quick Actions Section */}
          <section className="lg:col-span-2 space-y-6 md:space-y-8">

            {/* Complete Journey Section */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8" style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
            }}>
              <div className="mb-6 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: OSU_SCARLET }}>
                  Your Complete Journey
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  Navigate seamlessly from parking to your destination room
                </p>
              </div>

              {/* Journey Steps - Vertical on Mobile */}
              <div className="space-y-4 md:space-y-6">

                {/* Step 1: Find Parking */}
                <button
                  onClick={() => onNavigate('garages')}
                  className="group w-full relative overflow-hidden p-6 md:p-8 rounded-2xl transition-all duration-300 hover:scale-102 active:scale-98 text-left"
                  style={{
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                    border: '3px solid #DDD6FE',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
                  }}
                >
                  <div className="relative z-10 flex items-center gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                      }}>
                        <ParkingSquare size={40} strokeWidth={2.5} color="#ffffff" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs md:text-sm font-bold text-purple-600 mb-1">STEP 1</div>
                      <h3 className="font-bold text-xl md:text-2xl mb-2 text-gray-900">Find Open Parking</h3>
                      <p className="text-sm md:text-base text-gray-700">
                        Locate available parking garages near your destination building
                      </p>
                    </div>
                    <div className="hidden md:block opacity-20">
                      <ArrowRight size={40} />
                    </div>
                  </div>
                </button>

                {/* Step 2: Navigate to Building */}
                <button
                  onClick={() => onNavigate('outdoor-map')}
                  className="group w-full relative overflow-hidden p-6 md:p-8 rounded-2xl transition-all duration-300 hover:scale-102 active:scale-98 text-left"
                  style={{
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                    border: '3px solid #FECACA',
                    boxShadow: '0 4px 20px rgba(187, 0, 0, 0.15)'
                  }}
                >
                  <div className="relative z-10 flex items-center gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center" style={{
                        background: `linear-gradient(135deg, ${OSU_SCARLET} 0%, #990000 100%)`,
                        boxShadow: '0 4px 15px rgba(187, 0, 0, 0.4)'
                      }}>
                        <Map size={40} strokeWidth={2.5} color="#ffffff" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs md:text-sm font-bold text-red-600 mb-1">STEP 2</div>
                      <h3 className="font-bold text-xl md:text-2xl mb-2 text-gray-900">Navigate to Your Building</h3>
                      <p className="text-sm md:text-base text-gray-700">
                        Follow outdoor navigation to walk from parking to your destination building
                      </p>
                    </div>
                    <div className="hidden md:block opacity-20">
                      <ArrowRight size={40} />
                    </div>
                  </div>
                </button>

                {/* Step 3: Find Your Room */}
                <button
                  onClick={() => onNavigate('indoor-nav')}
                  className="group w-full relative overflow-hidden p-6 md:p-8 rounded-2xl transition-all duration-300 hover:scale-102 active:scale-98 text-left"
                  style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '3px solid #BFDBFE',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)'
                  }}
                >
                  <div className="relative z-10 flex items-center gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                      }}>
                        <MapPin size={40} strokeWidth={2.5} color="#ffffff" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs md:text-sm font-bold text-blue-600 mb-1">STEP 3</div>
                      <h3 className="font-bold text-xl md:text-2xl mb-2 text-gray-900">Find Your Specific Room</h3>
                      <p className="text-sm md:text-base text-gray-700">
                        Use indoor navigation with real-time positioning to locate your exact room
                      </p>
                    </div>
                    <div className="hidden md:block opacity-20">
                      <ArrowRight size={40} />
                    </div>
                  </div>
                </button>

              </div>

              {/* Additional Feature */}
              <div className="mt-6 p-5 rounded-xl" style={{ background: '#F9FAFB', border: '2px dashed #E5E7EB' }}>
                <div className="flex items-center gap-3">
                  <Calendar size={32} strokeWidth={2} color={OSU_GRAY} />
                  <div className="flex-1">
                    <button
                      onClick={() => onNavigate('schedule')}
                      className="font-semibold text-gray-900 hover:underline text-left"
                    >
                      Plus: View Class Schedules
                    </button>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      Check room availability and class times at Scott Lab
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Featured Location Card */}
            <div className="relative overflow-hidden bg-white rounded-2xl md:rounded-3xl p-6 md:p-8" style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
            }}>
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{
                background: `radial-gradient(circle, ${OSU_SCARLET} 0%, transparent 70%)`
              }} />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                    background: `linear-gradient(135deg, ${OSU_SCARLET} 0%, #990000 100%)`,
                    boxShadow: '0 4px 20px rgba(187, 0, 0, 0.3)'
                  }}>
                    <Navigation size={28} strokeWidth={2.5} color="#ffffff" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Featured Building</div>
                    <h3 className="font-bold text-xl md:text-2xl text-gray-900">Scott Laboratory</h3>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl" style={{ background: '#F9FAFB' }}>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    Computer Science & Engineering building equipped with advanced indoor navigation.
                    Navigate multiple floors with real-time positioning and access up-to-date room schedules.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onNavigate('indoor-nav')}
                    className="flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${OSU_SCARLET} 0%, #990000 100%)`,
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(187, 0, 0, 0.3)'
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <MapPin size={20} strokeWidth={2.5} />
                      <span>Navigate Inside</span>
                    </span>
                  </button>
                  <button
                    onClick={() => onNavigate('schedule')}
                    className="flex-1 px-6 py-4 rounded-xl font-bold border-2 transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      background: 'white',
                      borderColor: '#E5E7EB',
                      color: OSU_GRAY
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Calendar size={20} strokeWidth={2.5} />
                      <span>View Schedule</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar - Info Cards */}
          <aside className="space-y-6 md:space-y-8">

            {/* System Status Card */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-7" style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
            }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)'
                }}>
                  <CheckCircle size={20} strokeWidth={2.5} color="#16A34A" />
                </div>
                <h4 className="font-bold text-lg md:text-xl text-gray-900">System Status</h4>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: '1px solid #BBF7D0'
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">Indoor Positioning</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                      <span className="text-xs font-bold text-green-700">Ready</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Sensor fusion active</p>
                </div>

                <div className="p-4 rounded-xl" style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: '1px solid #BBF7D0'
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">GPS Tracking</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                      <span className="text-xs font-bold text-green-700">Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Outdoor navigation enabled</p>
                </div>
              </div>
            </div>

            {/* Technology Features Card */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-7" style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
            }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)'
                }}>
                  <Activity size={20} strokeWidth={2.5} color="#2563EB" />
                </div>
                <h4 className="font-bold text-lg md:text-xl text-gray-900">Key Features</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                  }}>
                    <Navigation size={18} strokeWidth={2.5} color="#DC2626" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">Sensor Fusion</div>
                    <div className="text-xs text-gray-600 mt-0.5">Real-time position tracking</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)'
                  }}>
                    <Footprints size={18} strokeWidth={2.5} color="#2563EB" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">Step Detection</div>
                    <div className="text-xs text-gray-600 mt-0.5">Accurate movement analysis</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
                  }}>
                    <Lock size={18} strokeWidth={2.5} color="#CA8A04" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">Privacy First</div>
                    <div className="text-xs text-gray-600 mt-0.5">No infrastructure required</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)'
                  }}>
                    <Smartphone size={18} strokeWidth={2.5} color="#4F46E5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">Progressive Web App</div>
                    <div className="text-xs text-gray-600 mt-0.5">Install on any device</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-7" style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
            }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                }}>
                  <Info size={20} strokeWidth={2.5} color="#DC2626" />
                </div>
                <h4 className="font-bold text-lg md:text-xl text-gray-900">Learn More</h4>
              </div>

              <button
                onClick={() => onNavigate('about')}
                className="w-full p-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${OSU_SCARLET} 0%, #990000 100%)`,
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(187, 0, 0, 0.2)'
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Info size={20} strokeWidth={2.5} />
                  <span>About This Project</span>
                </span>
              </button>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
