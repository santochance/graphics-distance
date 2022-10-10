import { hitTest, parseCurves } from "./shapes/Path";
// import CanvasKitInit from 'canvaskit-wasm/bin/canvaskit.wasm?init';
import CanvasKitInit from "canvaskit-wasm/bin/canvaskit.js";
import CanvasKitWasm from "canvaskit-wasm/bin/canvaskit.wasm?url";

const CanvasKit = await CanvasKitInit({ locateFile: () => CanvasKitWasm });
console.log('CanvasKit inited', CanvasKit);

type SVGStrokeLineJoin = 'miter' | 'bevel' | 'round';
const toSkStrokeJoin = (lineJoin: SVGStrokeLineJoin) => {
  switch(lineJoin) {
    case 'bevel': 
      return CanvasKit.StrokeJoin.Bevel;
    case 'round': 
      return CanvasKit.StrokeCap.Round;
    case 'miter': 
    default: 
      return CanvasKit.StrokeCap.Miter;
  }
}

type SVGStrokeLineCap =  'butt' | 'round' | 'square'
const toSkStrokeCap = (lineCap: SVGStrokeLineCap) => {
  switch(lineCap) {
    case 'butt': 
      return CanvasKit.StrokeCap.Butt;
    case 'round': 
      return CanvasKit.StrokeCap.Round;
    case 'square': 
      return CanvasKit.StrokeCap.Square;
  }
}

function parseStrokeStyle(computedStyle, expandedWidth = 0) {
  const strokeStyle = { } as { width?: number, join?, cap?, miter_limit?: number, precision?: number };
  const width = computedStyle.get('stroke-width').value;
  if (isFinite(width)) {
    strokeStyle.width = width + expandedWidth;
  }
  const lineJoin = computedStyle.get('stroke-linejoin').value;
  if (lineJoin) {
    strokeStyle.join = toSkStrokeJoin(lineJoin);

  }
  const lineCap = computedStyle.get('stroke-linecap').value;
  if (lineCap) {
    strokeStyle.cap = toSkStrokeCap(lineCap);
  }
  const miterLimit = computedStyle.get('stroke-miterlimit').value;
  if (isFinite(miterLimit)) {
    strokeStyle.miter_limit = miterLimit;
  }
  return strokeStyle;
}


function createPath(elem) {
  const computedStyle = elem.computedStyleMap();
  const fillColor = computedStyle.get('fill').toString();
  const strokeColor = computedStyle.get('stroke').toString();
  const strokeWidth = computedStyle.get('stroke-width').value;
  const isShowFill = fillColor !== 'none';
  const isShowStroke = strokeColor !== 'none' && strokeWidth > 0;
  if (!isShowFill && !isShowStroke) {
    return;
  }

  const pathD = elem.getAttribute('d');
  const basePath = CanvasKit.Path.MakeFromSVGString(pathD);
  const strokeStyle = isShowStroke ? parseStrokeStyle(computedStyle, 1) : undefined;
  let path;
  if (isShowFill && !isShowStroke) {
    path = basePath;
  } else if (!isShowFill && isShowStroke) {
    path = basePath.stroke(strokeStyle);
  } else {
    path = basePath.addPath(basePath.copy().stroke(strokeStyle));
  }

  const transform = elem.transform.baseVal.consolidate();
  if (transform) {
    const { a: scaleX, b: skewY, c: skewX, d: scaleY, e: transX, f: transY } = transform.matrix;
    path.transform(scaleX, skewX, transX, skewY, scaleY, transY, 0, 0, 1);
  }

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
  return elems.filter((elem) => elem.pathInst?.contains(pt.x, pt.y));
}

function getCurrentPosition(ev) {
  return { x: ev.offsetX, y: ev.offsetY };
}

initStage();
