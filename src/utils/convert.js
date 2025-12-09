export class RPNTransducer {
    constructor() {
        this.operatorPrecedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
        this.stack = [];
        this.output = [];
        this.trace = [];
        this.stepCounter = 0;
        this.Z = 'Z';
        this.error = null;
        this.lastTokenType = null;
    }

    precedence(op) { return this.operatorPrecedence[op] || 0; }
    isOperator(c) { return ['+', '-', '*', '/'].includes(c); }
    isNumber(str) { return /^\d+$/.test(str); }

    reject(message, token = this.currentToken) {
        if (this.error) return;
        const top = this.stack[this.stack.length - 1] || 'пусто';
        const input = token !== undefined ? `"${token}"` : 'конец ввода';

        this.error = `Ошибка: Отказ — ${message}\n` +
            `   • Входной символ: ${input}\n` +
            `   • Вершина стека: ${top === this.Z ? 'Z' : `"${top}"`}\n` +
            `   • Последнее действие: ${this.formatLastToken()}`;

        if (this.trace.length > 0) {
            const last = this.trace[this.trace.length - 1];
            last.isError = true;
            last.errorMessage = this.error;
        }
        throw new Error(this.error);
    }

    formatLastToken() {
        if (!this.lastTokenType) return 'начало выражения';
        const map = { rvalue: 'правозначное выражение', operator: 'оператор', open: '"("', close: '")"' };
        return map[this.lastTokenType] || this.lastTokenType;
    }

    setLastRValue() { this.lastTokenType = 'rvalue'; }

    addTrace(inputToken, action = '') {
        const prevStack = this.trace.length > 0 ? this.trace[this.trace.length - 1].stack : [];
        this.trace.push({
            step: ++this.stepCounter,
            input: inputToken === 'λ' ? 'λ' : inputToken,
            stack: [...this.stack],
            output: [...this.output],
            prevStack,
            action,
            isError: false
        });
    }

    convert(expression) {
        this.stack = [this.Z];
        this.output = [];
        this.trace = [];
        this.stepCounter = 0;
        this.error = null;
        this.lastTokenType = null;

        const tokens = this.tokenize(expression.trim());
        if (tokens.length === 0) this.reject('пустое выражение');

        this.addTrace('начало', 'Инициализация: стек = [Z]');

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            this.currentToken = token;

            if (this.isNumber(token)) {
                if (this.lastTokenType === 'rvalue')
                    this.reject('два операнда подряд без оператора', token);
                this.output.push(token);
                this.addTrace(token, 'Число → выход');
                this.setLastRValue();
            }
            else if (token === '(') {
                if (this.lastTokenType === 'rvalue')
                    this.reject('ожидался оператор, а не "("', token);
                this.stack.push(token);
                this.addTrace(token, 'Открывающая скобка → стек');
                this.lastTokenType = 'open';
            }
            else if (token === ')') {
                if (this.lastTokenType === 'open' || this.lastTokenType === 'operator')
                    this.reject('пустое подвыражение', token);

                let found = false;
                while (this.stack.length > 1) {
                    const top = this.stack.pop();
                    if (top === '(') { found = true; break; }
                    this.output.push(top);
                    this.addTrace(token, `вытолкнуть ${top}`);
                }
                if (!found) this.reject('нет парной открывающей скобки', token);
                this.addTrace(token, 'Закрывающая скобка');
                this.setLastRValue();
            }
            else if (this.isOperator(token)) {
                if (this.lastTokenType !== 'rvalue' && this.lastTokenType !== null)
                    this.reject('оператор без левого операнда', token);

                while (
                    this.stack.length > 1 &&
                    this.stack[this.stack.length - 1] !== '(' &&
                    this.isOperator(this.stack[this.stack.length - 1]) &&
                    this.precedence(this.stack[this.stack.length - 1]) >= this.precedence(token)
                    ) {
                    const popped = this.stack.pop();
                    this.output.push(popped);
                    this.addTrace(token, `вытолкнуть ${popped}`);
                }
                this.stack.push(token);
                this.addTrace(token, `Оператор ${token} → стек`);
                this.lastTokenType = 'operator';
            }
        }

        if (this.lastTokenType === 'operator')
            this.reject('выражение заканчивается оператором — нет правого операнда');
        if (this.lastTokenType === 'open')
            this.reject('незакрытая скобка');

        while (this.stack.length > 1) {
            const op = this.stack.pop();
            if (op === '(') this.reject('лишняя открывающая скобка');
            this.output.push(op);
            this.addTrace('λ', `λ: вытолкнуть ${op}`);
        }

        if (this.output.length === 0) this.reject('нет операндов');

        this.addTrace('конец', 'Успешное завершение');
        return this.output.join(' ');
    }

    tokenize(expression) {
        const tokens = [];
        let num = '';
        for (let i = 0; i < expression.length; i++) {
            const c = expression[i];
            if (c === ' ') continue;
            if (/\d/.test(c)) num += c;
            else {
                if (num) { tokens.push(num); num = ''; }
                if ('()+-*/'.includes(c)) tokens.push(c);
                else this.reject(`недопустимый символ "${c}"`, `позиция ${i + 1}`);
            }
        }
        if (num) tokens.push(num);
        return tokens;
    }

    hasError() { return this.error !== null; }
    getError() { return this.error; }

    getTrace() { return this.trace; }
}
