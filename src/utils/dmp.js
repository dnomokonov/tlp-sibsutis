export class DMP {
    constructor(status, inputAlphabet, stackAlphabet, transitions, startState, startStackSymbol, acceptStates) {
        this.status = new Set(status)
        this.inputAlphabet = new Set(inputAlphabet)
        this.stackAlphabet = new Set([...stackAlphabet, startStackSymbol])
        this.transitions = transitions
        this.startState = startState
        this.startStackSymbol = startStackSymbol
        this.acceptStates = new Set(acceptStates)
    }

    static parse(description) {
        // Неправильный парс аргументов, возвращает строку на элемент массива
        const parts = description.replace(/[\{\}\s]/g, '').split('),(').map(p => p.replace(/[()]/g, ''))
        console.log(parts)

        if (parts.length !== 7) throw new Error('Неверный формат ДМП')

        const [statesStr, inputStr, stackStr, _, startState, startStack, acceptStr] = parts
        const states = statesStr.split(',').filter(Boolean)
        const inputAlphabet = inputStr.split(',').filter(Boolean)
        const stackAlphabet = stackStr.split(',').filter(Boolean)
        const acceptStates = acceptStr.split(',').filter(Boolean)

        if (!states.includes(startState)) throw new Error('Начальное состояние не в множестве состояний');
        if (!acceptStates.every(s => states.includes(s))) throw new Error('Финальное состояние вне множества');
        if (!stackAlphabet.includes(startStack)) throw new Error('Начальный символ стека не в алфавите стека');

        return {states, inputAlphabet, stackAlphabet, startState, startStackSymbol: startStack, acceptStates}
    }

    static parseTransitions(text) {
        const transitions = new Map()
        const lines = text.trim().split('\n').map(line => line.trim()).filter(Boolean)

        for (let line of lines) {
            const match = line.match(/δ\(([^,]+),([^,]*),([^)]+)\)\s*=\s*\(([^,]+),([^)]+)\)/);
            if (!match) continue;

            const [, currState, input, stackTop, newState, pushStr] = match;
            const key = `${currState},${input || 'ε'},${stackTop}`;
            const value = [newState, pushStr === 'ε' ? '' : pushStr];
            transitions.set(key, value);
        }

        return transitions;
    }

    dmpStart(inputString, maxSteps = 1000) {
        const configHistory = []
        let state = this.startState
        let stack = [this.startStackSymbol]
        let pos = 0
        let steps = 0

        const pushConfig = () => {
            configHistory.push({
                state,
                remaining: inputString.slice(pos),
                stack: [...stack],
                step: steps,
                action: ''
            })
        }

        pushConfig()

        while (pos <= inputString.length && steps < maxSteps) {
            const input = pos < inputString.length ? inputString[pos] : 'ε'
            const stackTop = stack.length > 0 ? stack[stack.length - 1] : 'ε'

            const key1 = `${state},${input},${stackTop}`
            const key2 = `${state},ε,${stackTop}`
            const transition = this.transitions.get(key1) || this.transitions.get(key2)

            if (!transition) {
                return {
                    accepted: false,
                    reason: `Нет перехода из состояния ${state} при входе '${input}' и вершине стека '${stackTop}'`,
                    history: configHistory
                }
            }

            const [newState, pushStr] = transition

            if (stack.length > 0) stack.pop()

            if (pushStr && pushStr !== 'ε') {
                for (let i = pushStr.length - 1; i >= 0; i--) {
                    stack.push(pushStr[i])
                }
            }

            state = newState
            if (input !== 'ε') pos++
            steps++

            const action = `δ(${state},${input !== 'ε' ? input : 'ε'},${stackTop}) → (${newState},${pushStr || 'ε'})`
            configHistory[configHistory.length - 1].action = action

            pushConfig()

            if (pos === inputString.length && this.acceptStates.has(state)) {
                return {
                    accepted: true,
                    reason: 'Цепочка принята по финальному состоянию',
                    history: configHistory
                }
            }

            if (steps >= maxSteps) {
                return {
                    accepted: false,
                    reason: 'Превышено максимальное число шагов (возможна бесконечная петля)',
                    history: configHistory
                }
            }
        }

        return {
            accepted: false,
            reason: 'Цепочка не была полностью прочитана или не достигнуто финальное состояние',
            history: configHistory
        }
    }
}