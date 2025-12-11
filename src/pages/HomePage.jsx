import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Link
            to="/parser"
            className="group bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center !p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                Арифметический парсер
              </h2>
              <div className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                Перейти к парсеру
              </div>
            </div>
          </Link>

          <Link
            to="/automata"
            className="group bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center !p-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                Минимизация автоматов
              </h2>
              <div className="inline-flex items-center text-purple-600 font-semibold group-hover:text-purple-700 transition-colors">
                Перейти к минимизации
              </div>
            </div>
          </Link>

          <Link
              to="/dmpautomatics"
              className="group bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center !p-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">

                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8V5a2 2 0 012-2h8a2 2 0 012 2v3" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21v-2a1 1 0 011-1h2a1 1 0 011 1v2" />
                </svg>

              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                ДМП-автомат
              </h2>
              <div className="inline-flex items-center text-orange-700 font-semibold group-hover:text-orange-700 transition-colors">
                Перейти к дмп-автомату
              </div>
            </div>
          </Link>

          <Link
              to="/conrpn"
              className="group bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center !p-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-200 transition-colors">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l3 3m-6 0l3-3M12 19a2 2 0 100-4 2 2 0 000 4z" />
                  <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="9" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                МП-преобразователь
              </h2>
              <div className="inline-flex items-center text-indigo-700 font-semibold group-hover:text-indigo-700  transition-colors">
                для перевода в ОПЗ
              </div>
            </div>
          </Link>

          <Link
            to="/rgr"
            className="group bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="text-center !p-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-rose-200 transition-colors">
                <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.5" y="5" width="7" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M4 7.5h4M4 10h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  <rect x="14.5" y="5" width="7" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M16 10.5h4M16 8h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  <path d="M10.5 10.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                  <path d="M13.5 10.5l-1.2-1.2M13.5 10.5l-1.2 1.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                  <path d="M8 18h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-rose-600 transition-colors">
                Транслятор
              </h2>
              <div className="inline-flex items-center text-rose-700 font-semibold group-hover:text-rose-700  transition-colors">
                Транслятор простого языка в HTML
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  )
}

export default HomePage
