export class FiniteAutomaton {
  constructor(states, alphabet, transitions, startState, finalStates) {
    this.states = states;
    this.alphabet = alphabet;
    this.transitions = transitions;
    this.startState = startState;
    this.finalStates = finalStates;
  }

  isDeterministic() {
    for (const state in this.transitions) {
      for (const symbol in this.transitions[state]) {
        if (this.transitions[state][symbol].length > 1) {
          return false;
        }
      }
    }
    return true;
  }

  convertToDFA() {
    if (this.isDeterministic()) {
      return this;
    }

    const dfaStates = new Set();
    const dfaTransitions = {};
    const dfaFinalStates = new Set();
    const queue = [];
    const stateMap = new Map();

    const startClosure = this.epsilonClosure([this.startState]);
    const startStateSet = new Set(startClosure);
    const startStateKey = this.createStateKey(startStateSet);
    
    dfaStates.add(startStateKey);
    stateMap.set(startStateKey, startStateSet);
    queue.push(startStateKey);

    if ([...startStateSet].some(state => this.finalStates.includes(state))) {
      dfaFinalStates.add(startStateKey);
    }

    while (queue.length > 0) {
      const currentStateKey = queue.shift();
      const currentStateSet = stateMap.get(currentStateKey);
      
      dfaTransitions[currentStateKey] = {};

      for (const symbol of this.alphabet) {
        if (symbol === 'ε') continue;
        
        const nextStates = new Set();

        for (const state of currentStateSet) {
          if (this.transitions[state] && this.transitions[state][symbol]) {
            for (const nextState of this.transitions[state][symbol]) {
              nextStates.add(nextState);
            }
          }
        }

        if (nextStates.size > 0) {
          const nextClosure = this.epsilonClosure([...nextStates]);
          const nextStateSet = new Set(nextClosure);
          const nextStateKey = this.createStateKey(nextStateSet);
          
          dfaTransitions[currentStateKey][symbol] = [nextStateKey];
          
          if (!dfaStates.has(nextStateKey)) {
            dfaStates.add(nextStateKey);
            stateMap.set(nextStateKey, nextStateSet);
            queue.push(nextStateKey);

            if ([...nextStateSet].some(state => this.finalStates.includes(state))) {
              dfaFinalStates.add(nextStateKey);
            }
          }
        }
      }
    }

    return new FiniteAutomaton(
      [...dfaStates],
      this.alphabet.filter(symbol => symbol !== 'ε'),
      dfaTransitions,
      startStateKey,
      [...dfaFinalStates]
    );
  }

  createStateKey(stateSet) {
    return JSON.stringify([...stateSet].sort());
  }

  isNFA() {
    for (const state in this.transitions) {
      for (const symbol in this.transitions[state]) {
        if (this.transitions[state][symbol].length > 1) {
          return true;
        }
      }
    }

    for (const state in this.transitions) {
      if (this.transitions[state]['ε'] && this.transitions[state]['ε'].length > 0) {
        return true;
      }
    }
    
    return false;
  }

  addEpsilonTransition(fromState, toState) {
    if (!this.transitions[fromState]) {
      this.transitions[fromState] = {};
    }
    if (!this.transitions[fromState]['ε']) {
      this.transitions[fromState]['ε'] = [];
    }
    if (!this.transitions[fromState]['ε'].includes(toState)) {
      this.transitions[fromState]['ε'].push(toState);
    }
  }

  removeEpsilonTransitions() {
    const newTransitions = {};

    for (const state of this.states) {
      newTransitions[state] = {};
      for (const symbol of this.alphabet) {
        if (symbol !== 'ε') {
          newTransitions[state][symbol] = [];
        }
      }
    }

    for (const state of this.states) {
      const epsilonClosure = this.epsilonClosure([state]);
      
      for (const symbol of this.alphabet) {
        if (symbol === 'ε') continue;
        
        const nextStates = new Set();

        for (const closureState of epsilonClosure) {
          if (this.transitions[closureState] && this.transitions[closureState][symbol]) {
            for (const nextState of this.transitions[closureState][symbol]) {
              nextStates.add(nextState);
            }
          }
        }
        
        if (nextStates.size > 0) {
          newTransitions[state][symbol] = [...nextStates];
        }
      }
    }

    const newFinalStates = [];
    for (const state of this.states) {
      const epsilonClosure = this.epsilonClosure([state]);
      if (epsilonClosure.some(s => this.finalStates.includes(s))) {
        newFinalStates.push(state);
      }
    }

    return new FiniteAutomaton(
      this.states,
      this.alphabet.filter(symbol => symbol !== 'ε'),
      newTransitions,
      this.startState,
      newFinalStates
    );
  }

