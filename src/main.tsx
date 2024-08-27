import { render } from "react-dom";
import "./style.css";
import Phaser from "phaser";
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
import * as d3 from "d3-force";

const graphElement = document.createElement("div");
graphElement.id = "graph";
graphElement.style.display = "none";
document.body.appendChild(graphElement);

const data = graphGenerator();

const graph = ForceGraph()(graphElement);

graph
  .graphData(data)
  .warmupTicks(5000)
  .cooldownTime(1000)
  // .d3AlphaDecay(0.0228)
  // .d3VelocityDecay(0.01)
  // .d3Force("charge")
  .height(window.innerHeight / 2)
  // .height(window.innerHeight)
  // Add collision and bounding box forces
  .nodeId("id")
  .nodeAutoColorBy("depth")
  .nodeLabel("depth")
  .onEngineTick(() => {
    useStore.setState({ forceGraphInstance: graph });
  })
  .nodeCanvasObject((node, ctx, globalScale) => {
    ctx.fillStyle = GROUP_COLORS[(node as NodeType).group];
    ctx.beginPath();
    ctx.arc(
      node.x!,
      node.y!,
      GROUP_NODE_SIZES[(node as NodeType).group],
      0,
      2 * Math.PI,
      false,
    );
    ctx.fill();
  })
  // .linkLabel("group")
  // .linkDirectionalArrowLength(4)
  .linkWidth(10)
  .d3Force('collide', d3.forceCollide(graph.nodeRelSize()))
  .linkCurvature(0.55)
  .linkCanvasObjectMode(() => "after");

graph.d3Force("link")?.distance((link: LinkType) => {
  return Phaser.Math.FloatBetween(75, 155);
});

graph.d3Force("charge")!.strength(() => {
  return Phaser.Math.FloatBetween(-1000, -100);
})


// render(<UI />, document.getElementById("root"));
