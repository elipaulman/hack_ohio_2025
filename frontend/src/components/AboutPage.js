import React from 'react';
import {
  Footprints,
  Compass,
  Route,
  Target,
  Rocket,
  Github,
  Smartphone,
  Settings,
  ClipboardList,
  Link
} from 'lucide-react';

const OSU_SCARLET = '#BB0000';

function AboutPage() {
  const teamMembers = [
    'Elijah Paulman',
    'Caue Faria',
    'Arnav Chennamaneni',
    'Artur Ulsenheimer'
  ];

  const features = [
    {
      title: 'Step Detection',
      description: 'Detects steps using accelerometer patterns with adaptive thresholds for accurate movement tracking.',
      Icon: Footprints,
      iconColor: '#DC2626',
      gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
    },
    {
      title: 'Heading Fusion',
      description: 'Combines gyroscope and compass readings to provide stable and accurate direction estimates.',
      Icon: Compass,
      iconColor: '#2563EB',
      gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
    },
    {
      title: 'Dead Reckoning',
      description: 'Computes relative position from step count and heading with periodic recalibration.',
      Icon: Route,
      iconColor: '#16A34A',
      gradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
    },
    {
      title: 'Real-Time Calibration',
      description: 'Periodic recalibration limits drift and improves long-term positioning accuracy.',
      Icon: Target,
      iconColor: '#CA8A04',
      gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
    }
  ];

  const technologies = [
    'React',
    'JavaScript',
    'Canvas API',
    'Device Sensors',
    'PWA',
    'Leaflet Maps'
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">

        {/* Hero Section */}
        <header className="rounded-xl md:rounded-2xl shadow-lg overflow-hidden mb-6 md:mb-8" style={{ background: `linear-gradient(135deg, ${OSU_SCARLET} 0%, #990000 100%)` }}>
          <div className="p-6 md:p-8 text-white">
            <h1 className="text-2xl md:text-4xl font-bold mb-3">About This Project</h1>
            <p className="text-sm md:text-lg opacity-95 leading-relaxed">
              A sensor-driven indoor navigation Progressive Web App built for HackOHI/O 2025
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <section className="lg:col-span-2 space-y-6">

            {/* Project Overview */}
            <article className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                  <Rocket size={28} strokeWidth={2.5} color="#DC2626" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Indoor Navigation System</h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">Built for the Friction Finder Challenge by Honda</p>
                </div>
              </div>

              <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-3">
                This application addresses navigation friction inside large buildings like Scott Laboratory by
                leveraging device sensors instead of requiring additional infrastructure.
              </p>

              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                It combines step detection, heading fusion, and dead-reckoning to provide a responsive,
                privacy-conscious indoor positioning experience — all within a Progressive Web App.
              </p>
            </article>

            {/* How It Works */}
            <article className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md">
              <h2 className="text-xl md:text-2xl font-bold mb-5 text-gray-900">How It Works</h2>

              <div className="space-y-4">
                {features.map((feature) => {
                  const IconComponent = feature.Icon;
                  return (
                    <div
                      key={feature.title}
                      className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-red-100 hover:bg-red-50 transition-all duration-200"
                    >
                      <div
                        className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: feature.gradient }}
                      >
                        <IconComponent size={28} strokeWidth={2.5} color={feature.iconColor} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base md:text-lg text-gray-900">{feature.title}</h3>
                        <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Team Section */}
            <article className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md">
              <h2 className="text-xl md:text-2xl font-bold mb-5 text-gray-900">The Team</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamMembers.map((name) => {
                  const initials = name.split(' ').map(n => n[0]).join('');
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-red-100 hover:bg-red-50 transition-all duration-200"
                    >
                      <div
                        className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center font-bold text-xl text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${OSU_SCARLET}, #990000)` }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">{name}</div>
                        <div className="text-xs text-gray-600">Developer</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

          </section>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Technology Stack */}
            <div className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
                  <Settings size={20} strokeWidth={2.5} color="#2563EB" />
                </div>
                <h3 className="font-bold text-lg md:text-xl text-gray-900">Technology Stack</h3>
              </div>

              <p className="text-xs md:text-sm text-gray-600 mb-4">Core technologies powering the project</p>

              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold"
                    style={{ background: '#fee2e2', color: '#991b1b' }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                  <ClipboardList size={20} strokeWidth={2.5} color="#CA8A04" />
                </div>
                <h3 className="font-bold text-lg md:text-xl text-gray-900">Project Details</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: '#f9fafb' }}>
                  <div className="text-xs text-gray-600 mb-1">Event</div>
                  <div className="text-sm font-semibold text-gray-900">HackOHI/O 2025</div>
                </div>

                <div className="p-3 rounded-lg" style={{ background: '#f9fafb' }}>
                  <div className="text-xs text-gray-600 mb-1">Challenge</div>
                  <div className="text-sm font-semibold text-gray-900">Friction Finder by Honda</div>
                </div>

                <div className="p-3 rounded-lg" style={{ background: '#f9fafb' }}>
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <div className="text-sm font-semibold text-gray-900">Progressive Web App</div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}>
                  <Link size={20} strokeWidth={2.5} color="#4F46E5" />
                </div>
                <h3 className="font-bold text-lg md:text-xl text-gray-900">Resources</h3>
              </div>

              <div className="space-y-2">
                <a
                  href="https://github.com/elipaulman/hack_ohio_2025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  style={{ border: '1px solid #f0f0f0' }}
                >
                  <Github size={20} strokeWidth={2} color={OSU_SCARLET} />
                  <span className="text-sm font-medium" style={{ color: OSU_SCARLET }}>GitHub Repository</span>
                </a>

                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ border: '1px solid #f0f0f0' }}>
                  <Smartphone size={20} strokeWidth={2} color="#666666" />
                  <span className="text-sm font-medium text-gray-700">Install as PWA</span>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </main>
    </div>
  );
}

export default AboutPage;
