import Tree from "react-d3-tree";

const Grapth = ({ tree }) => {
    if (!tree) return;

    const convertToD3Tree = (node) => ({
        name: `${node.type}${node.value && node.value !== 'ε' ? `: ${node.value}` : ''}`,
        children: node.children.filter(child => child.value !== 'ε').map(child => convertToD3Tree(child)),
    });

    const treeConfig = {
        nodeSize: { x: 200, y: 100 },
        separation: { siblings: 1, nonSiblings: 1.2 },
        translate: { x: 300, y: 80 }
    }

    return (
        <div className="w-[950px] h-[650px] mt-6 bg-white rounded-lg shadow-md">
            <Tree
                data={convertToD3Tree(tree)}
                orientation="vertical"
                {...treeConfig}
                pathFunc="diagonal"
                zoomable={true}
                collapsible={false}
                nodeSvgShape={{
                    shape: 'rect',
                    shapeProps: { width: 100, height: 40, x: -50, y: -20, rx: 5, fill: '#E2E8F0', stroke: '#3B82F6' },
                }}
                textLayout={{ textAnchor: 'middle', x: 0, y: 5 }}
            />
        </div>
    )
}

export default Grapth;