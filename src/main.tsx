import { render } from "react-dom";
import "./style.css";
import "./game";
import UI from "./UI";
import ForceGraph, { LinkObject, NodeObject } from "force-graph";
import graphGenerator, {
  NodeType,
  GROUP_COLORS,
  GROUP_NODE_SIZES,
  LinkType,
} from "./graphGenerator";
import useStore from "./useStore";

const graphElement = document.createElement("div");
graphElement.id = "graph";
// graphElement.style.display = "none";
document.body.appendChild(graphElement);

const data = graphGenerator();

const graph = ForceGraph()(graphElement);

graph
  .graphData(data)
  .cooldownTime(2000)
  .d3AlphaDecay(0)
  .d3VelocityDecay(0)
  .height(window.innerHeight / 2)
  // Add collision and bounding box forces
  .nodeId("id")
  .nodeAutoColorBy("group")
  .nodeLabel("id")
  .nodeCanvasObject((node, ctx, globalScale) => {
    ctx.fillStyle = GROUP_COLORS[(node as NodeType).group];
    ctx.beginPath();
    ctx.arc(
      node.x!,
      node.y!,
      GROUP_NODE_SIZES[(node as NodeType).group],
      0,
      2 * Math.PI,
      false
    );
    ctx.fill();
  })
  .linkLabel("group")
  .linkDirectionalArrowLength(4)
  .linkWidth(20)
  .linkCanvasObjectMode(() => "after");

graph.d3Force("link")?.distance((link: LinkType) => {
  return 50;
});

useStore.setState({ forceGraphInstance: graph });

// render(<UI />, document.getElementById("root"));
