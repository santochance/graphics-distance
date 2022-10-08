import { parsePath } from 'path-data-parser';
import { bezierDistanceTo, createBezierCurve } from './shapes/BezierCurve';
import { rad } from "./helpers";
import { arcDistanceTo, createArcCurve, ellipticalArcDistanceTo } from "./shapes/EllipseCurve";
import { createSegmentCurve, segmentDistanceTo } from "./shapes/LineCurve";
import { svgArcToCenterParam } from './svgArcToCenterParam';
import { createVectorFromPts, length, } from './vector';

function initStage() {
  console.log('[stage] inited');
  const stage = document.querySelector('.stage');

  // @ts-ignore
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

export function sq(a) {
  return a * a;
}

export function distance(a, b) {
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

initStage();
