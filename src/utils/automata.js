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
    // Примечание: состояния ДКА уже представлены строками-идентификаторами.
    // Если автомат был получен из НКА, состояния представлены как строковые ключи-множества,
    // например "[\"q0\",\"q1\"]". Их не нужно парсить для работы алгоритма —
    // мы используем эти строки как атомарные идентификаторы состояний.

    // Начальное разбиение: финальные / нефинальные
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

    // Обеспечиваем, чтобы класс, содержащий начальное состояние, был первым (станет q0)
    const startPartitionIndex = partitions.findIndex(partition => partition.includes(dfa.startState));
    if (startPartitionIndex > 0) {
      const [startPartition] = partitions.splice(startPartitionIndex, 1);
      partitions.unshift(startPartition);
    }

    // Создаем отображение старое состояние → новое
    const stateMap = {};
    partitions.forEach((partition, index) => {
      const newState = `q${index}`;
      for (const state of partition) {
        stateMap[state] = newState;
      }
    });

    // Строим новые переходы
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

/**
 * Парсит строковое представление определения M=({states}, {alphabet}, δ, start, {finals})
 * Возвращает кортеж [states, alphabet, startState, finalStates]
 */
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

/**
 * Парсит таблицу переходов из текста.
 * Поддерживаемые форматы строк (по одной на переход):
 *  - δ(q0, a) = q1
 *  - q0, a -> q1
 *  - q0 a q1
 *  - q0,a=q1
 *  - q0, a = {q1}
 * Между токенами допускаются пробелы. Для ДКА допускается только один целевой узел.
 */
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

    // Попробуем несколько шаблонов
    let from = null; let symbol = null; let toRaw = null;

    // 1) δ(q0, a) = q1
    let m = line.match(/^δ\s*\(\s*([^,\s]+)\s*,\s*([^\s\)]+)\s*\)\s*=\s*(.+)$/);
    if (m) {
      from = m[1]; symbol = m[2]; toRaw = m[3];
    }

    // 2) q0, a -> q1
    if (!from) {
      m = line.match(/^([^,\s]+)\s*,\s*([^\s]+)\s*->\s*(.+)$/);
      if (m) { from = m[1]; symbol = m[2]; toRaw = m[3]; }
    }

    // 3) q0 a q1  (через пробел)
    if (!from) {
      m = line.match(/^([^\s,]+)\s+([^\s,]+)\s+(\S.*)$/);
      if (m) { from = m[1]; symbol = m[2]; toRaw = m[3]; }
    }

    // 4) q0,a=q1
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

    // Разбираем правую часть: может быть q1 или {q1} или {q1, q2}
    let targets = [];
    const brace = toRaw.match(/^\{([^}]+)\}$/);
    if (brace) {
      targets = brace[1].split(',').map(s => s.trim()).filter(Boolean);
    } else {
      targets = toRaw.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (targets.length === 0) continue;
    if (targets.length > 1) {
      throw new Error(`Для ДКА должен быть один целевой переход: ${from}, ${symbol}`);
    }

    const to = targets[0];
    if (!states.includes(to)) {
      throw new Error(`Целевое состояние не найдено: ${to}`);
    }

    transitions[from][symbol] = [to];
  }

  return transitions;
}

/**
 * Создает автомат из математического определения и явной таблицы переходов.
 * При отсутствии записи для пары (q, a) оставляет пустой переход.
 */
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
