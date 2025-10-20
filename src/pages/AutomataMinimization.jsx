import { useState } from 'react'
import { FiniteAutomaton, createAutomatonFromMathNotation, createExampleNFA } from '../utils/automata'
import AutomataGraph from '../components/AutomataGraph'

function AutomataMinimization() {
  const [inputMath, setInputMath] = useState('')
  const [automaton, setAutomaton] = useState(null)
  const [minimizedAutomaton, setMinimizedAutomaton] = useState(null)
  const [isDeterministic, setIsDeterministic] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [stepByStepProcess, setStepByStepProcess] = useState([])

  const exampleAutomaton = 'M=({q0, q1, q2, q3, q4, q5}, {0,1}, δ, q0, {q4, q5})'

  const handleLoadExample = () => {
    setInputMath(exampleAutomaton)
  }

  const handleAnalyze = () => {
    try {
      const newAutomaton = createAutomatonFromMathNotation(inputMath)
      const validation = newAutomaton.validate()
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setAutomaton(null)
        setMinimizedAutomaton(null)
        setIsDeterministic(null)
        setStepByStepProcess([])
        return
      }

      setValidationErrors([])
      setAutomaton(newAutomaton)
      setIsDeterministic(newAutomaton.isDeterministic())
      
      // Минимизируем автомат
      const minimized = newAutomaton.minimize()
      setMinimizedAutomaton(minimized)
      
      // Создаем пошаговый процесс
      const steps = []
      steps.push({
        step: 1,
        title: 'Исходный автомат',
        description: 'Загруженный конечный автомат',
        automaton: newAutomaton
      })
      
      if (!newAutomaton.isDeterministic()) {
        steps.push({
          step: 2,
          title: 'Преобразование в ДКА',
          description: 'Недетерминированный автомат преобразован в детерминированный',
          automaton: newAutomaton.convertToDFA()
        })
      }
      
      steps.push({
        step: steps.length + 1,
        title: 'Минимизированный автомат',
        description: 'Результат применения алгоритма минимизации Хопкрофта',
        automaton: minimized
      })
      
      setStepByStepProcess(steps)
      
    } catch (error) {
      setValidationErrors([error.message])
      setAutomaton(null)
      setMinimizedAutomaton(null)
      setIsDeterministic(null)
      setStepByStepProcess([])
    }
  }

  const clearAll = () => {
    setInputMath('')
    setAutomaton(null)
    setMinimizedAutomaton(null)
    setIsDeterministic(null)
    setValidationErrors([])
    setStepByStepProcess([])
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center mx-auto p-6 gap-4 bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Минимизация конечных автоматов
        </h1>
        
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-gray-800">Ввод автомата</h2>
            <div className="">
              <textarea
                value={inputMath}
                onChange={(e) => setInputMath(e.target.value)}
                className="w-full h-32 !p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="M=({q0, q1, q2}, {0,1}, δ, q0, {q2})"
              />
              <p className="text-xs text-gray-500">
                💡 Введите только определение автомата. Программа автоматически создаст переходы для демонстрации алгоритма минимизации.
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLoadExample}
                className="px-4 py-2 !p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Загрузить пример (ДКА)
              </button>
              <button
                onClick={() => setInputMath('M=({q0, q1, q2, q3}, {a,b}, δ, q0, {q3})')}
                className="px-4 py-2 !p-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                Загрузить пример (НКА)
              </button>
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 !p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                disabled={!inputMath.trim()}
              >
                Анализировать
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 !p-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center !space-y-4">
        {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md !p-4">
              <h3 className="text-red-800 font-semibold mb-2">Ошибки валидации:</h3>
              <ul className="text-red-700 text-sm !space-y-1">
                {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
        )}

        {isDeterministic !== null && (
            <div className={`border rounded-md !p-4 ${
                isDeterministic ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                  isDeterministic ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Детерминированность:
              </h3>
              <p className={`text-sm ${
                  isDeterministic ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {isDeterministic
                    ? '✅ Автомат является детерминированным (ДКА)'
                    : '⚠️ Автомат является недетерминированным (НКА) - будет преобразован в ДКА перед минимизацией'
                }
              </p>
            </div>
        )}

        <div className="flex flex-row gap-4">
          {automaton && (
              <div className="bg-blue-50 border border-blue-200 rounded-md !p-4">
                <h3 className="text-blue-800 font-semibold mb-2">Исходный автомат:</h3>
                <div className="text-sm text-blue-700 font-mono whitespace-pre-line">
                  {automaton.toString()}
                </div>
              </div>
          )}

          {minimizedAutomaton && (
              <div className="bg-purple-50 border border-purple-200 rounded-md !p-4">
                <h3 className="text-purple-800 font-semibold mb-2">Минимизированный автомат:</h3>
                <div className="text-sm text-purple-700 font-mono whitespace-pre-line">
                  {minimizedAutomaton.toString()}
                </div>
              </div>
          )}
        </div>
      </div>

      {stepByStepProcess.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg !p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Пошаговый процесс минимизации</h2>

            <div className="flex flex-row items-start justify-center gap-2 !space-y-6">
              {stepByStepProcess.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg !p-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                        {step.step}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <div className="bg-gray-50 rounded-md p-3">
                      <div className="text-sm font-mono whitespace-pre-line">
                        {step.automaton.toString()}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
      )}

      {automaton && (
          <div className="bg-white rounded-lg shadow-lg !p-6 mt-6 !space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Визуализация автоматов</h2>

            {minimizedAutomaton && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg !p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Результат минимизации</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{automaton.states.length}</div>
                      <div className="text-blue-700">Исходных состояний</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{minimizedAutomaton.states.length}</div>
                      <div className="text-green-700">После минимизации</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((1 - minimizedAutomaton.states.length / automaton.states.length) * 100)}%
                      </div>
                      <div className="text-purple-700">Сокращение</div>
                    </div>
                  </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutomataGraph
                  automaton={automaton}
                  title={`Исходный автомат (${automaton.states.length} состояний)`}
              />

              {minimizedAutomaton && (
                  <AutomataGraph
                      automaton={minimizedAutomaton}
                      title={`Минимизированный автомат (${minimizedAutomaton.states.length} состояний)`}
                      isMinimized={true}
                  />
              )}
            </div>

            {!isDeterministic && automaton && (
                <div className="mt-6">
                  <AutomataGraph
                      automaton={automaton.convertToDFA()}
                      title={`ДКА после преобразования из НКА (${automaton.convertToDFA().states.length} состояний)`}
                  />
                </div>
            )}
          </div>
      )}

      <div className="!p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Формат ввода автомата</h2>
        <div className="text-sm text-gray-700 !space-y-2">
          <p>Введите только определение автомата в математической нотации. Программа автоматически сгенерирует переходы:</p>
          <pre className="bg-white !p-4 rounded border text-xs overflow-x-auto">
            {`M=({q0, q1, q2, q3, q4, q5}, {0,1}, δ, q0, {q4, q5})`}
          </pre>
          <ul className="list-disc list-inside !space-y-1 ml-4">
            <li><strong>M=(&#123;состояния&#125;, &#123;алфавит&#125;, δ, начальное, &#123;финальные&#125;)</strong> - определение автомата</li>
            <li><strong>Состояния</strong> - список состояний через запятую: <code>q0, q1, q2</code></li>
            <li><strong>Алфавит</strong> - символы входного алфавита: <code>0, 1</code> или <code>a, b</code></li>
            <li><strong>Начальное состояние</strong> - одно из состояний: <code>q0</code></li>
            <li><strong>Финальные состояния</strong> - одно или несколько состояний: <code>q2</code> или <code>q4, q5</code></li>
            <li><strong>Переходы генерируются автоматически</strong> - программа создает случайные переходы для демонстрации</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AutomataMinimization
