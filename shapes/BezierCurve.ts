import { Vector } from '../vector';
import { BBox } from '../BBox';
import { createSegmentCurve, segmentDistanceTo } from "./LineCurve";

export function bezierDistanceTo(bezier, pt, scale = 1) {
  const hull = ConvexHull2D([bezier.a, bezier.b, bezier.cp1, bezier.cp2]);
  const expandedHull = polygonOffset(hull, 1 + 0.3 / scale);
  if (isPointInsidePolygon(pt, expandedHull)) {
    bezier.lut = LUT(bezier.a, bezier.b, bezier.cp1, bezier.cp2, scale);
    return closestNormalDistance(pt, bezier.lut);
  }
  return Infinity;
}

export function ConvexHull2D(points) {
  function removeMiddle(a, b, c) {
    const cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
    const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
    return cross < 0 || (cross == 0 && dot <= 0);
  }

  points.sort(function (a, b) {
    return a.x !== b.x ? a.x - b.x : a.y - b.y;
  });

  const n = points.length;
  const hull = [];

  for (let i = 0; i < 2 * n; i++) {
    const j = i < n ? i : 2 * n - 1 - i;
    while (
      hull.length >= 2 &&
      removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j])
    ) {
      hull.pop();
    }
    hull.push(points[j]);
  }
  hull.pop();
  return hull;
}

export function polygonOffset(polygon, scale) {
  return polygonOffsetXY(polygon, scale, scale);
}

export function polygonOffsetXY(polygon, scaleX, scaleY) {
  const origBBox = new BBox();
  const scaledBBox = new BBox();
  const result = [];
  for (const point of polygon) {
    const scaledPoint = new Vector(point.x * scaleX, point.y * scaleY);
    result.push(scaledPoint);
    origBBox.checkPoint(point);
    scaledBBox.checkPoint(scaledPoint);
  }
  const alignVector = scaledBBox.center()._minus(origBBox.center());
  for (const point of result) {
    point._minus(alignVector);
  }
  return result;
}

export const TIGHT_TOLERANCE = 1e-6;

export function isPointInsidePolygon(inPt, inPolygon) {
  const EPSILON = TIGHT_TOLERANCE;

  const polyLen = inPolygon.length;

  // inPt on polygon contour => immediate success    or
  // toggling of inside/outside at every single! intersection point of an edge
  //  with the horizontal line through inPt, left of inPt
  //  not counting lowerY endpoints of edges and whole edges on that line
  let inside = false;
  for (let p = polyLen - 1, q = 0; q < polyLen; p = q++) {
    let edgeLowPt = inPolygon[p];
    let edgeHighPt = inPolygon[q];

    let edgeDx = edgeHighPt.x - edgeLowPt.x;
    let edgeDy = edgeHighPt.y - edgeLowPt.y;

    if (Math.abs(edgeDy) > EPSILON) {
      // not parallel
      if (edgeDy < 0) {
        edgeLowPt = inPolygon[q];
        edgeDx = -edgeDx;
        edgeHighPt = inPolygon[p];
        edgeDy = -edgeDy;
      }
      if (inPt.y < edgeLowPt.y || inPt.y > edgeHighPt.y) continue;

      if (inPt.y == edgeLowPt.y) {
        if (inPt.x == edgeLowPt.x) return true; // inPt is on contour ?
        // continue;				// no intersection or edgeLowPt => doesn't count !!!
      } else {
        const perpEdge =
          edgeDy * (inPt.x - edgeLowPt.x) - edgeDx * (inPt.y - edgeLowPt.y);
        if (perpEdge == 0) return true; // inPt is on contour ?
        if (perpEdge < 0) continue;
        inside = !inside; // true intersection left of inPt
      }
    } else {
      // parallel or colinear
      if (inPt.y != edgeLowPt.y) continue; // parallel
      // egde lies on the same horizontal line as inPt
      if (
        (edgeHighPt.x <= inPt.x && inPt.x <= edgeLowPt.x) ||
        (edgeLowPt.x <= inPt.x && inPt.x <= edgeHighPt.x)
      )
        return true; // inPt: Point on contour !
      // continue;
    }
  }

  return inside;
}

export function LUT(a, b, cp1, cp2, scale) {
  scale = 1 / scale;
  const lut = [];
  for (let t = 0; t < 1; t += 0.1 * scale) {
    const p = compute(t, a, b, cp1, cp2);
    lut.push(p);
  }
  lut[0] = a;
  lut[lut.length - 1] = b;
  return lut;
}

export function compute(t, from, to, controlPoint1, controlPoint2) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  const a = mt2 * mt;
  const b = mt2 * t * 3;
  const c = mt * t2 * 3;
  const d = t * t2;
  const p0 = from;
  const p3 = to;
  const p1 = controlPoint1;
  const p2 = controlPoint2;
  return new Vector(
    a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    a * p0.z + b * p1.z + c * p2.z + d * p3.z
  );
}

export function closestNormalDistance(aim, segments) {
  let hero = -1;
  for (let p = segments.length - 1, q = 0; q < segments.length; p = q++) {
    const dist = Math.min(
      segmentDistanceTo(createSegmentCurve(segments[p], segments[q]), aim)
    );
    if (dist !== -1) {
      hero = hero === -1 ? dist : Math.min(dist, hero);
    }
  }
  return hero;
}

export function createBezierCurve(a, b, cp1, cp2) {
  return {
    type: 'bezier',
    a,
    b,
    cp1,
    cp2,
  };
}