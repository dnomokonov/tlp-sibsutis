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

    addTrace(step, input, stack, output) {
        this.trace.push({
            step,
            input,
            stack: [...stack],
            output: [...output]
        });
    }

    convert(expression) {
        this.stack = [];
        this.output = [];
        this.trace = [];

        let tokens;
        try {
            tokens = this.tokenize(expression);
        } catch (e) {
            throw new Error(e.message);
        }

        if (tokens.length === 0) {
            throw new Error('Пустое выражение');
        }

        let step = 0;

        for (let token of tokens) {
            step++;

            if (this.isNumber(token)) {
                // Число — добавить в выход
                this.output.push(token);
                this.addTrace(step, token, this.stack, this.output);
            }
            else if (this.isOperator(token)) {
                // Оператор — управление стеком по приоритету
                while (
                    this.stack.length > 0 &&
                    this.stack[this.stack.length - 1] !== '(' &&
                    this.isOperator(this.stack[this.stack.length - 1]) &&
                    this.precedence(this.stack[this.stack.length - 1]) >= this.precedence(token)
                    ) {
                    this.output.push(this.stack.pop());
                }
                this.stack.push(token);
                this.addTrace(step, token, this.stack, this.output);
            }
            else if (token === '(') {
                // Открывающая скобка — на стек
                this.stack.push(token);
                this.addTrace(step, token, this.stack, this.output);
            }
            else if (token === ')') {
                // Закрывающая скобка — выталкиваем до '('
                let foundOpen = false;
                while (this.stack.length > 0) {
                    const op = this.stack.pop();
                    if (op === '(') {
                        foundOpen = true;
                        break;
                    }
                    this.output.push(op);
                }
                if (!foundOpen) {
                    throw new Error('Несоответствие скобок: нет открывающей скобки');
                }
                this.addTrace(step, token, this.stack, this.output);
            }
        }

        // Конец выражения — выталкиваем весь стек
        while (this.stack.length > 0) {
            const op = this.stack.pop();
            if (op === '(') {
                throw new Error('Несоответствие скобок: есть необработанная открывающая скобка');
            }
            this.output.push(op);
        }

        return this.output.join(' ');
    }

    getTrace() {
        return this.trace;
    }
}
