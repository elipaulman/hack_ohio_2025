import React from 'react';

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content (left) */}
          <section className="flex-1">
            <h1 className="text-3xl font-semibold mb-4">Explore great places</h1>
            <p className="text-gray-600 mb-6">Discover recommended hotels, categories and suggestions curated for you.</p>

            <h3 className="font-semibold mb-3">Recommended Hotels</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <article className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/reserve/8T8J12VQxyqCiQFGa2ct_bahamas-atlantis.jpg?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80')" }} />
                <div className="p-4">
                  <h4 className="text-lg font-semibold">Loremipsum..</h4>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>4.5</div>
                    <div className="font-medium">$1800 <span className="text-gray-400 text-sm">/wk</span></div>
                  </div>
                </div>
              </article>

              <article className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80')" }} />
                <div className="p-4">
                  <h4 className="text-lg font-semibold">Loremipsum..</h4>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>4.5</div>
                    <div className="font-medium">$1800 <span className="text-gray-400 text-sm">/wk</span></div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* Sidebar card (right) */}
          <aside className="w-full lg:w-96">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden">
              <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1622180203374-9524a54b734d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }} />
              <div className="p-4">
                <h4 className="text-xl font-semibold">Loremipsum Title</h4>
                <p className="text-sm text-gray-600">Massive Dynamic</p>

                <div className="mt-4">
                  <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Search something..." />
                </div>

                <div className="mt-6">
                  <h5 className="font-semibold mb-2">Category</h5>
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-green-100 rounded-2xl text-green-600 p-2">Hotel</div>
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-yellow-100 rounded-2xl text-yellow-600 p-2">Bus</div>
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-indigo-100 rounded-2xl text-indigo-600 p-2">Hills</div>
                    <div className="flex flex-col items-center justify-center w-20 h-20 bg-pink-100 rounded-2xl text-pink-600 p-2">Beach</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-semibold mb-2">Suggested By</h5>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
                    <img className="w-12 h-12 rounded-lg object-cover" src="https://images.unsplash.com/photo-1439130490301-25e322d88054?ixlib=rb-1.2.1&auto=format&fit=crop&w=1189&q=80" alt="suggested" />
                    <div>
                      <div className="font-medium">Massive Dynamic</div>
                      <div className="text-sm text-gray-500">4.5 • $1800/wk</div>
                    </div>
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

export default HomePage;
