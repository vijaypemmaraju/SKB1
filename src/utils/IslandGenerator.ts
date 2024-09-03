import { ForceGraphInstance, GraphData } from "force-graph";
import { LinkType, NodeType } from "../graphGenerator";
import Offset from "polygon-offset";
import PolygonMerger from "../PolygonMerger";
import { Geom } from "polygon-clipping";

export default class IslandGenerator {
  scaleMultiplier: number;
  forceGraphInstance: ForceGraphInstance;
  data: GraphData;

  constructor(scaleMultiplier: number, forceGraphInstance: ForceGraphInstance) {
    this.scaleMultiplier = scaleMultiplier;
    this.forceGraphInstance = forceGraphInstance;

    this.data = this.normalizeGraphData();
  }

  setForceGraphInstance(forceGraphInstance: ForceGraphInstance) {
    this.forceGraphInstance = forceGraphInstance;
    this.data = this.normalizeGraphData();
  }

  normalizeGraphData() {
    const data = this.forceGraphInstance.graphData();
    const movedData: GraphData = { nodes: [], links: [] };

    for (let i = 0; i < data.nodes.length; i++) {
      const n = data.nodes[i] as NodeType;
      movedData.nodes.push({
        ...n,
        x: n.x! / this.scaleMultiplier,
        y: n.y! / this.scaleMultiplier,
      });
    }

    for (let i = 0; i < data.links.length; i++) {
      const l = data.links[i] as LinkType;
      const source = l.source as NodeType;
      const target = l.target as NodeType;
      movedData.links.push({
        ...l,
        source: {
          ...source,
          x: source.x! / this.scaleMultiplier,
          y: source.y! / this.scaleMultiplier,
        },
        target: {
          ...target,
          x: target.x! / this.scaleMultiplier,
          y: target.y! / this.scaleMultiplier,
        },
        __controlPoints: (l as any).__controlPoints
          ? [
              (l as any).__controlPoints[0] / this.scaleMultiplier,
              (l as any).__controlPoints[1] / this.scaleMultiplier,
            ]
          : undefined,
      });
    }

    return movedData;
  }

  getMidpoint(): { x: number; y: number } {
    const nodes = this.data.nodes;
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < nodes.length; i++) {
      sumX += (nodes[i] as NodeType).x!;
      sumY += (nodes[i] as NodeType).y!;
    }

    return {
      x: sumX / nodes.length,
      y: sumY / nodes.length,
    };
  }

  generateIslands() {
    const links = this.data.links;
    const polygons = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const startX = Math.floor((link.source as NodeType).x!);
      const startY = Math.floor((link.source as NodeType).y!);
      const endX = Math.floor((link.target as NodeType).x!);
      const endY = Math.floor((link.target as NodeType).y!);

      const bezier = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(startX, startY),
        (link as any).__controlPoints
          ? new Phaser.Math.Vector2(
              (link as any).__controlPoints[0],
              (link as any).__controlPoints[1]
            )
          : new Phaser.Math.Vector2(startX, startY),
        new Phaser.Math.Vector2(endX, endY)
      );

      const distancePoints = bezier.getDistancePoints(
        50 / this.scaleMultiplier
      );
      const points = [];
      for (let j = 0; j < distancePoints.length; j++) {
        points.push([distancePoints[j].x, distancePoints[j].y]);
      }

      const offsetPoints = new Offset()
        .data(points)
        .offsetLine(50 / this.scaleMultiplier)
        .flat();
      (link as any).offsetPoints = offsetPoints;
      polygons.push(offsetPoints);
    }

    let merged = new PolygonMerger(polygons as Geom).mergePolygons();
    merged = new PolygonMerger(merged[0] as Geom).mergePolygons();
    return merged[0].flat();
  }
}
