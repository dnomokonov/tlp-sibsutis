import { useEffect, useRef } from 'react'

const AutomataGraph = ({ automaton, title, isMinimized = false }) => {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!automaton || !svgRef.current) return

    const svg = svgRef.current
    const width = 800
    const height = 400
    const margin = 50

    svg.innerHTML = ''

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svg.appendChild(g)

    const states = automaton.states
    const statePositions = {}
    const radius = Math.min(width, height) / 2 - margin
    const centerX = width / 2
    const centerY = height / 2

    states.forEach((state, index) => {
      const angle = (2 * Math.PI * index) / states.length
      statePositions[state] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    })

    const transitions = automaton.transitions
    const drawnTransitions = new Set()

    for (const fromState in transitions) {
      for (const symbol in transitions[fromState]) {
        const toStates = transitions[fromState][symbol]
        if (toStates.length === 0) continue

        toStates.forEach(toState => {
          const transitionKey = `${fromState}-${symbol}-${toState}`
          if (drawnTransitions.has(transitionKey)) return
          drawnTransitions.add(transitionKey)

          const fromPos = statePositions[fromState]
          const toPos = statePositions[toState]
          const dx = toPos.x - fromPos.x
          const dy = toPos.y - fromPos.y

          const distance = Math.sqrt(dx * dx + dy * dy)
          const unitX = dx / distance
          const unitY = dy / distance

          const stateRadius = 25
          const startX = fromPos.x + unitX * stateRadius
          const startY = fromPos.y + unitY * stateRadius
          const endX = toPos.x - unitX * stateRadius
          const endY = toPos.y - unitY * stateRadius

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          line.setAttribute('x1', startX)
          line.setAttribute('y1', startY)
          line.setAttribute('x2', endX)
          line.setAttribute('y2', endY)
          line.setAttribute('stroke', '#374151')
          line.setAttribute('stroke-width', '2')
          line.setAttribute('marker-end', 'url(#arrowhead)')
          g.appendChild(line)

          if (fromState === toState) {
            const loopRadius = 40
            const loopX = fromPos.x + loopRadius
            const loopY = fromPos.y - loopRadius
            
            const loop = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            loop.setAttribute('d', `M ${fromPos.x + stateRadius} ${fromPos.y} A ${loopRadius} ${loopRadius} 0 1 1 ${fromPos.x - stateRadius} ${fromPos.y}`)
            loop.setAttribute('stroke', '#374151')
            loop.setAttribute('stroke-width', '2')
            loop.setAttribute('fill', 'none')
            loop.setAttribute('marker-end', 'url(#arrowhead)')
            g.appendChild(loop)
          }

          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2
          
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          text.setAttribute('x', midX)
          text.setAttribute('y', midY - 5)
          text.setAttribute('text-anchor', 'middle')
          text.setAttribute('font-size', '12')
          text.setAttribute('fill', '#374151')
          text.setAttribute('font-weight', 'bold')
          text.textContent = symbol
          g.appendChild(text)
        })
      }
    }

    states.forEach(state => {
      const pos = statePositions[state]
      const isStart = state === automaton.startState
      const isFinal = automaton.finalStates.includes(state)

      if (isFinal) {
        const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        outerCircle.setAttribute('cx', pos.x)
        outerCircle.setAttribute('cy', pos.y)
        outerCircle.setAttribute('r', 30)
        outerCircle.setAttribute('fill', 'none')
        outerCircle.setAttribute('stroke', '#DC2626')
        outerCircle.setAttribute('stroke-width', '3')
        g.appendChild(outerCircle)
      }

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', pos.x)
      circle.setAttribute('cy', pos.y)
      circle.setAttribute('r', 25)
      circle.setAttribute('fill', isStart ? '#3B82F6' : '#F3F4F6')
      circle.setAttribute('stroke', isStart ? '#1D4ED8' : '#374151')
      circle.setAttribute('stroke-width', '2')
      g.appendChild(circle)

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', pos.x)
      text.setAttribute('y', pos.y + 5)
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-size', '14')
      text.setAttribute('fill', isStart ? 'white' : '#374151')
      text.setAttribute('font-weight', 'bold')
      text.textContent = state
      g.appendChild(text)

      if (isStart) {
        const startX = pos.x - 50
        const startY = pos.y
        
        const startLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        startLine.setAttribute('x1', startX)
        startLine.setAttribute('y1', startY)
        startLine.setAttribute('x2', pos.x - 25)
        startLine.setAttribute('y2', pos.y)
        startLine.setAttribute('stroke', '#374151')
        startLine.setAttribute('stroke-width', '2')
        startLine.setAttribute('marker-end', 'url(#arrowhead)')
        g.appendChild(startLine)
      }
    })

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    marker.setAttribute('id', 'arrowhead')
    marker.setAttribute('markerWidth', '10')
    marker.setAttribute('markerHeight', '7')
    marker.setAttribute('refX', '9')
    marker.setAttribute('refY', '3.5')
    marker.setAttribute('orient', 'auto')

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7')
    polygon.setAttribute('fill', '#374151')
    marker.appendChild(polygon)
    defs.appendChild(marker)
    svg.appendChild(defs)

  }, [automaton, isMinimized])

  if (!automaton) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        {title}
      </h3>
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          width="800"
          height="400"
          className="border border-gray-200 rounded"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-center !space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Начальное состояние</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-red-500 rounded-full mr-2"></div>
            <span>Финальное состояние</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full mr-2"></div>
            <span>Обычное состояние</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutomataGraph
