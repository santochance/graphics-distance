import { hitTest, parseCurves } from "./shapes/Path";
// import CanvasKitInit from 'canvaskit-wasm/bin/canvaskit.wasm?init';
import CanvasKitInit from "canvaskit-wasm/bin/canvaskit.js";
import CanvasKitWasm from "canvaskit-wasm/bin/canvaskit.wasm?url";

const CanvasKit = await CanvasKitInit({ locateFile: () => CanvasKitWasm });
console.log('CanvasKit inited', CanvasKit);

function createPath(elem) {
  const pathD = elem.getAttribute('d');
  const path = CanvasKit.Path.MakeFromSVGString(pathD);
  return path;
}

function initStage() {
  console.log('[stage] inited');
  const stage = document.querySelector('.stage');

  // @ts-ignore
  const elems = Array.from(stage.querySelectorAll('path'));
  elems.forEach((elem) => {
    // const pathD = elem.getAttribute('d');
    // const curves = parseCurves(pathD);
    // elem.curves = curves;

    elem.pathInst = createPath(elem);
  });

  const onMousemove = (ev) => {
    const pt = getCurrentPosition(ev);
    const hits = searchElemsByPt(elems, pt);
    elems.forEach((el) => {
      el.classList.remove('is-hover');
    });
    hits.forEach((el) => {
      el.classList.add('is-hover');
    });
  };

  const onMousedown = (ev) => {
    const pt = getCurrentPosition(ev);
    const hits = searchElemsByPt(elems, pt);
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

function searchElemsByPt(elems, pt) {
  // return elems.filter((elem) => hitTest(elem, pt));
  return elems.filter((elem) => elem.pathInst.contains(pt.x, pt.y));
}

function getCurrentPosition(ev) {
  return { x: ev.offsetX, y: ev.offsetY };
}

initStage();