  epsilonClosure(states) {
    const closure = new Set(states);
    const stack = [...states];
    
    while (stack.length > 0) {
      const state = stack.pop();
      if (this.transitions[state] && this.transitions[state]['ε']) {
        for (const nextState of this.transitions[state]['ε']) {
          if (!closure.has(nextState)) {
            closure.add(nextState);
            stack.push(nextState);
          }
        }
      }
    }
    
    return [...closure];
  }

  minimize() {
    const dfa = this.convertToDFA();

    let partitions = [
      dfa.finalStates,
      dfa.states.filter(s => !dfa.finalStates.includes(s))
    ].filter(p => p.length > 0);

    let changed = true;

    while (changed) {
      changed = false;
      const newPartitions = [];

      for (const partition of partitions) {
        const groups = new Map();

        for (const state of partition) {
          const groupKey = this.getGroupKey(state, partitions, dfa);

          if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
          }
          groups.get(groupKey).push(state);
        }

        if (groups.size > 1) {
          changed = true;
        }

        for (const group of groups.values()) {
          newPartitions.push(group);
        }
      }

      partitions = newPartitions;
    }

    const startPartitionIndex = partitions.findIndex(partition => partition.includes(dfa.startState));
    if (startPartitionIndex > 0) {
      const [startPartition] = partitions.splice(startPartitionIndex, 1);
      partitions.unshift(startPartition);
    }

    const stateMap = {};
    partitions.forEach((partition, index) => {
      const newState = `q${index}`;
      for (const state of partition) {
        stateMap[state] = newState;
      }
    });

    const newTransitions = {};
    for (const partition of partitions) {
      const representative = partition[0];
      const newState = stateMap[representative];
      newTransitions[newState] = {};

      for (const symbol of dfa.alphabet) {
        const next = dfa.transitions[representative]?.[symbol]?.[0];
        if (next) {
          newTransitions[newState][symbol] = [stateMap[next]];
        }
      }
    }

    const newStates = partitions.map((_, index) => `q${index}`);
    const newStartState = 'q0';
    const newFinalStates = [...new Set(
        dfa.finalStates.map(s => stateMap[s])
    )];

    return new FiniteAutomaton(
        newStates,
        dfa.alphabet,
        newTransitions,
        newStartState,
        newFinalStates
    );
  }

  getGroupKey(state, partitions, dfa) {
    const keyParts = [];

    for (const symbol of dfa.alphabet) {
      const nextState = dfa.transitions[state]?.[symbol]?.[0] || null;

      let groupIndex = -1;
      for (let i = 0; i < partitions.length; i++) {
        if (partitions[i].includes(nextState)) {
          groupIndex = i;
          break;
        }
      }

      keyParts.push(`${symbol}:${groupIndex}`);
    }

    return keyParts.join('|');
  }

  validate() {
    const errors = [];
    
    if (!this.states || this.states.length === 0) {
      errors.push('Автомат должен содержать хотя бы одно состояние');
    }
    
    if (!this.alphabet || this.alphabet.length === 0) {
      errors.push('Автомат должен содержать хотя бы один символ алфавита');
    }
    
    if (!this.startState || !this.states.includes(this.startState)) {
      errors.push('Начальное состояние должно быть в списке состояний');
    }
    
    if (!this.finalStates || this.finalStates.length === 0) {
      errors.push('Автомат должен содержать хотя бы одно финальное состояние');
    }
    
    for (const finalState of this.finalStates) {
      if (!this.states.includes(finalState)) {
        errors.push(`Финальное состояние ${finalState} не найдено в списке состояний`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toString() {
    let result = `Состояния: {${this.states.join(', ')}}\n`;
    result += `Алфавит: {${this.alphabet.join(', ')}}\n`;
    result += `Начальное состояние: ${this.startState}\n`;
    result += `Финальные состояния: {${this.finalStates.join(', ')}}\n`;
    result += 'Переходы:\n';
    
    for (const state in this.transitions) {
      for (const symbol in this.transitions[state]) {
        result += `  δ(${state}, ${symbol}) = {${this.transitions[state][symbol].join(', ')}}\n`;
      }
    }
    
    return result;
  }
}

export function createAutomatonFromJSON(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    return new FiniteAutomaton(
      data.states || [],
      data.alphabet || [],
      data.transitions || {},
      data.startState || '',
      data.finalStates || []
    );
  } catch (error) {
    throw new Error('Ошибка при создании автомата из JSON: ' + error.message);
  }
}

function parseMathDefinition(definitionLine) {
  const trimmed = definitionLine.trim();
  if (!trimmed) {
    throw new Error('Пустой ввод');
  }

  const match = trimmed.match(/M\s*=\s*\(\s*\{([^}]+)\}\s*,\s*\{([^}]+)\}\s*,\s*δ\s*,\s*(\w+)\s*,\s*\{([^}]+)\}\s*\)/);
  if (!match) {
    throw new Error('Неверный формат определения автомата. Ожидается: M=({q0, q1, q2}, {0,1}, δ, q0, {q2})');
  }

  const states = match[1].split(',').map(s => s.trim()).filter(Boolean);
  const alphabet = match[2].split(',').map(s => s.trim()).filter(Boolean);
  const startState = match[3].trim();
  const finalStates = match[4].split(',').map(s => s.trim()).filter(Boolean);

  if (!states.includes(startState)) {
    throw new Error(`Начальное состояние ${startState} не найдено в списке состояний`);
  }
  for (const f of finalStates) {
    if (!states.includes(f)) {
      throw new Error(`Финальное состояние ${f} не найдено в списке состояний`);
    }
  }

  return [states, alphabet, startState, finalStates];
}

