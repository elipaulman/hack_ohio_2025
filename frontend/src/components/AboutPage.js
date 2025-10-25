import React from 'react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main content */}
          <section className="flex-1">
            {/* Hero card to match HomePage visual style */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('/assets/scott-lab-basement.png')" }} />
              <div className="p-6">
                <h1 className="text-3xl font-semibold mb-2">About Our Project</h1>
                <p className="text-gray-600">A lightweight, sensor-driven indoor navigation PWA built for HackOHI/O 2025.</p>
              </div>
            </div>

            <article className="bg-white rounded-2xl shadow p-6 mb-6">
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

            <article className="bg-white rounded-2xl shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Step Detection</div>
                    <div className="text-sm text-gray-600">Detects steps using accelerometer patterns with adaptive thresholds.</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Heading Fusion</div>
                    <div className="text-sm text-gray-600">Combines gyroscope and compass readings to stabilize direction estimates.</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 8 4-16 3 8h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Dead Reckoning</div>
                    <div className="text-sm text-gray-600">Computes relative position from step count and heading with occasional recalibration.</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-yellow-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Calibration</div>
                    <div className="text-sm text-gray-600">Periodic recalibration to limit drift and improve long-term accuracy.</div>
                  </div>
                </li>
              </ul>
            </article>

            <article className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Team</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                {['Elijah Paulman', 'Caue Faria', 'Arnac Chennamaneni', 'Artur Ulsenheimer'].map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-semibold">
                      {name.split(' ')[0].slice(0, 1)}
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
          <aside className="w-full lg:w-96">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-3">Technology Stack</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">React</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">JavaScript</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">Canvas</span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Device Sensors</span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">PWA</span>
                </div>

                <h4 className="font-semibold mb-2">Project Links</h4>
                <div className="flex flex-col gap-2">
                  <a className="text-sm text-indigo-600 hover:underline" href="https://github.com/elipaulman/hack_ohio_2025">GitHub Repository</a>
                  <a className="text-sm text-indigo-600 hover:underline" href="/manifest.json">PWA Manifest</a>
                  <a className="text-sm text-indigo-600 hover:underline" href="/README.md">Project README</a>
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
