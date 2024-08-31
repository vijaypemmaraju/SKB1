import { Geom, union } from "martinez-polygon-clipping";
import simplify from "simplify-js";
// import polygonClipping, { Geom } from "polygon-clipping";

export default class PolygonMerger {
  polygons: Geom;

  constructor(polygons: Geom) {
    this.polygons = polygons;
  }

  mergePolygons(): Geom {
    if (this.polygons.length === 0) {
      return [];
    }

    // Use martinez-polygon-clipping to merge the polygons
    let merged: Geom = [this.polygons[0]] as Geom;
    for (let i = 1; i < this.polygons.length; i++) {
      merged = union([this.polygons[i]] as Geom, merged);
    }

    return merged;
  }
}