export function parseTransitionsTable(text, states, alphabet) {
  const transitions = {};
  states.forEach(s => {
    transitions[s] = {};
    alphabet.forEach(a => {
      transitions[s][a] = [];
    });
  });

  if (!text || !text.trim()) return transitions;

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    let from = null; let symbol = null; let toRaw = null;

    let m = line.match(/^δ\s*\(\s*([^,\s]+)\s*,\s*([^\s\)]+)\s*\)\s*=\s*(.+)$/);
    if (m) {
      from = m[1]; symbol = m[2]; toRaw = m[3];
    }

    if (!from) {
      m = line.match(/^([^,\s]+)\s*,\s*([^\s]+)\s*->\s*(.+)$/);
      if (m) { from = m[1]; symbol = m[2]; toRaw = m[3]; }
    }

    if (!from) {
      m = line.match(/^([^\s,]+)\s+([^\s,]+)\s+(\S.*)$/);
      if (m) { from = m[1]; symbol = m[2]; toRaw = m[3]; }
    }

    if (!from) {
      m = line.match(/^([^,\s]+)\s*,\s*([^\s]+)\s*=\s*(.+)$/);
      if (m) { from = m[1]; symbol = m[2]; toRaw = m[3]; }
    }

    if (!from || !symbol || !toRaw) {
      throw new Error(`Не удалось разобрать строку перехода: "${line}"`);
    }

    if (!states.includes(from)) {
      throw new Error(`Переход из неизвестного состояния: ${from}`);
    }
    if (!alphabet.includes(symbol)) {
      throw new Error(`Переход по неизвестному символу алфавита: ${symbol}`);
    }

    let targets = [];
    const brace = toRaw.match(/^\{([^}]+)\}$/);
    if (brace) {
      targets = brace[1].split(',').map(s => s.trim()).filter(Boolean);
    } else {
      targets = toRaw.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (targets.length === 0) continue;

    for (const target of targets) {
      if (!states.includes(target)) {
        throw new Error(`Целевое состояние не найдено: ${target}`);
      }
    }

    if (transitions[from][symbol].length > 0) {
      const existingTargets = transitions[from][symbol];
      const newTargets = targets.filter(target => !existingTargets.includes(target));
      transitions[from][symbol] = [...existingTargets, ...newTargets];
    } else {
      transitions[from][symbol] = targets;
    }
  }

  return transitions;
}

export function createAutomatonFromDefinitionAndTransitions(mathNotation, transitionsText) {
  try {
    const [states, alphabet, startState, finalStates] = parseMathDefinition(mathNotation);
    const transitions = parseTransitionsTable(transitionsText || '', states, alphabet);
    return new FiniteAutomaton(states, alphabet, transitions, startState, finalStates);
  } catch (error) {
    throw new Error('Ошибка при создании автомата из определения и таблицы переходов: ' + error.message);
  }
}

