export class RPNTransducer {
    constructor() {
        this.operatorPrecedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2
        };
        this.stack = [];
        this.output = [];
        this.trace = [];
        this.stepCounter = 0;
    }

    precedence(op) {
        return this.operatorPrecedence[op] || 0;
    }

    isOperator(char) {
        return ['+', '-', '*', '/'].includes(char);
    }

    isNumber(str) {
        return /^\d+$/.test(str);
    }

    tokenize(expression) {
        const tokens = [];
        let currentNum = '';

        for (let char of expression) {
            if (char === ' ') continue;

            if (/\d/.test(char)) {
                currentNum += char;
            } else {
                if (currentNum) {
                    tokens.push(currentNum);
                    currentNum = '';
                }
                if ('()+-*/'.includes(char)) {
                    tokens.push(char);
                } else {
                    throw new Error(`Неверный символ: "${char}"`);
                }
            }
        }

        if (currentNum) {
            tokens.push(currentNum);
        }

        return tokens;
    }

    addTrace(inputToken, currentStack, currentOutput) {
        const prevStack = this.trace.length > 0
            ? this.trace[this.trace.length - 1].stack
            : [];

        this.trace.push({
            step: ++this.stepCounter,
            input: inputToken === 'λ' ? 'λ' : inputToken,
            stack: [...currentStack],
            output: [...currentOutput],
            prevStack: prevStack
        });
    }

    convert(expression) {
        this.stack = [];
        this.output = [];
        this.trace = [];
        this.stepCounter = 0;

        const tokens = this.tokenize(expression.trim());

        if (tokens.length === 0) {
            throw new Error('Пустое выражение');
        }

        this.addTrace('начало', this.stack, this.output);

        for (let token of tokens) {
            if (this.isNumber(token)) {
                this.output.push(token);
                this.addTrace(token, this.stack, this.output);
            }
            else if (token === '(') {
                this.stack.push(token);
                this.addTrace(token, this.stack, this.output);
            }
            else if (token === ')') {
                let foundOpen = false;
                while (this.stack.length > 0) {
                    const op = this.stack.pop();
                    if (op === '(') {
                        foundOpen = true;
                        break;
                    }
                    this.output.push(op);
                    this.addTrace(token, this.stack, this.output);
                }
                if (!foundOpen) {
                    throw new Error('Несоответствие скобок: нет открывающей скобки');
                }
                this.addTrace(token, this.stack, this.output);
            }
            else if (this.isOperator(token)) {
                while (
                    this.stack.length > 0 &&
                    this.stack[this.stack.length - 1] !== '(' &&
                    this.isOperator(this.stack[this.stack.length - 1]) &&
                    this.precedence(this.stack[this.stack.length - 1]) >= this.precedence(token)
                    ) {
                    this.output.push(this.stack.pop());
                    this.addTrace(token, this.stack, this.output);
                }
                this.stack.push(token);
                this.addTrace(token, this.stack, this.output);
            }
        }

        while (this.stack.length > 0) {
            const op = this.stack.pop();
            if (op === '(') {
                throw new Error('Несоответствие скобок: есть лишняя открывающая скобка');
            }
            this.output.push(op);
            this.addTrace('λ', this.stack, this.output);
        }

        this.addTrace('конец', this.stack, this.output);

        return this.output.join(' ');
    }

    getTrace() {
        return this.trace;
    }

    printTrace() {
        console.table(this.trace.map(t => ({
            'Шаг': t.step,
            'Вход': t.input,
            'Стек': `[${t.stack.join(' , ') || 'пусто'}]`,
            'Выход': t.output.join(' ') || '—',
            'Действие': '→ смотри UI'
        })));
    }
}
