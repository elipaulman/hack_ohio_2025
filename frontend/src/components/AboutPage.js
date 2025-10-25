import React from 'react';

function AboutPage() {
  const teamMembers = ['Elijah Paulman', 'Caue Faria', 'Arnac Chennamaneni', 'Artur Ulsenheimer'];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main content */}
          <section className="flex-1 space-y-6">

            {/* Hero Card */}
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: "url('/assets/scott-lab-basement.png')" }}
              />
              <div className="p-6">
                <h1 className="text-3xl font-semibold mb-2">About Our Project</h1>
                <p className="text-gray-600">A lightweight, sensor-driven indoor navigation PWA built for HackOHI/O 2025.</p>
              </div>
            </div>

            {/* Indoor Navigation */}
            <article className="bg-white rounded-2xl shadow overflow-hidden p-6 hover:shadow-lg transition-shadow duration-200">
              <h2 className="text-xl font-semibold mb-3">Indoor Navigation System</h2>
              <p className="text-gray-700 mb-3">
                Built for the Friction Finder Challenge by Honda, this app addresses navigation friction inside large
                buildings like Scott Laboratory by leveraging device sensors instead of additional infrastructure.
              </p>
              <p className="text-gray-700">
                It combines step detection, heading fusion, and dead-reckoning to provide a responsive, privacy-conscious
                indoor positioning experience — all within a progressive web app.
              </p>
            </article>

            {/* How It Works */}
            <article className="bg-white rounded-2xl shadow overflow-hidden p-6 hover:shadow-lg transition-shadow duration-200">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              <ul className="space-y-4 text-gray-700">
                {[
                  { title: 'Step Detection', description: 'Detects steps using accelerometer patterns with adaptive thresholds.', color: 'text-blue-500', icon: 'M9 12l2 2 4-4' },
                  { title: 'Heading Fusion', description: 'Combines gyroscope and compass readings to stabilize direction estimates.', color: 'text-indigo-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z M12 14v7' },
                  { title: 'Dead Reckoning', description: 'Computes relative position from step count and heading with occasional recalibration.', color: 'text-green-500', icon: 'M3 10h4l3 8 4-16 3 8h4' },
                  { title: 'Calibration', description: 'Periodic recalibration to limit drift and improve long-term accuracy.', color: 'text-yellow-500', icon: 'M13 16h-1v-4h-1m1-4h.01M12 20h.01' },
                ].map(({ title, description, color, icon }) => (
                  <li key={title} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-1`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {icon.split(' ').map((d, i) => (
                          <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                        ))}
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="text-sm text-gray-600">{description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            {/* Team */}
            <article className="bg-white rounded-2xl shadow overflow-hidden p-6 hover:shadow-lg transition-shadow duration-200">
              <h2 className="text-xl font-semibold mb-4">Team</h2>
              <div className="grid grid-cols-2 gap-4">
                {teamMembers.map((name) => (
                  <div key={name} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-bold">
                      {name.split(' ')[0][0]}
                    </div>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-500">Contributor</div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

          </section>

          {/* Sidebar */}
          <aside className="w-full lg:w-96 flex-shrink-0 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url('/assets/scott-lab-sidebar.png')" }} />
              <div className="p-4">
                <h4 className="text-xl font-semibold mb-1">Technology Stack</h4>
                <p className="text-sm text-gray-600 mb-3">Core tools powering the project</p>
                <div className="flex flex-wrap gap-2">
                  {['React', 'JavaScript', 'Canvas', 'Device Sensors', 'PWA'].map((tech) => (
                    <span key={tech} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{tech}</span>
                  ))}
                </div>
                <div className="mt-4">
                  <h5 className="font-semibold mb-1">Project Links</h5>
                  <div className="flex flex-col gap-2">
                    <a className="text-sm text-indigo-600 hover:underline" href="https://github.com/elipaulman/hack_ohio_2025">GitHub Repository</a>
                    <a className="text-sm text-indigo-600 hover:underline" href="/manifest.json">PWA Manifest</a>
                    <a className="text-sm text-indigo-600 hover:underline" href="/README.md">Project README</a>
                  </div>
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
