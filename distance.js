import {
  createVectorFromPts,
  multiply,
  length,
  normalize,
  plus,
  minus,
  dot,
  angle,
} from './vector';
import { parsePath } from 'path-data-parser';
import { convSvgEllipseParams } from './convertEllipseParams';
import { svgArcToCenterParam } from './svgArcToCenterParam';

// M 100 100 A 20 20 20 1 1 0 100
function test() {
  const [x1, y1, rx, ry, phi, fa, fs, x2, y2] = [
    0, 0, 20, 20, 20, 1, 1, 0, 100,
  ];
  // const result1 = convSvgEllipseParams(
  //   { x: x1, y: y1 },
  //   { x: x2, y: y2 },
  //   rx,
  //   ry,
  //   phi,
  //   fa,
  //   fs
  // );
  // console.log('result1', result1);
  const result2 = svgArcToCenterParam(x1, y1, rx, ry, phi, fa, fs, x2, y2);
  console.log('result2', result2);
}
// test();

function initStage() {
  console.log('[stage] inited');
  const stage = document.querySelector('.stage');

  const elems = Array.from(stage.querySelectorAll('path'));
  elems.forEach((elem) => {
    const curves = parseCurves(elem);
    elem.curves = curves;
    elem.dataset['curves'] = JSON.stringify(curves);
  });

  const onMousedown = (ev) => {
    const pos = getCurrentPosition(ev);
    const hits = elems.filter((elem) => {
      const isTouched = isTouchPathElement(elem, pos);
      return isTouched;
    });
    console.log('hit elems', hits);
    elems.forEach((el) => {
      el.classList.remove('is-hit');
    });
    hits.forEach((el) => {
      el.classList.add('is-hit');
    });
  };
  stage.addEventListener('mousedown', onMousedown);
}

function getCurrentPosition(ev) {
  return { x: ev.offsetX, y: ev.offsetY };
}

function segmentDistanceTo(seg, pt) {
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

function arcDistanceTo(arc, pt) {
  let dist;
  if (isPointInArcSector(arc, pt)) {
    dist = Math.abs(distance(arc.c, pt) - arc.radiuX);
  } else {
    dist = Math.max(distance(arc.s, pt), distance(arc.e, pt));
  }
  return dist;
}

function isPointInArcSector(arc, pt) {
  return true;
  // const vec = createVectorFromPts(arc.c, pt);
  // console.log('vec', vec);
  // const ang = angle(vec);
  // console.log('startAngle, endAngle', arc.startAngle, arc.endAngle);
  // console.log('ang', ang);
  // return ang >= arc.startAngle && ang <= arc.endAngle;
}

function ellipseDistanceTo(ellipse, pt) {
  const polarPoint = toEllipseCoordinateSystem(ellipse, pt);
  console.log('polarPoint', polarPoint);
  const L = radiusAtAngle(ellipse, polarPoint.angle);
  console.log('L', L);
  return Math.abs(polarPoint.radius - L);
}

function toEllipseCoordinateSystem(ellipse, pt) {
  console.log('pointer pt', pt);
  let x = pt.x - ellipse.c.x;
  let y = pt.y - ellipse.c.y;
  const angle = Math.atan2(y, x) - ellipse.rotation;
  const radius = distance({ x: 0, y: 0 }, { x, y });
  x = radius * Math.cos(angle);
  y = radius * Math.sin(angle);
  console.log('radius', radius);
  console.log('angle', angle);
  return { x, y, angle, radius };
}

function radiusAtAngle(ellipse, angle) {
  return Math.sqrt(
    1 /
      (sq(Math.cos(angle) / ellipse.radiuX) +
        sq(Math.sin(angle) / ellipse.radiuY))
  );
}

function sq(a) {
  return a * a;
}

function ellipticalArcDistanceTo(ellipticalArc, pt) {
  if (isPointInEllipseArcSector(ellipticalArc, pt)) {
    return ellipseDistanceTo(ellipticalArc, pt);
  } else {
    return Math.max(
      distance(ellipticalArc.s, pt),
      distance(ellipticalArc.e, pt)
    );
  }
}

function isPointInEllipseArcSector(pt) {
  return true;
}

function bezierDistanceTo(bezier, pt) {}

function distance(a, b) {
  return length(createVectorFromPts(a, b));
}

function isTouchPathElement(elem, pt) {
  const curves = elem.curves || parseCurves(elem);
  const touchTor = 4;
  return curves.some((curve) => {
    const dist = curveDistanceTo(curve, pt);
    return dist <= touchTor;
  });
}

function curveDistanceTo(curve, pt) {
  if (curve.type === 'segment') {
    return segmentDistanceTo(curve, pt);
  } else if (curve.type === 'arc') {
    return curve.radiuX === curve.radiuY
      ? arcDistanceTo(curve, pt)
      : ellipticalArcDistanceTo(curve, pt);
  } else if (curve.type === 'bezier') {
    return bezierDistanceTo(curve, pt);
  } else {
    return Infinity;
  }
}

function rad(deg) {
  return (deg / 180) * Math.PI;
}

function deg(rad) {
  return (rad / Math.PI) * 180;
}

function parseCurves(elem) {
  const curves = [];
  const pathD = elem.getAttribute('d');
  const pathParts = parsePath(pathD);
  let currPt;
  let lastMovePt;
  for (const part of pathParts) {
    const type = part.key;
    const data = part.data;
    if (type === 'M') {
      currPt = lastMovePt = {
        x: data[0],
        y: data[1],
      };
    } else if (type === 'L') {
      const targetPt = {
        x: data[0],
        y: data[1],
      };
      const curve = createSegmentCurve(currPt, targetPt);
      curves.push(curve);
      currPt = targetPt;
    } else if (type === 'A') {
      const { x: x1, y: y1 } = currPt;
      const [rx, ry, phi, fa, fs, x2, y2] = data;
      const { cx, cy, radiuX, radiuY, startAngle, endAngle } =
        svgArcToCenterParam(x1, y1, rx, ry, phi, fa, fs, x2, y2);
      const targetPt = {
        x: x2,
        y: y2,
      };
      const curve = createArcCurve(
        currPt,
        targetPt,
        { x: cx, y: cy },
        radiuX,
        radiuY,
        startAngle,
        endAngle,
        rad(phi),
        phi
      );
      console.log('curve', curve);
      curves.push(curve);
      currPt = targetPt;
    } else if (type === 'C') {
      const cp1 = {
        x: data[0],
        y: data[1],
      };
      const cp2 = {
        x: data[2],
        y: data[3],
      };
      const targetPt = {
        x: data[4],
        y: data[5],
      };
      curves.push(createSegmentCurve(currPt, cp1));
      curves.push(createSegmentCurve(cp1, cp2));
      curves.push(createSegmentCurve(cp2, targetPt));
      currPt = targetPt;
    } else if (type === 'Z') {
      const curve = createSegmentCurve(currPt, lastMovePt);
      curves.push(curve);
      currPt = lastMovePt;
    }
  }
  return curves;
}

function createSegmentCurve(a, b) {
  return {
    type: 'segment',
    a,
    b,
  };
}

function createArcCurve(
  s,
  e,
  c,
  radiuX,
  radiuY,
  startAngle,
  endAngle,
  rotation = 0,
  phi
) {
  return {
    type: 'arc',
    s,
    e,
    c,
    radiuX,
    radiuY,
    startAngle, // rad
    endAngle, // rad
    rotation, // rad
    phi, // deg
  };
}

initStage();
