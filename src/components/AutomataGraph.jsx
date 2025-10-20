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

    let scale = 1
    let panX = 0
    let panY = 0
    let isPanning = false
    let lastX = 0
    let lastY = 0

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val))
    const updateTransform = () => {
      g.setAttribute('transform', `translate(${panX},${panY}) scale(${scale})`)
    }
    updateTransform()

    const getMousePos = (evt) => {
      const rect = svg.getBoundingClientRect()
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    }

    const onWheel = (evt) => {
      evt.preventDefault()
      const delta = evt.deltaY
      const zoomIntensity = 0.0015
      const oldScale = scale
      const newScale = clamp(oldScale * (1 - delta * zoomIntensity), 0.25, 5)
      const { x: mx, y: my } = getMousePos(evt)

      // Центрируем масштаб относительно позиции курсора
      panX = mx - (mx - panX) * (newScale / oldScale)
      panY = my - (my - panY) * (newScale / oldScale)
      scale = newScale
      updateTransform()
    }

    const onMouseDown = (evt) => {
      isPanning = true
      lastX = evt.clientX
      lastY = evt.clientY
    }
    const onMouseMove = (evt) => {
      if (!isPanning) return
      const dx = evt.clientX - lastX
      const dy = evt.clientY - lastY
      lastX = evt.clientX
      lastY = evt.clientY
      panX += dx
      panY += dy
      updateTransform()
    }
    const endPan = () => { isPanning = false }

    svg.addEventListener('wheel', onWheel, { passive: false })
    svg.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endPan)
    svg.addEventListener('mouseleave', endPan)

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

    // 1) Агрегируем переходы: пара (from,to) -> список символов
    const transitions = automaton.transitions
    const edgeMap = new Map()
    for (const fromState in transitions) {
      for (const symbol in transitions[fromState]) {
        const toStates = transitions[fromState][symbol]
        if (!toStates || toStates.length === 0) continue
        toStates.forEach(toState => {
          const key = `${fromState}||${toState}`
          if (!edgeMap.has(key)) {
            edgeMap.set(key, { from: fromState, to: toState, symbols: new Set() })
          }
          edgeMap.get(key).symbols.add(symbol)
        })
      }
    }

    const stateRadius = 25
    const baseCurvature = 40 // базовая степень изгиба для двунаправленных рёбер

    // 2) Отрисовываем рёбра
    for (const [key, edge] of edgeMap) {
      const fromState = edge.from
      const toState = edge.to
      const fromPos = statePositions[fromState]
      const toPos = statePositions[toState]
      const labelTextBase = Array.from(edge.symbols).sort().join(', ')

      if (fromState === toState) {
        // Петля
        const loopRadius = 40
        const loop = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        loop.setAttribute('d', `M ${fromPos.x + stateRadius} ${fromPos.y} A ${loopRadius} ${loopRadius} 0 1 1 ${fromPos.x - stateRadius} ${fromPos.y}`)
        loop.setAttribute('stroke', '#374151')
        loop.setAttribute('stroke-width', '2')
        loop.setAttribute('fill', 'none')
        loop.setAttribute('marker-end', 'url(#arrowhead)')
        g.appendChild(loop)

        // Подпись петли
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        label.setAttribute('x', fromPos.x + loopRadius)
        label.setAttribute('y', fromPos.y - loopRadius - 6)
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('font-size', '12')
        label.setAttribute('fill', '#374151')
        label.setAttribute('font-weight', 'bold')
        label.textContent = labelTextBase
        g.appendChild(label)
        continue
      }

      const dx = toPos.x - fromPos.x
      const dy = toPos.y - fromPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const unitX = dx / distance
      const unitY = dy / distance

      const startX = fromPos.x + unitX * stateRadius
      const startY = fromPos.y + unitY * stateRadius
      const endX = toPos.x - unitX * stateRadius
      const endY = toPos.y - unitY * stateRadius

      const reverseKey = `${toState}||${fromState}`
      const isBidirectional = edgeMap.has(reverseKey)

      if (isBidirectional) {
        const normalX = -unitY
        const normalY = unitX
        const sign = fromState < toState ? 1 : -1
        const localCurvature = Math.min(70, Math.max(30, (distance * 0.18)))
        const cx = (startX + endX) / 2 + normalX * localCurvature * sign
        const cy = (startY + endY) / 2 + normalY * localCurvature * sign

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', '#374151')
        path.setAttribute('stroke-width', '2')
        path.setAttribute('marker-end', 'url(#arrowhead)')
        g.appendChild(path)

        // Для двунаправленных рёбер подписываем ОДИН раз на паре (A,B): объединяем символы A→B и B→A
        // Рисуем подпись только когда fromState < toState, чтобы не дублировать
        if (fromState < toState) {
          const reverseEdge = edgeMap.get(reverseKey)
          const combined = new Set([...(edge.symbols || []), ...((reverseEdge && reverseEdge.symbols) || [])])
          const labelText = Array.from(combined).sort().join(', ')

          // Точка на кривой в середине пары и смещение наружу
          const t = 0.5
          const qx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cx + t * t * endX
          const qy = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cy + t * t * endY

          const offsetN = 16 + Math.min(26, localCurvature * 0.35)
          const lx = qx + normalX * offsetN * sign
          const ly = qy + normalY * offsetN * sign
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          text.setAttribute('x', lx)
          text.setAttribute('y', ly)
          text.setAttribute('text-anchor', 'middle')
          text.setAttribute('font-size', '12')
          text.setAttribute('fill', '#374151')
          text.setAttribute('font-weight', 'bold')
          text.textContent = labelText
          g.appendChild(text)
        }
      } else {
        // Обычная прямая
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', startX)
        line.setAttribute('y1', startY)
        line.setAttribute('x2', endX)
        line.setAttribute('y2', endY)
        line.setAttribute('stroke', '#374151')
        line.setAttribute('stroke-width', '2')
        line.setAttribute('marker-end', 'url(#arrowhead)')
        g.appendChild(line)

        // Подпись не в геометрическом центре, а ближе к концу, чтобы избежать пересечений
        const tLine = 0.6
        const midX = startX + (endX - startX) * tLine
        const midY = startY + (endY - startY) * tLine
        const normalX = -unitY
        const normalY = unitX
        const offsetN = 14 + Math.max(0, 30 - distance * 0.1)
        const offsetT = 10
        const lx = midX + normalX * offsetN + unitX * offsetT
        const ly = midY + normalY * offsetN + unitY * offsetT
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', lx)
        text.setAttribute('y', ly)
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('font-size', '12')
        text.setAttribute('fill', '#374151')
        text.setAttribute('font-weight', 'bold')
        text.textContent = labelTextBase
        g.appendChild(text)
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

    // Очистка слушателей при размонтировании/перерисовке
    return () => {
      svg.removeEventListener('wheel', onWheel)
      svg.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endPan)
      svg.removeEventListener('mouseleave', endPan)
    }

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
