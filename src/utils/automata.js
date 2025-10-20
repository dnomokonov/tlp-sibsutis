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
    
    const startClosure = this.epsilonClosure([this.startState]);
    const startStateSet = new Set(startClosure);
    dfaStates.add(JSON.stringify([...startStateSet].sort()));
    queue.push(startStateSet);

    if ([...startStateSet].some(state => this.finalStates.includes(state))) {
      dfaFinalStates.add(JSON.stringify([...startStateSet].sort()));
    }

    while (queue.length > 0) {
      const currentStateSet = queue.shift();
      const currentStateKey = JSON.stringify([...currentStateSet].sort());
      
      dfaTransitions[currentStateKey] = {};

      for (const symbol of this.alphabet) {
        const nextStates = new Set();
        
        for (const state of currentStateSet) {
          if (this.transitions[state] && this.transitions[state][symbol]) {
            for (const nextState of this.transitions[state][symbol]) {
              nextStates.add(nextState);
            }
          }
        }

        if (nextStates.size > 0) {
          const nextStateKey = JSON.stringify([...nextStates].sort());
          dfaTransitions[currentStateKey][symbol] = [nextStateKey];
          
          if (!dfaStates.has(nextStateKey)) {
            dfaStates.add(nextStateKey);
            queue.push(nextStates);
            
            if ([...nextStates].some(state => this.finalStates.includes(state))) {
              dfaFinalStates.add(nextStateKey);
            }
          }
        }
      }
    }

    return new FiniteAutomaton(
      [...dfaStates],
      this.alphabet,
      dfaTransitions,
      JSON.stringify([...startClosure].sort()),
      [...dfaFinalStates]
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
      dfa.states.filter(state => !dfa.finalStates.includes(state))
    ].filter(partition => partition.length > 0);

    let changed = true;
    while (changed) {
      changed = false;
      const newPartitions = [];

      for (const partition of partitions) {
        const groups = {};
        
        for (const state of partition) {
          const groupKey = this.getGroupKey(state, partitions, dfa);
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(state);
        }

        for (const group of Object.values(groups)) {
          if (group.length > 0) {
            newPartitions.push(group);
          }
        }
      }

      if (newPartitions.length !== partitions.length) {
        changed = true;
        partitions = newPartitions;
      }
    }

    const stateMap = {};
    const newStates = [];
    const newTransitions = {};
    const newFinalStates = [];

    partitions.forEach((partition, index) => {
      const newState = `q${index}`;
      newStates.push(newState);
      stateMap[partition[0]] = newState;
      
      if (partition.some(state => dfa.finalStates.includes(state))) {
        newFinalStates.push(newState);
      }
    });

    for (const partition of partitions) {
      const newState = stateMap[partition[0]];
      newTransitions[newState] = {};
      
      for (const symbol of dfa.alphabet) {
        if (dfa.transitions[partition[0]] && dfa.transitions[partition[0]][symbol]) {
          const nextState = dfa.transitions[partition[0]][symbol][0];
          const nextPartition = partitions.find(p => p.includes(nextState));
          if (nextPartition) {
            newTransitions[newState][symbol] = [stateMap[nextPartition[0]]];
          }
        }
      }
    }

    const startState = stateMap[dfa.startState];

    return new FiniteAutomaton(
      newStates,
      dfa.alphabet,
      newTransitions,
      startState,
      newFinalStates
    );
  }

  getGroupKey(state, partitions, dfa) {
    const key = [];
    
    for (const symbol of dfa.alphabet) {
      let nextState = null;
      if (dfa.transitions[state] && dfa.transitions[state][symbol]) {
        nextState = dfa.transitions[state][symbol][0];
      }
      
      let groupIndex = -1;
      for (let i = 0; i < partitions.length; i++) {
        if (partitions[i].includes(nextState)) {
          groupIndex = i;
          break;
        }
      }
      key.push(groupIndex);
    }
    
    return key.join(',');
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

export function createAutomatonFromMathNotation(mathNotation) {
  try {
    const definitionLine = mathNotation.trim();
    
    if (!definitionLine) {
      throw new Error('Пустой ввод');
    }

    const definitionMatch = definitionLine.match(/M\s*=\s*\(\s*\{([^}]+)\}\s*,\s*\{([^}]+)\}\s*,\s*δ\s*,\s*(\w+)\s*,\s*\{([^}]+)\}\s*\)/);
    
    if (!definitionMatch) {
      throw new Error('Неверный формат определения автомата. Ожидается: M=({q0, q1, q2}, {0,1}, δ, q0, {q2})');
    }

    const states = definitionMatch[1].split(',').map(s => s.trim()).filter(s => s);
    const alphabet = definitionMatch[2].split(',').map(s => s.trim()).filter(s => s);
    const startState = definitionMatch[3].trim();
    const finalStates = definitionMatch[4].split(',').map(s => s.trim()).filter(s => s);

    if (!states.includes(startState)) {
      throw new Error(`Начальное состояние ${startState} не найдено в списке состояний`);
    }

    for (const finalState of finalStates) {
      if (!states.includes(finalState)) {
        throw new Error(`Финальное состояние ${finalState} не найдено в списке состояний`);
      }
    }

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
          transitions[currentState][symbol] = [nextState];
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
          const randomNextState = states[Math.floor(Math.random() * states.length)];
          transitions[fromState][symbol] = [randomNextState];
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
