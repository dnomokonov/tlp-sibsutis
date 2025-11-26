import {useState} from "react";
import {DMP} from "../utils/dmp.js";

function DMPautomaticPage() {
    const [pInput, setPInput] = useState('');
    const [stepFunction, setStepFunction] = useState('');

    const [strCheck, setStrCheck] = useState('');
    const [result, setResult] = useState(null);
    const [showSteps, setShowSteps] = useState(false);

    const handleCheck = () => {
        try {
            const { states, inputAlphabet, stackAlphabet, startState, startStackSymbol, acceptStates } = DMP.parse(pInput);
            const transitions = DMP.parseTransitions(stepFunction);
            const dmp = new DMP(states, inputAlphabet, stackAlphabet, transitions, startState, startStackSymbol, acceptStates);

            const { accepted, reason, history } = dmp.dmpStart(strCheck);

            setResult({ accepted, reason, history });
            setShowSteps(false);
        } catch (e) {
            setResult({ accepted: false, reason: `Ошибка парсинга: ${e.message}`, history: [] });
        }
    }

    const handleClear = () => {
        setPInput('');
        setStepFunction('');
        setStrCheck('');
        setResult(null);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-xl mx-auto !space-y-8">
                <h1 className="text-2xl font-bold text-center">ДМП-автомат 👾</h1>
                <div className="flex flex-col gap-2">
                    <label htmlFor="pInput" className="flex items-center text-sm font-medium text-gray-900">
                        P=(
                        <input
                            value={pInput}
                            onChange={e => setPInput(e.target.value)}
                            type="text"
                            id="pInput"
                            className="flex-1 min-w-0 !px-2 !py-1.5 bg-gray-100 rounded-md border-1 border-gray-300 text-sm"
                            placeholder="{q0,q1,q2}, {a,b}, {Z,a,b}, δ, q0, Z, {q2}"
                        />
                        )
                    </label>

                    <p className="text-sm font-medium text-gray-900">Символы для копирования: δ | ε</p>

                    <label htmlFor="stepFunction" className="flex flex-col text-sm font-medium text-gray-900">
                        Функции переходов
                        <textarea
                            value={stepFunction}
                            onChange={e => setStepFunction(e.target.value)}
                            id="stepFunction"
                            rows="10"
                            className="!mt-1 w-full !px-2 !py-2 bg-gray-100 rounded-md border-1 border-gray-300 text-sm resize-y"
                            placeholder={"Пример переходов:\n(q0,a,Z) = (q0,aZ)\n(q0,a,a) = (q0,aaZ)\n(q0,b,a) = (q1,ε)\n(q1,b,a) = (q1,ε)\n(q1,ε,Z) = (q2,ε)"}
                        ></textarea>
                    </label>

                    <label htmlFor="strCheck" className="flex text-sm font-medium text-gray-900">
                        Строка для проверки:
                        <input
                            value={strCheck}
                            onChange={e => setStrCheck(e.target.value)}
                            type="text"
                            id="strCheck"
                            className="w-full !px-2 !py-1.5 bg-gray-100 rounded-md border-1 border-gray-300 text-sm"
                            placeholder="Введите строку"
                        />
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCheck}
                        className="w-[150px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white transition-all ease-in-out rounded-md !p-2"
                    >
                        Проверить
                    </button>
                    <button
                        onClick={handleClear}
                        className="w-[150px] bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-black transition-all ease-in-out rounded-md !p-2"
                    >
                        Очистить
                    </button>
                </div>

                {result && (
                    <div className={`!mt-6 !p-4 rounded-lg border-2 ${result.accepted ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                        <p className="font-bold text-lg">
                            {result.accepted ? '✅ Цепочка ПРИНЯТА' : '❌ Цепочка НЕ ПРИНЯТА'}
                        </p>
                        <p className="mt-2 text-sm"><strong>Причина:</strong> {result.reason}</p>

                        {result.history && result.history.length > 1 && (
                            <button
                                onClick={() => setShowSteps(!showSteps)}
                                className="mt-3 text-blue-600 hover:underline text-sm"
                            >
                                {showSteps ? 'Скрыть' : 'Показать'} шаги ({result.history.length - 1})
                            </button>
                        )}
                    </div>
                )}

                {showSteps && result?.history && (
                    <div className="!mt-4 !p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b">
                                <th className="py-1">Шаг</th>
                                <th className="py-1">Состояние</th>
                                <th className="py-1">Остаток</th>
                                <th className="py-1">Стек</th>
                                <th className="py-1">Действие</th>
                            </tr>
                            </thead>
                            <tbody>
                            {result.history.map((cfg, i) => (
                                <tr key={i} className="border-b">
                                    <td className="py-1">{i}</td>
                                    <td className="py-1">{cfg.state}</td>
                                    <td className="py-1">{cfg.remaining || 'ε'}</td>
                                    <td className="py-1">{cfg.stack.join('') || 'ε'}</td>
                                    <td className="py-1 text-blue-700">{cfg.action || '-'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    )
}

export default DMPautomaticPage;
