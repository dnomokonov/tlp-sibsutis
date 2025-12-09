import { useCallback, useEffect, useState } from 'react';
import { RPNTransducer } from '../utils/convert.js';

export default function ConverterRpnPage() {
    const [activeTab, setActiveTab] = useState('converter');
    const [inputExpr, setInputExpr] = useState('(5 + 3) * 2');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [trace, setTrace] = useState([]);

    let transducer;
    transducer = new RPNTransducer();

    const runConversion = useCallback((expr) => {
        setError('');
        setResult('');
        setTrace([]);

        if (!expr.trim()) {
            setError('Введите выражение');
            return;
        }

        try {
            const rpn = transducer.convert(expr);
            setResult(rpn);
            setTrace(transducer.getTrace());
        } catch (e) {
            setError(e.message);
            setTrace([]);
        }
    }, [transducer]);

    useEffect(() => {
        runConversion(inputExpr);
    }, [inputExpr, runConversion]);

    const getActionDescription = (step) => {
        const { input, stack, prevStack } = step;

        if (input === 'начало') return 'Начало обработки выражения';
        if (input === 'конец') return 'Завершение обработки';

        if (input === '(') return 'Открывающая скобка → в стек';
        if (input === ')') {
            const popped = prevStack[prevStack.length - 1];
            if (['+', '-', '*', '/'].includes(popped)) {
                return `Закрывающая скобка: вытолкнуть ${popped} → в выход`;
            }
            return 'Закрывающая скобка: завершение подвыражения';
        }

        if (/^\d+$/.test(input)) return 'Число → в выход';

        if (['+', '-', '*', '/'].includes(input)) {
            if (prevStack.length > stack.length) {
                const poppedOp = prevStack[prevStack.length - 1];
                return `Приоритет ${input} ниже → вытолкнуть ${poppedOp} → в выход`;
            }
            return `Оператор ${input} → в стек`;
        }

        if (input === 'λ') {
            const popped = prevStack[prevStack.length - 1];
            if (!popped) return 'λ-переход: стек пуст';
            if (popped === '(') return 'Ошибка: лишняя открывающая скобка';
            return `λ-переход: вытолкнуть ${popped} → в выход`;
        }

        return 'Обработка токена';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex items-center flex-col max-w-5xl mx-auto !px-4 !py-8 w-full">

                <div className="text-center !mb-10">
                    <h1 className="text-4xl font-bold text-blue-600 !mb-3 text-center">
                        МП-преобразователь в ОПЗ
                    </h1>
                    <p className="text-lg text-gray-600 text-center">
                        Перевод арифметических выражений в обратную польскую запись (RPN)
                    </p>
                </div>

                <div className="flex gap-1 border-gray-300 !mb-10 overflow-x-auto">
                    {['theory', 'converter', 'trace'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`!px-6 !py-3 text-lg font-medium transition-all relative whitespace-nowrap
                                ${activeTab === tab
                                ? 'text-blue-600 font-bold'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab === 'theory' && 'Теория'}
                            {tab === 'converter' && 'Преобразователь'}
                            {tab === 'trace' && 'Трассировка'}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 !-mb-0.5"></span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'theory' && (
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 !p-8">
                            <h2 className="text-2xl font-bold text-blue-700 mb-6">КС-грамматика</h2>
                            <pre className="bg-gray-100 !p-5 !mt-4 rounded-lg font-mono !text-sm overflow-x-auto">
                                {
                                    `E → E + T | E − T | T`
                                    +
                                    `\nT → T * F | T / F | F`
                                    +
                                    `\nF → ( E ) | num`
                                }
                            </pre>
                        </div>

                        <div className="bg-white rounded-xl shadow-md border border-gray-200 !p-8">
                            <h2 className="text-2xl font-bold text-blue-700 !mb-6">СУ-схема (вывод ОПЗ)</h2>
                            <table className="w-full text-sm">
                                <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="!p-3 text-left">Правило</th>
                                    <th className="!p-3 text-left">Действие</th>
                                </tr>
                                </thead>
                                <tbody>
                                {[
                                    ['E → E₁ + T', 'E₁ T +'],
                                    ['E → E₁ − T', 'E₁ T −'],
                                    ['T → T₁ * F', 'T₁ F *'],
                                    ['T → T₁ / F', 'T₁ F /'],
                                    ['F → ( E )', 'E'],
                                    ['F → num', 'num'],
                                ].map(([rule, action], i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="!p-3 font-mono">{rule}</td>
                                        <td className="!p-3 font-mono text-blue-700">{action}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white rounded-xl shadow-md border border-gray-200 !p-8 lg:col-span-2">
                            <h2 className="text-2xl font-bold text-blue-700 mb-6">Примеры</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    ['(5 + 3) * 2', '5 3 + 2 *'],
                                    ['2 * 3 + 4', '2 3 * 4 +'],
                                    ['10 / (2 + 3)', '10 2 3 + /'],
                                    ['1 + 2 * 3 - 4', '1 2 3 * + 4 -'],
                                ].map(([inp, out]) => (
                                    <div key={inp} className="bg-gray-50 !p-5 !mt-4 rounded-lg text-center">
                                        <code className="block text-lg font-mono text-blue-700 !mb-2">{inp}</code>
                                        <span className="text-2xl text-gray-500">→</span>
                                        <code className="block text-lg font-mono text-green-700 !mt-2">{out}</code>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'converter' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 !p-8">
                            <h2 className="text-2xl font-bold !mb-6">Интерактивный преобразователь</h2>

                            <label className="block text-sm font-medium text-gray-700 !mb-2">
                                Арифметическое выражение
                            </label>
                            <input
                                type="text"
                                value={inputExpr}
                                onChange={(e) => setInputExpr(e.target.value)}
                                className="w-full !px-5 !py-4 border border-gray-300 rounded-lg font-mono text-lg
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                           transition-all"
                                placeholder="Например: (5 + 3) * 12 / 4"
                            />
                            <small className="text-gray-500 block !mt-2">
                                Поддерживаются: цифры, +, -, *, /, скобки ( )
                            </small>

                            {error ? (
                                <div className="!mt-6 !p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                    <p className="text-red-700 font-mono text-lg">Ошибка: {error}</p>
                                </div>
                            ) : result ? (
                                <div className="!mt-6 !p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
                                    <p className="text-green-700 font-mono text-xl">
                                        ОПЗ: <code className="bg-green-100 !px-3 !py-1 rounded">{result}</code>
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {activeTab === 'trace' && (
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 !p-8">
                            <h2 className="text-2xl font-bold !mb-6">Пошаговая трассировка МП-преобразователя</h2>

                            <div className="!mb-8">
                                <label className="block text-sm font-medium text-gray-700 !mb-2">
                                    Выражение
                                </label>
                                <input
                                    type="text"
                                    value={inputExpr}
                                    onChange={(e) => setInputExpr(e.target.value)}
                                    className="w-full !px-5 !py-4 border border-gray-300 rounded-lg font-mono text-lg
                                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Введите выражение..."
                                />
                            </div>

                            {error && (
                                <div className="!p-6 bg-red-50 border-l-4 border-red-500 rounded-lg !mb-6">
                                    <p className="text-red-700 font-mono">Ошибка: {error}</p>
                                </div>
                            )}

                            {trace.length > 0 && (
                                <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="bg-blue-600 text-white">
                                            <th className="!px-6 !py-4 text-left font-bold">Шаг</th>
                                            <th className="!px-6 !py-4 text-left font-bold">Вход</th>
                                            <th className="!px-10 !py-4 text-left font-bold">Стек</th>
                                            <th className="!px-10 !py-4 text-left font-bold">Выход</th>
                                            <th className="!px-10 !py-4 text-left font-bold">Действие</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                        {trace.map((step, i) => {
                                            const isLambda = step.input === 'λ';
                                            return (
                                                <tr
                                                    key={i}
                                                    className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition`}
                                                >
                                                    <td className="!px-6 !py-5 text-center font-bold text-blue-700">
                                                        {step.step}
                                                    </td>
                                                    <td className="!px-6 !py-5 text-center font-mono">
                                                        {isLambda ? (
                                                            <span className="text-purple-600 font-bold text-lg">λ</span>
                                                        ) : (
                                                            <code className="bg-gray-100 !px-2 !py-1 rounded text-base">
                                                                {step.input}
                                                            </code>
                                                        )}
                                                    </td>
                                                    <td className="!px-10 !py-5 font-mono text-gray-800">
                                                        [{step.stack.length === 0 ? 'пусто' : step.stack.join(' , ')}]
                                                    </td>
                                                    <td className="px-10 py-5 font-mono text-green-700">
                                                        {step.output.join(' ') || '—'}
                                                    </td>
                                                    <td className="!px-10 !py-5 text-gray-700 italic">
                                                        {getActionDescription(step)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>

                                    <div className="bg-green-50 border-t-4 border-green-500 !px-8 !py-6 text-center">
                                        <p className="text-green-800 font-bold text-xl">
                                            Преобразование завершено успешно
                                        </p>
                                        <p className="!mt-3 text-lg">
                                            Результат:{' '}
                                            <code className="text-2xl font-mono bg-green-100 !px-5 !py-2 rounded-lg text-green-800">
                                                {result}
                                            </code>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
