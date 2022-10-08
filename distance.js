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
import { svgArcToCenterParam } from './svgArcToCenterParam';
import { bezierDistanceTo } from './bezier-curve';

function initStage() {
  console.log('[stage] inited');
  const stage = document.querySelector('.stage');

  const elems = Array.from(stage.querySelectorAll('path'));
  elems.forEach((elem) => {
    const curves = parseCurves(elem);
    elem.curves = curves;
    elem.dataset['curves'] = JSON.stringify(curves);
  });

  const onMousemove = (ev) => {
    const pos = getCurrentPosition(ev);
    const hits = searchElementsByPoint(elems, pos);
    elems.forEach((el) => {
      el.classList.remove('is-hover');
    });
    hits.forEach((el) => {
      el.classList.add('is-hover');
    });
  };

  const onMousedown = (ev) => {
    const pos = getCurrentPosition(ev);
    const hits = searchElementsByPoint(elems, pos);
    elems.forEach((el) => {
      el.classList.remove('is-hit');
    });
    hits.forEach((el) => {
      el.classList.add('is-hit');
    });
  };

  stage.addEventListener('mousemove', onMousemove);
  stage.addEventListener('mousedown', onMousedown);
}

function searchElementsByPoint(elems, pos) {
  return elems.filter((elem) => {
    const isTouched = isTouchPathElement(elem, pos);
    return isTouched;
  });
}

function getCurrentPosition(ev) {
  return { x: ev.offsetX, y: ev.offsetY };
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
  const vec = createVectorFromPts(arc.c, pt);
  const ang = angle(vec);
  return angleBetween(ang, arc.startAngle, arc.endAngle, arc.clockwise);
}

function ellipseDistanceTo(ellipse, pt) {
  const polarPoint = toEllipseCoordinateSystem(ellipse, pt);
  const L = radiusAtAngle(ellipse, polarPoint.angle);
  return Math.abs(polarPoint.radius - L);
}

function toEllipseCoordinateSystem(ellipse, pt) {
  let x = pt.x - ellipse.c.x;
  let y = pt.y - ellipse.c.y;
  const angle = Math.atan2(y, x) - ellipse.rotation;
  const radius = distance({ x: 0, y: 0 }, { x, y });
  x = radius * Math.cos(angle);
  y = radius * Math.sin(angle);
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
  if (isPointInArcSector(ellipticalArc, pt)) {
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
      const radPhi = rad(phi);
      const {
        cx,
        cy,
        radiuX,
        radiuY,
        sAng: startAngle,
        eAng: endAngle,
        clockwise,
      } = svgArcToCenterParam(x1, y1, rx, ry, radPhi, fa, fs, x2, y2);
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
        radPhi,
        clockwise
      );
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
      // curves.push(createSegmentCurve(currPt, cp1));
      // curves.push(createSegmentCurve(cp1, cp2));
      // curves.push(createSegmentCurve(cp2, targetPt));
      const curve = createBezierCurve(currPt, targetPt, cp1, cp2);
      curves.push(curve);
      currPt = targetPt;
    } else if (type === 'Z') {
      const curve = createSegmentCurve(currPt, lastMovePt);
      curves.push(curve);
      currPt = lastMovePt;
    }
  }
  return curves;
}

export function createSegmentCurve(a, b) {
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
  clockwise
) {
  return {
    type: 'arc',
    s,
    e,
    c,
    radiuX,
    radiuY,
    startAngle,
    endAngle,
    rotation,
    clockwise,
  };
}

function createBezierCurve(a, b, cp1, cp2) {
  return {
    type: 'bezier',
    a,
    b,
    cp1,
    cp2,
  };
}

function angleBetween(theta, s, e, clockwise = true) {
  let sRadian = clockwise ? s : e;
  let eRadian = clockwise ? e : s;
  if (Math.abs(sRadian - eRadian) < Number.EPSILON) return false;

  if (eRadian < sRadian) {
    if (sRadian > theta) {
      theta += 2 * Math.PI;
    }
    eRadian += 2 * Math.PI;
  }

  if (theta > eRadian + Number.EPSILON || theta < sRadian - Number.EPSILON) {
    return false;
  }
  return true;
}

initStage();