export function createAutomatonFromMathNotation(mathNotation) {
  try {
    const [states, alphabet, startState, finalStates] = parseMathDefinition(mathNotation);
    const transitions = {};

    states.forEach(state => {
      transitions[state] = {};
      alphabet.forEach(symbol => {
        transitions[state][symbol] = [];
      });
    });

    const stateIndex = states.indexOf(startState);
    const finalStateIndices = finalStates.map(state => states.indexOf(state));
    
    for (let i = 0; i < states.length - 1; i++) {
      const currentState = states[i];
      const nextState = states[i + 1];
      
      alphabet.forEach(symbol => {
        if (Math.random() < 0.8) {
          if (Math.random() < 0.8) {
            transitions[currentState][symbol] = [nextState];
          } else {
            const additionalStates = states.filter(s => s !== currentState && s !== nextState);
            const numAdditional = Math.min(1, Math.floor(Math.random() * 2));
            const selectedStates = [nextState];
            
            for (let j = 0; j < numAdditional && additionalStates.length > 0; j++) {
              const randomIndex = Math.floor(Math.random() * additionalStates.length);
              selectedStates.push(additionalStates.splice(randomIndex, 1)[0]);
            }
            
            transitions[currentState][symbol] = selectedStates;
          }
        }
      });
    }

    const lastState = states[states.length - 1];
    alphabet.forEach(symbol => {
      if (Math.random() < 0.6) {
        const targetState = Math.random() < 0.7 ? lastState : states[Math.floor(Math.random() * states.length)];
        transitions[lastState][symbol] = [targetState];
      }
    });

    states.forEach(fromState => {
      alphabet.forEach(symbol => {
        if (transitions[fromState][symbol].length === 0 && Math.random() < 0.3) {
          if (Math.random() < 0.7) {
            const randomNextState = states[Math.floor(Math.random() * states.length)];
            transitions[fromState][symbol] = [randomNextState];
          } else {
            const numTargets = Math.random() < 0.5 ? 2 : 3;
            const availableStates = states.filter(s => s !== fromState);
            const selectedStates = [];
            
            for (let i = 0; i < Math.min(numTargets, availableStates.length); i++) {
              const randomIndex = Math.floor(Math.random() * availableStates.length);
              const selectedState = availableStates.splice(randomIndex, 1)[0];
              selectedStates.push(selectedState);
            }
            
            transitions[fromState][symbol] = selectedStates;
          }
        }
      });
    });

    const hasTransitionFromStart = alphabet.some(symbol => 
      transitions[startState][symbol].length > 0
    );
    
    if (!hasTransitionFromStart) {
      const randomSymbol = alphabet[Math.floor(Math.random() * alphabet.length)];
      const randomNextState = states[Math.floor(Math.random() * states.length)];
      transitions[startState][randomSymbol] = [randomNextState];
    }

    finalStates.forEach(finalState => {
      alphabet.forEach(symbol => {
        if (Math.random() < 0.5) {
          transitions[finalState][symbol] = [finalState];
        }
      });
    });

    return new FiniteAutomaton(states, alphabet, transitions, startState, finalStates);
    
  } catch (error) {
    throw new Error('Ошибка при создании автомата из математической нотации: ' + error.message);
  }
}

export function createExampleNFA() {
  return new FiniteAutomaton(
    ['q0', 'q1', 'q2', 'q3'],
    ['a', 'b'],
    {
      'q0': { 'a': ['q0', 'q1'] },
      'q1': { 'b': ['q2'] },
      'q2': { 'a': ['q3'] },
      'q3': { 'b': ['q3'] }
    },
    'q0',
    ['q3']
  );
}

export function createExampleNFAWithEpsilon() {
  return new FiniteAutomaton(
    ['q0', 'q1', 'q2', 'q3', 'q4'],
    ['a', 'b', 'ε'],
    {
      'q0': { 'a': ['q1'], 'ε': ['q2'] },
      'q1': { 'b': ['q3'] },
      'q2': { 'a': ['q4'] },
      'q3': { 'ε': ['q4'] },
      'q4': { 'b': ['q4'] }
    },
    'q0',
    ['q4']
  );
}

export function createComplexNFA() {
  return new FiniteAutomaton(
    ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'],
    ['a', 'b', 'c', 'ε'],
    {
      'q0': { 'a': ['q1', 'q2'], 'ε': ['q3'] },
      'q1': { 'b': ['q4'], 'ε': ['q2'] },
      'q2': { 'c': ['q5'] },
      'q3': { 'a': ['q4'] },
      'q4': { 'b': ['q5'], 'ε': ['q1'] },
      'q5': { 'c': ['q5'] }
    },
    'q0',
    ['q5']
  );
}
