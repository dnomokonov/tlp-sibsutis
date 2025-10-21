import { useState } from 'react'
import { FiniteAutomaton, createAutomatonFromMathNotation, createAutomatonFromDefinitionAndTransitions, createExampleNFA, createComplexNFA } from '../utils/automata'
import AutomataGraph from '../components/AutomataGraph'

function AutomataMinimization() {
  const [inputMath, setInputMath] = useState('')
  const [inputTransitions, setInputTransitions] = useState('')
  const [automaton, setAutomaton] = useState(null)
  const [minimizedAutomaton, setMinimizedAutomaton] = useState(null)
  const [dfaAutomaton, setDfaAutomaton] = useState(null)
  const [isDeterministic, setIsDeterministic] = useState(null)
  const [isNFA, setIsNFA] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [stepByStepProcess, setStepByStepProcess] = useState([])

  const exampleAutomaton = 'M=({q0, q1, q2, q3, q4, q5}, {0,1}, δ, q0, {q4, q5})'
  const exampleTransitions = [
    'δ(q0, 0) = q1',
    'δ(q0, 1) = q2',
    'δ(q1, 0) = q3',
    'δ(q1, 1) = q4',
    'δ(q2, 0) = q4',
    'δ(q2, 1) = q5',
    'δ(q3, 0) = q3',
    'δ(q3, 1) = q4',
    'δ(q4, 0) = q4',
    'δ(q4, 1) = q5',
    'δ(q5, 0) = q5',
    'δ(q5, 1) = q5'
  ].join('\n')

  const handleLoadExample = () => {
    setInputMath(exampleAutomaton)
    setInputTransitions(exampleTransitions)
  }

  const handleLoadNFAExample = () => {
    const nfaExample = createExampleNFA()
    const nfaMath = `M=({${nfaExample.states.join(', ')}}, {${nfaExample.alphabet.join(', ')}}, δ, ${nfaExample.startState}, {${nfaExample.finalStates.join(', ')}})`

    // Создаем текстовое представление переходов
    const nfaTransitions = []
    for (const state in nfaExample.transitions) {
      for (const symbol in nfaExample.transitions[state]) {
        const targets = nfaExample.transitions[state][symbol]
        if (targets.length > 0) {
          nfaTransitions.push(`${state} ${symbol} ${targets.join(', ')}`)
        }
      }
    }

    setInputMath(nfaMath)
    setInputTransitions(nfaTransitions.join('\n'))
  }


  const handleLoadComplexNFAExample = () => {
    const nfaExample = createComplexNFA()
    const nfaMath = `M=({${nfaExample.states.join(', ')}}, {${nfaExample.alphabet.join(', ')}}, δ, ${nfaExample.startState}, {${nfaExample.finalStates.join(', ')}})`

    // Создаем текстовое представление переходов
    const nfaTransitions = []
    for (const state in nfaExample.transitions) {
      for (const symbol in nfaExample.transitions[state]) {
        const targets = nfaExample.transitions[state][symbol]
        if (targets.length > 0) {
          nfaTransitions.push(`${state} ${symbol} ${targets.join(', ')}`)
        }
      }
    }

    setInputMath(nfaMath)
    setInputTransitions(nfaTransitions.join('\n'))
  }

  const handleAnalyze = () => {
    try {
      const hasTransitions = inputTransitions && inputTransitions.trim().length > 0
      const newAutomaton = hasTransitions
        ? createAutomatonFromDefinitionAndTransitions(inputMath, inputTransitions)
        : createAutomatonFromMathNotation(inputMath)
      const validation = newAutomaton.validate()
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setAutomaton(null)
        setMinimizedAutomaton(null)
        setDfaAutomaton(null)
        setIsDeterministic(null)
        setIsNFA(null)
        setStepByStepProcess([])
        return
      }

      setValidationErrors([])
      setAutomaton(newAutomaton)
      const isDet = newAutomaton.isDeterministic()
      const isNFAValue = newAutomaton.isNFA()
      setIsDeterministic(isDet)
      setIsNFA(isNFAValue)

      const steps = []
      let dfaAutomaton = null
      let minimizedAutomaton = null

      if (isNFAValue) {
        // Если это НКА, преобразуем в ДКА
        dfaAutomaton = newAutomaton.convertToDFA()
        setDfaAutomaton(dfaAutomaton)
        
        // Затем минимизируем ДКА
        minimizedAutomaton = dfaAutomaton.minimize()
        setMinimizedAutomaton(minimizedAutomaton)

        steps.push({
          step: 1,
          title: 'Исходный НКА',
          description: 'Загруженный недетерминированный конечный автомат',
          automaton: newAutomaton
        })
        
        steps.push({
          step: 2,
          title: 'Преобразованный ДКА',
          description: 'Результат преобразования НКА в ДКА',
          automaton: dfaAutomaton
        })
        
        steps.push({
          step: 3,
          title: 'Минимизированный ДКА',
          description: 'Результат минимизации ДКА',
          automaton: minimizedAutomaton
        })
      } else {
        // Если это ДКА, просто минимизируем (без преобразования)
        minimizedAutomaton = newAutomaton.minimize()
        setMinimizedAutomaton(minimizedAutomaton)
        setDfaAutomaton(null) // Убеждаемся, что ДКА не преобразуется

        steps.push({
          step: 1,
          title: 'Исходный ДКА',
          description: 'Загруженный детерминированный конечный автомат',
          automaton: newAutomaton
        })
        
        steps.push({
          step: 2,
          title: 'Минимизированный ДКА',
          description: 'Результат применения алгоритма минимизации Хопкрофта',
          automaton: minimizedAutomaton
        })
      }
      
      setStepByStepProcess(steps)
      
    } catch (error) {
      setValidationErrors([error.message])
      setAutomaton(null)
      setMinimizedAutomaton(null)
      setDfaAutomaton(null)
      setIsDeterministic(null)
      setIsNFA(null)
      setStepByStepProcess([])
    }
  }

  const clearAll = () => {
    setInputMath('')
    setInputTransitions('')
    setAutomaton(null)
    setMinimizedAutomaton(null)
    setDfaAutomaton(null)
    setIsDeterministic(null)
    setIsNFA(null)
    setValidationErrors([])
    setStepByStepProcess([])
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center mx-auto p-6 gap-4 bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Преобразование НКА в ДКА и минимизация
        </h1>
        
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-gray-800">Ввод автомата</h2>
            <div className="!mb-2">
              <textarea
                value={inputMath}
                onChange={(e) => setInputMath(e.target.value)}
                className="w-full h-32 !p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="M=({q0, q1, q2}, {0,1}, δ, q0, {q2})"
              />
              <p className="text-xs text-gray-500">
                💡 Введите определение автомата. Ниже вы можете явно задать таблицу переходов (опционально).
              </p>
            </div>

            <div className="!mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Таблица переходов (опционально)</label>
              <textarea
                value={inputTransitions}
                onChange={(e) => setInputTransitions(e.target.value)}
                className="w-full h-40 !p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder={"Примеры форматов строк:\nδ(q0, 0) = q1\nq0, 1 -> q2\nq1 0 q3\nq2,1=q5\nq3, 1 = {q4}"}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Для НКА допускаются множественные переходы: <span className="font-mono bg-gray-100 px-1 rounded">q0 a q1, q2</span> или <span className="font-mono bg-gray-100 px-1 rounded">δ(q0, a) = &#123;q1, q2&#125;</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleLoadExample}
                className="px-4 py-2 !p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Пример ДКА
              </button>
              <button
                onClick={handleLoadNFAExample}
                className="px-4 py-2 !p-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Пример НКА
              </button>
              <button
                onClick={handleLoadComplexNFAExample}
                className="px-4 py-2 !p-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                Сложный НКА
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
                 isDeterministic ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
             }`}>
               <h3 className={`font-semibold mb-2 ${
                   isDeterministic ? 'text-green-800' : 'text-orange-800'
               }`}>
                 Тип автомата:
               </h3>
               <p className={`text-sm ${
                   isDeterministic ? 'text-green-700' : 'text-orange-700'
               }`}>
                 {isDeterministic
                     ? '✅ Детерминированный конечный автомат (ДКА) - готов к минимизации'
                     : '🔄 Недетерминированный конечный автомат (НКА) - будет преобразован в ДКА'
                 }
               </p>
             </div>
         )}

        <div className="flex flex-row gap-4 flex-wrap">
          {automaton && (
              <div className="bg-blue-50 border border-blue-200 rounded-md !p-4">
                <h3 className="text-blue-800 font-semibold mb-2">
                  {isNFA ? 'Исходный НКА:' : 'Исходный ДКА:'}
                </h3>
                <div className="text-sm text-blue-700 font-mono whitespace-pre-line">
                  {automaton.toString()}
                </div>
              </div>
          )}

          {dfaAutomaton && (
              <div className="bg-green-50 border border-green-200 rounded-md !p-4">
                <h3 className="text-green-800 font-semibold mb-2">Преобразованный ДКА:</h3>
                <div className="text-sm text-green-700 font-mono whitespace-pre-line">
                  {dfaAutomaton.toString()}
                </div>
              </div>
          )}

          {minimizedAutomaton && (
              <div className="bg-purple-50 border border-purple-200 rounded-md !p-4">
                <h3 className="text-purple-800 font-semibold mb-2">Минимизированный ДКА:</h3>
                <div className="text-sm text-purple-700 font-mono whitespace-pre-line">
                  {minimizedAutomaton.toString()}
                </div>
              </div>
          )}
        </div>
      </div>

      {stepByStepProcess.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg !p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {isNFA ? 'Пошаговый процесс преобразования НКА в ДКА и минимизации' : 'Пошаговый процесс минимизации ДКА'}
            </h2>

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

            <div className="flex flex-col items-center justify-center gap-2 !space-y-6">
              <AutomataGraph
                  automaton={automaton}
                  title={`${isNFA ? 'Исходный НКА' : 'Исходный ДКА'} (${automaton.states.length} состояний)`}
              />

              {dfaAutomaton && (
                  <AutomataGraph
                      automaton={dfaAutomaton}
                      title={`Преобразованный ДКА (${dfaAutomaton.states.length} состояний)`}
                      isConverted={true}
                  />
              )}

              {minimizedAutomaton && (
                  <AutomataGraph
                      automaton={minimizedAutomaton}
                      title={`Минимизированный ДКА (${minimizedAutomaton.states.length} состояний)`}
                      isMinimized={true}
                  />
              )}
            </div>

          </div>
      )}

      <div className="!p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Формат ввода автоматов</h2>
        <div className="text-sm text-gray-700 !space-y-2">
          <p>Введите определение конечного автомата (ДКА или НКА) в математической нотации. Программа поддерживает как детерминированные, так и недетерминированные автоматы:</p>
          <pre className="bg-white !p-4 rounded border text-xs overflow-x-auto">
            {`M=({q0, q1, q2, q3, q4, q5}, {0,1}, δ, q0, {q4, q5})`}
          </pre>
          <ul className="list-disc list-inside !space-y-1 ml-4">
            <li><strong>M=(&#123;состояния&#125;, &#123;алфавит&#125;, δ, начальное, &#123;финальные&#125;)</strong> - определение автомата</li>
            <li><strong>Состояния</strong> - список состояний через запятую: <span className="font-mono bg-gray-100 px-1 rounded">q0, q1, q2</span></li>
            <li><strong>Алфавит</strong> - символы входного алфавита: <span className="font-mono bg-gray-100 px-1 rounded">0, 1</span> или <span className="font-mono bg-gray-100 px-1 rounded">a, b</span> (для ε-переходов используйте <span className="font-mono bg-gray-100 px-1 rounded">ε</span>)</li>
            <li><strong>Начальное состояние</strong> - одно из состояний: <span className="font-mono bg-gray-100 px-1 rounded">q0</span></li>
            <li><strong>Финальные состояния</strong> - одно или несколько состояний: <span className="font-mono bg-gray-100 px-1 rounded">q2</span> или <span className="font-mono bg-gray-100 px-1 rounded">q4, q5</span></li>
            <li><strong>Переходы</strong> - можно задать явно в таблице переходов или сгенерировать автоматически</li>
            <li><strong>🔄 НКА → ДКА</strong> - недетерминированные автоматы автоматически преобразуются в ДКА</li>
            <li><strong>📉 Минимизация</strong> - полученный ДКА минимизируется для оптимального размера</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AutomataMinimization
