import {useEffect, useState} from 'react';
import { RPNTransducer } from '../utils/convert.js';

export default function ConverterRpnPage() {
    const [activeTab, setActiveTab] = useState('converter');
    const [inputExpr, setInputExpr] = useState('(5 + 3) * 2');
    const [traceExpr, setTraceExpr] = useState('(5 + 3) * 2');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [trace, setTrace] = useState([]);

    const runConversion = (expr) => {
        setError('');
        setResult('');
        const transducer = new RPNTransducer();
        try {
            const rpn = transducer.convert(expr.trim());
            setResult(rpn);
        } catch (e) {
            setError(e.message);
        }
    };

    const runTrace = (expr) => {
        setError('');
        setTrace([]);
        const transducer = new RPNTransducer();
        try {
            transducer.convert(expr.trim());
            setTrace(transducer.getTrace());
        } catch (e) {
            setError(e.message);
        }
    };

    useEffect(() => {
        runConversion(inputExpr);
    }, [inputExpr]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto !px-4 !py-8">

                <div className="text-center !mb-8">
                    <h1 className="text-3xl font-bold text-blue-600 !mb-2">
                        МП-преобразователь в ОПЗ
                    </h1>
                    <p className="text-lg !sm:text-lg text-gray-600">
                        Перевод арифметических выражений в обратную польскую запись
                    </p>
                </div>

                <div className="flex gap-1 sm:gap-2 !sm:flex-row !mb-8 border-b-2 border-gray-300">
                    {['theory', 'converter', 'trace'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`!px-6 !py-3 text-lg sm:text-lg font-medium transition-colors relative ${
                                activeTab === tab
                                    ? 'text-blue-600 font-semibold'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab === 'converter' && 'Преобразователь'}
                            {tab === 'trace' && 'Трассировка'}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 !-mb-0.5 hidden sm:block"></span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'converter' && (
                    <div className="!space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 !p-8">
                            <h2 className="text-2xl font-bold !mb-6">Интерактивный преобразователь</h2>
                            <div className="!space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 !mb-2">
                                        Арифметическое выражение
                                    </label>
                                    <input
                                        type="text"
                                        value={inputExpr}
                                        onChange={(e) => {
                                            setInputExpr(e.target.value);
                                            runConversion(e.target.value);
                                        }}
                                        className="w-full !px-4 !py-3 border border-gray-300 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Например: (5 + 3) * 12 / 4"
                                    />
                                    <small className="text-gray-500 block mt-2">
                                        Допустимы: цифры, +, -, *, /, скобки ( )
                                    </small>
                                </div>

                                {(result || error) && (
                                    <div
                                        className={`!p-6 rounded-lg border-l-4 font-mono text-lg ${
                                            error
                                                ? 'bg-red-50 border-red-500 text-red-700'
                                                : 'bg-green-50 border-green-500 text-green-700'
                                        }`}
                                    >
                                        {error ? `Ошибка: ${error}` : result}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'trace' && (
                    <div className="!space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 !p-8">
                            <h2 className="text-2xl font-bold !mb-6">Пошаговая трассировка МП-преобразователя</h2>
                            <div className="!space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 !mb-2">
                                        Выражение для трассировки
                                    </label>
                                    <input
                                        type="text"
                                        value={traceExpr}
                                        onChange={(e) => {
                                            setTraceExpr(e.target.value);
                                            runTrace(e.target.value);
                                        }}
                                        className="w-full !px-4 !py-3 border border-gray-300 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Введите выражение..."
                                    />
                                </div>

                                {error && (
                                    <div className="!p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                                        Ошибка: {error}
                                    </div>
                                )}

                                {trace.length > 0 && (
                                    <div className="overflow-x-auto rounded-lg border border-gray-300">
                                        <div className="bg-blue-600 text-white grid grid-cols-12 font-bold text-sm">
                                            <div className="col-span-1 !p-4">Шаг</div>
                                            <div className="col-span-2 !p-4">Вход</div>
                                            <div className="col-span-4 !p-4">Стек</div>
                                            <div className="col-span-5 !p-4">Выход</div>
                                        </div>
                                        {trace.map((step, i) => (
                                            <div
                                                key={i}
                                                className={`grid grid-cols-12 text-sm font-mono border-t border-gray-200 ${
                                                    i % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                                }`}
                                            >
                                                <div className="col-span-1 !p-4 text-center font-bold">{step.step}</div>
                                                <div className="col-span-2 !p-4 text-center">{step.input}</div>
                                                <div className="col-span-4 !p-4">
                                                    [{step.stack.join(' | ') || 'пусто'}]
                                                </div>
                                                <div className="col-span-5 p-4">{step.output.join(' ')}</div>
                                            </div>
                                        ))}
                                        <div className="bg-green-50 !p-4 text-center font-bold text-green-700 border-t-4 border-green-500">
                                            Завершено успешно. Результат: <code className="text-lg">{result}</code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
