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
        const parts = description.replaceAll(" ", "").match(/\{[^}]*\}|[^,]+/g).map(
            x => x.startsWith("{") && x.endsWith("}") ? x.slice(1, -1) : x
        )

        if (parts.length !== 7) throw new Error('Неверный формат ДМП')

        const [statesStr, inputStr, stackStr, _, startState, startStack, acceptStr] = parts
        const states = statesStr.split(',').filter(Boolean)
        const inputAlphabet = inputStr.split(',').filter(Boolean)
        const stackAlphabet = stackStr.split(',').filter(Boolean)
        const acceptStates = acceptStr.split(',').filter(Boolean)

        if (!states.includes(startState)) throw new Error('Начальное состояние не в множестве состояний')
        if (!acceptStates.every(s => states.includes(s))) throw new Error('Финальное состояние вне множества')
        if (!stackAlphabet.includes(startStack)) throw new Error('Начальный символ стека не в алфавите стека')

        return {states, inputAlphabet, stackAlphabet, startState, startStackSymbol: startStack, acceptStates}
    }

    static parseTransitions(text) {
        const transitions = new Map()
        const lines = text.trim().split('\n')

        for (let line of lines) {
            line = line.trim()
            if (!line) continue

            const match = line.match(/\s*\(\s*([^,]+)\s*,\s*([^,]*?)\s*,\s*([^)]+?)\s*\)\s*=\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/)
            if (!match) {
                console.warn('Пропущена строка (не распознана):', line)
                continue
            }

            const [, currState, inputSym, stackTop, newState, pushStr] = match
            const input = inputSym.trim() || 'ε'
            const key = `${currState.trim()},${input},${stackTop.trim()}`
            const push = pushStr.trim() === 'ε' ? '' : pushStr.trim()

            transitions.set(key, [newState.trim(), push])
        }

        return transitions
    }

    dmpStart(inputString, maxSteps = 1000) {
        const configHistory = []
        let state = this.startState
        let stack = [this.startStackSymbol]
        let pos = 0
        let steps = 0

        const pushConfig = (action = '') => {
            configHistory.push({
                state,
                remaining: inputString.slice(pos),
                stack: [...stack],
                step: steps,
                action
            })
        }

        pushConfig()

        if (pos === inputString.length && this.acceptStates.has(state)) {
            return {
                accepted: true,
                reason: 'Цепочка принята по финальному состоянию',
                history: configHistory
            }
        }

        while (steps < maxSteps) {
            const input = pos < inputString.length ? inputString[pos] : 'ε'
            const stackTop = stack.length > 0 ? stack[stack.length - 1] : 'ε'
            const key1 = `${state},${input},${stackTop}`
            const key2 = `${state},ε,${stackTop}`

            let transition = null
            let usedKey = null
            let inputUsed = input

            if (input !== 'ε' && this.transitions.has(key1)) {
                transition = this.transitions.get(key1)
                usedKey = key1
            }
            else if (this.transitions.has(key2)) {
                transition = this.transitions.get(key2)
                usedKey = key2
                inputUsed = 'ε'
            }

            if (!transition) {
                return {
                    accepted: false,
                    reason: `Нет перехода из состояния ${state} при входе '${input}' и вершине стека '${stackTop}'`,
                    history: configHistory
                }
            }

            const [newState, pushStr] = transition

            const action = `δ(${state},${inputUsed},${stackTop}) → (${newState},${pushStr || 'ε'})`

            if (stack.length > 0) stack.pop()

            if (pushStr && pushStr !== 'ε') {
                for (let i = pushStr.length - 1; i >= 0; i--) {
                    stack.push(pushStr[i])
                }
            }

            state = newState

            if (inputUsed !== 'ε') pos++

            steps++
            pushConfig(action)

            if (pos === inputString.length && this.acceptStates.has(state)) {
                return {
                    accepted: true,
                    reason: 'Цепочка принята по финальному состоянию',
                    history: configHistory
                }
            }
        }

        return {
            accepted: false,
            reason: 'Превышено максимальное число шагов (возможна бесконечная петля)',
            history: configHistory
        }
    }
}
