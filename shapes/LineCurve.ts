import { distance } from "../math/helpers";
import { dot, length, minus, multiply, normalize, plus } from "../math/Vector2";

export function createSegmentCurve(a, b) {
  return {
    type: 'segment',
    a,
    b,
    distanceTo(pt) {
      return segmentDistanceTo(this, pt);
    }
  };
}

export function segmentDistanceTo(seg, pt) {
  const segVec = minus(seg.b, seg.a);
  const segDir = normalize(segVec);
  const apVec = minus(pt, seg.a);
  const project = dot(segDir, apVec);
  if (project < 0) {
    return distance(seg.a, pt);
  }
  if (project > length(segVec)) {
    return distance(seg.b, pt);
  }
  const projectVec = multiply(segDir, project);
  const projectPt = plus(seg.a, projectVec);
  return distance(projectPt, pt);
}