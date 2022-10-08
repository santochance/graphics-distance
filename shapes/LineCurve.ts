import { distance } from "../helpers";
import { createVectorFromPts, dot, length, multiply, normalize, plus } from "../vector";

export function createSegmentCurve(a, b) {
  return {
    type: 'segment',
    a,
    b,
  };
}

export function segmentDistanceTo(seg, pt) {
  const segVec = createVectorFromPts(seg.a, seg.b);
  const segDir = normalize(segVec);
  const apVec = createVectorFromPts(seg.a, pt);
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