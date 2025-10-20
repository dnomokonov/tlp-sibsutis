class Node {
    constructor(type, value = null, children = []) {
        this.type = type;
        this.value = value;
        this.children = children;
    }
}

class Tokenizer {
    constructor(input) {
        this.input = input.replace(/\s/g, '');
        this.pos = 0;
        this.tokens = [];
        this.tokenize();
        this.currentTokenIndex = 0;
    }

    tokenize() {
        const regex = /([+\-*/()])|([a-zA-Z][a-zA-Z0-9]*)|([0-9]+)/g;
        let match;

        while ((match = regex.exec(this.input)) !== null) {
            if (match[1]) {
                this.tokens.push({ type: match[1], value: match[1] });
            } else if (match[2]) {
                this.tokens.push({ type: 'id', value: match[2] });
            } else if (match[3]) {
                this.tokens.push({ type: 'number', value: match[3] });
            }
        }
    }

    getNextToken() {
        if (this.currentTokenIndex >= this.tokens.length) {
            return { type: 'EOF' };
        }
        return this.tokens[this.currentTokenIndex++];
    }
}

class Parser {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
        this.currentToken = this.tokenizer.getNextToken();
        this.derivationChain = ['S']; // Инициализация цепочки вывода
    }

    eat(type) {
        if (this.currentToken.type === type) {
            const token = this.currentToken;
            this.currentToken = this.tokenizer.getNextToken();
            return token;
        } else {
            throw new Error(`Ожидалось: ${this.typeToString(type)}`);
        }
    }

    typeToString(type) {
        switch (type) {
            case 'number': return 'number';
            case 'id': return 'id';
            case '(': return "'('";
            case ')': return "')'";
            case '+': return '+';
            case '-': return '-';
            case '*': return '*';
            case '/': return '/';
            default: return type;
        }
    }

    updateDerivationChain(left, right) {
        const last = this.derivationChain[this.derivationChain.length - 1];
        // Экранируем T' для регулярного выражения
        const escapedLeft = left === "T'" ? "T'" : left;
        const newStep = last.replace(new RegExp(`\\b${escapedLeft.replace(/'/g, '\\\'')}\\b`), right);
        this.derivationChain.push(newStep);
    }

    parse() {
        try {
            const tree = this.parseS();
            if (this.currentToken.type !== 'EOF') {
                throw new Error('Неожиданные токены в конце');
            }
            return { valid: true, tree, derivationChain: this.derivationChain };
        } catch (err) {
            return { valid: false, error: err.message, derivationChain: this.derivationChain };
        }
    }

    parseS() {
        this.updateDerivationChain('S', 'T E');
        const t = this.parseT();
        const e = this.parseE();
        return new Node('S', null, [t, e]);
    }

    parseE() {
        if (this.currentToken.type === '+') {
            const op = this.eat('+');
            this.updateDerivationChain('E', '+ T E');
            const t = this.parseT();
            const e = this.parseE();
            return new Node('E', null, [new Node('+', op.value), t, e]);
        } else if (this.currentToken.type === '-') {
            const op = this.eat('-');
            this.updateDerivationChain('E', '- T E');
            const t = this.parseT();
            const e = this.parseE();
            return new Node('E', null, [new Node('-', op.value), t, e]);
        } else {
            this.updateDerivationChain('E', 'ε');
            return new Node('E', 'ε');
        }
    }

    parseT() {
        this.updateDerivationChain('T', 'F T\'');
        const f = this.parseF();
        const tprime = this.parseTprime();
        return new Node('T', null, [f, tprime]);
    }

    parseTprime() {
        if (this.currentToken.type === '*') {
            const op = this.eat('*');
            this.updateDerivationChain('T\'', '* F T\'');
            const f = this.parseF();
            const tprime = this.parseTprime();
            return new Node('T\'', null, [new Node('*', op.value), f, tprime]);
        } else if (this.currentToken.type === '/') {
            const op = this.eat('/');
            this.updateDerivationChain('T\'', '/ F T\'');
            const f = this.parseF();
            const tprime = this.parseTprime();
            return new Node('T\'', null, [new Node('/', op.value), f, tprime]);
        } else {
            this.updateDerivationChain('T\'', 'ε');
            return new Node('T\'', 'ε');
        }
    }

    parseF() {
        if (this.currentToken.type === '(') {
            const open = this.eat('(');
            this.updateDerivationChain('F', '( S )');
            const s = this.parseS();
            const close = this.eat(')');
            return new Node('F', null, [new Node('(', open.value), s, new Node(')', close.value)]);
        } else if (this.currentToken.type === 'number') {
            const token = this.eat('number');
            this.updateDerivationChain('F', token.value);
            return new Node('F', token.value);
        } else if (this.currentToken.type === 'id') {
            const token = this.eat('id');
            this.updateDerivationChain('F', token.value);
            return new Node('F', token.value);
        } else {
            throw new Error("Ожидалось: number, id или '('");
        }
    }
}

function startParser(input) {
    const tokenizer = new Tokenizer(input);
    const parser = new Parser(tokenizer);
    const result = parser.parse();

    let statusParcer = {};

    if (result.valid) {
        statusParcer.status = 'Выражение корректно';
        statusParcer.tree = result.tree;
        statusParcer.derivationChain = result.derivationChain;
    } else {
        statusParcer.status = `Ошибка! ${result.error}`;
        statusParcer.tree = null;
        statusParcer.derivationChain = result.derivationChain;
    }

    return statusParcer;
}

export default startParser;