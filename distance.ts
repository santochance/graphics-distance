import { hitTest, parseCurves } from "./shapes/Path";
// import CanvasKitInit from 'canvaskit-wasm/bin/canvaskit.wasm?init';
import CanvasKitInit from "canvaskit-wasm/bin/canvaskit.js";
import CanvasKitWasm from "canvaskit-wasm/bin/canvaskit.wasm?url";

import PathKitInit from "pathkit-wasm/bin/pathkit.js";
import PathKitWasm from "pathkit-wasm/bin/pathkit.wasm?url";

const CanvasKit = await CanvasKitInit({ locateFile: () => CanvasKitWasm });
console.log('CanvasKit inited', CanvasKit);

const PathKit = await PathKitInit({ locateFile: () => PathKitWasm });
console.log('PathKit inited', PathKit);

function logPath(path, label) {
  console.log(label,{
    toCmds: path.toCmds(),
    toPath2D: path.toPath2D?.(),
    toSvgString: path.toSVGString(),
  })
}

function testCanvasKitAddCircle() {
  const path = new CanvasKit.Path().addCircle(10, 10, 10);
  logPath(path, 'canvaskit circle');
}

function testPathKitArc() {
  const path = PathKit.NewPath().arc(10, 10, 10, 20 / 180 * Math.PI, Math.PI * 1.4 , false);
  logPath(path, 'pathkit arc');
}

function testPathKitFullCircle() {
  const path = PathKit.NewPath().arc(10, 10, 10, 0, Math.PI * 2, false);
  logPath(path, 'pathkit fullCircle arc');
}

function testPathKitEllipse() {
  const path = PathKit.NewPath().ellipse(30, 40, 10, 20, 0, 0, Math.PI * 2, false).simplify();
  logPath(path, 'pathkit ellipse');
}

function testPathKitBox() {
  const path = PathKit.NewPath().rect(0, 0, 100, 100);
  logPath(path, 'pathkit box');
}

function testPathKitCubicTo() {
  const path = PathKit.NewPath().moveTo(0, 0).cubicTo(100, 100, 200, 500, 20, 800);
  logPath(path, 'pathkit cubicTo');
}

function testPathKitQuadTo() {
  const path = PathKit.NewPath().moveTo(0, 0).quadTo(200, 200, 300, 50);
  logPath(path, 'pathkit quadTo');
}

function testPathKitConicTo() {
  const path = PathKit.NewPath().moveTo(0, 0).conicTo(100, 100, 200, 500, 0.7071);
  logPath(path, 'pathkit conicTo');
}

function testPathKitBooleanOp() {
  let pathOne = PathKit.NewPath().arc(10, 10, 10, 20 / 180 * Math.PI, Math.PI * 1.4 , false);
  let pathTwo = PathKit.NewPath().ellipse(15, 20, 10, 20, 0, 0, Math.PI * 2, false);
  // Combine the two triangles to look like two mountains
  let mountains = pathOne.copy().op(pathTwo, PathKit.PathOp.UNION);
  logPath(mountains, 'mountains');
  // set pathOne to be the small triangle where pathOne and pathTwo overlap
  let newPathOne = pathOne.op(pathTwo, PathKit.PathOp.INTERSECT);
  // since copy() was called, don't forget to call delete() on mountains.
  logPath(newPathOne, 'newPathOne');
}

function testCanvasKitBooleanOp() {
  // const pathOne = new CanvasKit.Path().
}

testCanvasKitAddCircle();
testPathKitArc();
testPathKitFullCircle();
testPathKitEllipse();
testPathKitBox();
testPathKitCubicTo();
testPathKitQuadTo();
testPathKitConicTo();
testPathKitBooleanOp();

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
