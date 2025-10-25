import React from 'react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About Our Project</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Indoor Navigation System</h2>
            <p className="text-gray-700 mb-4">
              This project was developed for HackOHI/O 2025 as a solution to the Friction Finder Challenge by Honda.
              We identified indoor navigation as a major friction point in large buildings like Scott Laboratory.
            </p>
            <p className="text-gray-700 mb-4">
              Our solution uses device sensors (accelerometer, gyroscope, and compass) to track user position in real-time
              without requiring any additional infrastructure like WiFi beacons or Bluetooth transmitters.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span><strong>Step Detection:</strong> Advanced algorithms detect your steps using accelerometer data</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span><strong>Heading Fusion:</strong> Combines compass and gyroscope data for accurate direction</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span><strong>Dead Reckoning:</strong> Calculates position based on step count and direction</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-2">•</span>
                <span><strong>Calibration:</strong> Regular recalibration ensures accuracy over time</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-gray-700">
                <p className="font-semibold">Elijah Paulman</p>
              </div>
              <div className="text-gray-700">
                <p className="font-semibold">Caue Faria</p>
              </div>
              <div className="text-gray-700">
                <p className="font-semibold">Arnac Chennamaneni</p>
              </div>
              <div className="text-gray-700">
                <p className="font-semibold">Artur Ulsenheimer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">React</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">JavaScript</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">HTML5 Canvas</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Device Sensors API</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">PWA</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AboutPage;
