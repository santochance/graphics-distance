import { bezierDistanceTo } from './shapes/BezierCurve';
import { arcDistanceTo, ellipticalArcDistanceTo } from "./shapes/EllipseCurve";
import { segmentDistanceTo } from "./shapes/LineCurve";
import { hitTest, parseCurves } from "./shapes/Path";

function initStage() {
  console.log('[stage] inited');
  const stage = document.querySelector('.stage');

  // @ts-ignore
  const elems = Array.from(stage.querySelectorAll('path'));
  elems.forEach((elem) => {
    const curves = parseCurves(elem.getAttribute('d'));
    elem.curves = curves;
    elem.dataset['curves'] = JSON.stringify(curves);
  });

  const onMousemove = (ev) => {
    const pos = getCurrentPosition(ev);
    const hits = elems.filter((elem) => hitTest(elem, pos));
    elems.forEach((el) => {
      el.classList.remove('is-hover');
    });
    hits.forEach((el) => {
      el.classList.add('is-hover');
    });
  };

  const onMousedown = (ev) => {
    const pos = getCurrentPosition(ev);
    const hits = elems.filter((elem) => hitTest(elem, pos));
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

function getCurrentPosition(ev) {
  return { x: ev.offsetX, y: ev.offsetY };
}

export function curveDistanceTo(curve, pt) {
  if (curve.type === 'segment') {
    return segmentDistanceTo(curve, pt);
  } else if (curve.type === 'arc') {
    return curve.radiusX === curve.radiusY
      ? arcDistanceTo(curve, pt)
      : ellipticalArcDistanceTo(curve, pt);
  } else if (curve.type === 'bezier') {
    return bezierDistanceTo(curve, pt);
  } else {
    return Infinity;
  }
}

initStage();