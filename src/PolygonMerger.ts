import { Geometry, union } from "martinez-polygon-clipping";

export default class PolygonMerger {
  polygons: Geometry;

  constructor(polygons: Geometry) {
    this.polygons = polygons;
  }

  mergePolygons(): Geometry {
    if (this.polygons.length === 0) {
      return [];
    }

    // Use martinez-polygon-clipping to merge the polygons
    let merged: Geometry = [this.polygons[0]] as Geometry;
    for (let i = 1; i < this.polygons.length; i++) {
      merged = union([this.polygons[i]] as Geometry, merged);
    }

    return merged;
  }
}
