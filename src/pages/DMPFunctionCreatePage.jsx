import { useState } from 'react';

function DMPFunctionCreatePage() {
    const [languageInput, setLanguageInput] = useState('');
    const [generatedP, setGeneratedP] = useState(null);
    const [transitions, setTransitions] = useState([]);
    const [error, setError] = useState('');

    const parseLanguage = (input) => {
        // Убираем пробелы для упрощения парсинга
        const cleaned = input.replace(/\s+/g, '');

        // Тип 1: L = {w | w ∈ {a,b,c}*}
        if (cleaned.match(/w\|w∈\{([a-z,]+)\}\*/i)) {
            const match = cleaned.match(/\{([a-z,]+)\}/i);
            const alphabet = match[1].split(',');
            return {
                type: 'any_string',
                alphabet: alphabet
            };
        }

        // Тип 2: L = {c^(2k) β | β∈{a,b}^+}
        if (cleaned.match(/([a-z])\^\(2k\)β\|β∈\{([a-z,]+)\}\^?\+/i)) {
            const match = cleaned.match(/([a-z])\^\(2k\)β\|β∈\{([a-z,]+)\}\^?\+/i);
            return {
                type: 'even_prefix',
                prefix: match[1],
                suffix_alphabet: match[2].split(',')
            };
        }

        // Тип 3: L = {a^n b^k c^(2n) | k>=0, n>0}
        if (cleaned.match(/([a-z])\^n([a-z])\^k([a-z])\^\(2n\)/i)) {
            const match = cleaned.match(/([a-z])\^n([a-z])\^k([a-z])\^\(2n\)/i);
            return {
                type: 'anbkc2n',
                first: match[1],
                middle: match[2],
                last: match[3]
            };
        }

        return null;
    };

    const generateForAnyString = (alphabet) => {
        // L = {w | w ∈ {a,b,c}*} - принимает любую строку из алфавита
        const states = ['q0', 'q1'];
        const stackAlphabet = ['Z'];

        const p = {
            states: states,
            inputAlphabet: alphabet,
            stackAlphabet: stackAlphabet,
            initialState: 'q0',
            initialStack: 'Z',
            finalStates: ['q1']
        };

        const delta = [];

        // Переход в финальное состояние сразу
        delta.push({
            state: 'q0',
            input: 'ε',
            stack: 'Z',
            nextState: 'q1',
            newStack: 'Z',
            description: 'Принимаем пустую строку или переходим к чтению'
        });

        // Читаем любые символы из алфавита
        alphabet.forEach(char => {
            delta.push({
                state: 'q0',
                input: char,
                stack: 'Z',
                nextState: 'q0',
                newStack: 'Z',
                description: `Читаем '${char}', остаемся в том же состоянии`
            });
        });

        return { p, delta };
    };

    const generateForEvenPrefix = (prefix, suffixAlphabet) => {
        // L = {c^(2k) β | β∈{a,b}^+} - четное количество 'c', затем хотя бы один символ из {a,b}
        const states = ['q0', 'q1', 'q2', 'q3'];
        const stackAlphabet = ['Z', 'X'];

        const p = {
            states: states,
            inputAlphabet: [prefix, ...suffixAlphabet],
            stackAlphabet: stackAlphabet,
            initialState: 'q0',
            initialStack: 'Z',
            finalStates: ['q3']
        };

        const delta = [];

        // Читаем первый 'c', помещаем маркер в стек
        delta.push({
            state: 'q0',
            input: prefix,
            stack: 'Z',
            nextState: 'q1',
            newStack: 'XZ',
            description: `Первый '${prefix}', помещаем маркер в стек`
        });

        // Читаем второй 'c', удаляем маркер (пара завершена)
        delta.push({
            state: 'q1',
            input: prefix,
            stack: 'X',
            nextState: 'q0',
            newStack: 'ε',
            description: `Второй '${prefix}', пара завершена, удаляем маркер`
        });

        // Можем продолжать добавлять пары
        delta.push({
            state: 'q0',
            input: prefix,
            stack: 'Z',
            nextState: 'q1',
            newStack: 'XZ',
            description: `Начинаем новую пару '${prefix}'`
        });

        // Переход к чтению суффикса (стек должен быть пустым - четное количество)
        suffixAlphabet.forEach(char => {
            delta.push({
                state: 'q0',
                input: char,
                stack: 'Z',
                nextState: 'q2',
                newStack: 'Z',
                description: `Читаем первый символ суффикса '${char}'`
            });

            delta.push({
                state: 'q2',
                input: char,
                stack: 'Z',
                nextState: 'q2',
                newStack: 'Z',
                description: `Продолжаем читать символы суффикса '${char}'`
            });
        });

        // Финальный переход
        delta.push({
            state: 'q2',
            input: 'ε',
            stack: 'Z',
            nextState: 'q3',
            newStack: 'Z',
            description: 'Переход в финальное состояние'
        });

        return { p, delta };
    };

    const generateForAnBkC2n = (first, middle, last) => {
        // L = {a^n b^k c^(2n) | k>=0, n>0}
        const states = ['q0', 'q1', 'q2', 'q3', 'q4'];
        const stackAlphabet = ['Z', 'a'];

        const p = {
            states: states,
            inputAlphabet: [first, middle, last],
            stackAlphabet: stackAlphabet,
            initialState: 'q0',
            initialStack: 'Z',
            finalStates: ['q4']
        };

        const delta = [];

        // Фаза 1: Читаем 'a' и помещаем в стек
        delta.push({
            state: 'q0',
            input: first,
            stack: 'Z',
            nextState: 'q1',
            newStack: 'aZ',
            description: `Первый '${first}', начинаем подсчет n`
        });

        delta.push({
            state: 'q1',
            input: first,
            stack: 'a',
            nextState: 'q1',
            newStack: 'aa',
            description: `Продолжаем читать '${first}', помещаем в стек`
        });

        // Фаза 2: Читаем 'b' (k >= 0)
        delta.push({
            state: 'q1',
            input: middle,
            stack: 'a',
            nextState: 'q2',
            newStack: 'a',
            description: `Первый '${middle}', переходим к фазе чтения '${middle}'`
        });

        delta.push({
            state: 'q2',
            input: middle,
            stack: 'a',
            nextState: 'q2',
            newStack: 'a',
            description: `Продолжаем читать '${middle}' (любое количество)`
        });

        // Можем пропустить 'b' если k=0
        delta.push({
            state: 'q1',
            input: last,
            stack: 'a',
            nextState: 'q3',
            newStack: 'ε',
            description: `Пропускаем '${middle}' (k=0), первый '${last}', извлекаем из стека (1/2)`
        });

        // Фаза 3: Читаем 'c' и извлекаем из стека (2n раз)
        delta.push({
            state: 'q2',
            input: last,
            stack: 'a',
            nextState: 'q3',
            newStack: 'ε',
            description: `Первый '${last}', извлекаем из стека (1/2)`
        });

        delta.push({
            state: 'q3',
            input: last,
            stack: 'a',
            nextState: 'q3',
            newStack: 'ε',
            description: `Продолжаем читать '${last}', извлекаем из стека (счетчик 2n)`
        });

        // Финальный переход
        delta.push({
            state: 'q3',
            input: 'ε',
            stack: 'Z',
            nextState: 'q4',
            newStack: 'Z',
            description: 'Завершение, переход в финальное состояние'
        });

        return { p, delta };
    };

    const generateTransitions = () => {
        setError('');
        setTransitions([]);
        setGeneratedP(null);

        const lang = parseLanguage(languageInput);

        if (!lang) {
            setError('Ошибка парсинга языка. Поддерживаемые форматы:\n' +
                '1. w | w ∈ {a,b,c}*\n' +
                '2. c^(2k) β | β∈{a,b}^+\n' +
                '3. a^n b^k c^(2n) | k>=0, n>0');
            return;
        }

        let result;

        switch (lang.type) {
            case 'any_string':
                result = generateForAnyString(lang.alphabet);
                break;
            case 'even_prefix':
                result = generateForEvenPrefix(lang.prefix, lang.suffix_alphabet);
                break;
            case 'anbkc2n':
                result = generateForAnBkC2n(lang.first, lang.middle, lang.last);
                break;
            default:
                setError('Неподдерживаемый тип языка');
                return;
        }

        setGeneratedP(result.p);
        setTransitions(result.delta);
    };

    const handleClear = () => {
        setLanguageInput('');
        setTransitions([]);
        setGeneratedP(null);
        setError('');
    };

    const setExample = (example) => {
        setLanguageInput(example);
        setTransitions([]);
        setGeneratedP(null);
        setError('');
    };

    const formatP = (p) => {
        if (!p) return '';
        return `P = ({${p.states.join(', ')}}, {${p.inputAlphabet.join(', ')}}, {${p.stackAlphabet.join(', ')}}, δ, ${p.initialState}, ${p.initialStack}, {${p.finalStates.join(', ')}})`;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-xl mx-auto !space-y-8">
                <h1 className="text-3xl font-bold text-center text-gray-800">Генерация функции переходов 🧩</h1>

                <div className="bg-white rounded-lg shadow-md !p-6 !space-y-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="languageInput" className="flex items-center text-sm font-medium text-gray-900">
                            <span className="!mr-2 whitespace-nowrap">L = &#123;</span>
                            <input
                                type="text"
                                id="languageInput"
                                value={languageInput}
                                onChange={(e) => setLanguageInput(e.target.value)}
                                className="flex-1 min-w-0 !px-3 !py-2 bg-gray-50 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="a^n b^k c^(2n) | k>=0, n>0"
                            />
                            <span className="!ml-2">&#125;</span>
                        </label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 !px-4 !py-3 rounded-md text-sm whitespace-pre-line">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={generateTransitions}
                            className="!px-4 !py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium rounded-md transition-colors"
                        >
                            Создать
                        </button>
                        <button
                            onClick={handleClear}
                            className="!px-4 !py-2 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 font-medium rounded-md transition-colors"
                        >
                            Очистить
                        </button>
                        <div className="flex-1"></div>
                        <span className="text-sm text-gray-600">Примеры:</span>
                        <button
                            onClick={() => setExample('w | w ∈ {a,b,c}*')}
                            className="!px-3 !py-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm rounded-md transition-colors"
                        >
                            Тип 1
                        </button>
                        <button
                            onClick={() => setExample('c^(2k) β | β∈{a,b}^+')}
                            className="!px-3 !py-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm rounded-md transition-colors"
                        >
                            Тип 2
                        </button>
                        <button
                            onClick={() => setExample('a^n b^k c^(2n) | k>=0, n>0')}
                            className="!px-3 !py-1 bg-green-100 hover:bg-green-200 text-green-800 text-sm rounded-md transition-colors"
                        >
                            Тип 3
                        </button>
                    </div>
                </div>

                {generatedP && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg !p-4">
                        <h2 className="text-lg font-bold !mb-2 text-gray-800">Сгенерированный автомат P:</h2>
                        <p className="font-mono text-sm text-gray-700 break-all">{formatP(generatedP)}</p>
                    </div>
                )}

                {transitions.length > 0 && (
                    <>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Функция переходов δ (формальная запись):</h2>
                            <div className="bg-gray-50 rounded-md !p-4 font-mono text-sm !space-y-1">
                                {transitions.map((t, idx) => (
                                    <div key={idx} className="text-gray-800">
                                        δ({t.state}, {t.input}, {t.stack}) = ({t.nextState}, {t.newStack})
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md !p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Функция переходов δ (таблица):</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 !px-4 !py-2 text-left">Состояние</th>
                                        <th className="border border-gray-300 !px-4 !py-2 text-left">Вход</th>
                                        <th className="border border-gray-300 !px-4 !py-2 text-left">Стек</th>
                                        <th className="border border-gray-300 !px-4 !py-2 text-left">→ Состояние</th>
                                        <th className="border border-gray-300 !px-4 !py-2 text-left">→ Стек</th>
                                        <th className="border border-gray-300 !px-4 !py-2 text-left">Описание</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {transitions.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 !px-4 !py-2 font-mono">{t.state}</td>
                                            <td className="border border-gray-300 !px-4 !py-2 font-mono">{t.input}</td>
                                            <td className="border border-gray-300 !px-4 !py-2 font-mono">{t.stack}</td>
                                            <td className="border border-gray-300 !px-4 !py-2 font-mono">{t.nextState}</td>
                                            <td className="border border-gray-300 !px-4 !py-2 font-mono">{t.newStack}</td>
                                            <td className="border border-gray-300 !px-4 !py-2 text-sm text-gray-600">{t.description}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default DMPFunctionCreatePage;