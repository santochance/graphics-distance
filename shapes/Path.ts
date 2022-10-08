import { parsePath } from "path-data-parser";
import { rad } from "../math/helpers";
import { svgArcToCenterParam } from "../math/svgArcToCenterParam";
import { createBezierCurve } from "./BezierCurve";
import { createArcCurve } from "./EllipseCurve";
import { createSegmentCurve } from "./LineCurve";

export class Path {

}

export function hitTest(elem, pt, touchTor = 4) {
    const curves = elem.curves;
    return curves.some((curve) => {
        const dist = curve.distanceTo(pt);
        return dist <= touchTor;
    });
}

export function parseCurves(pathD: string) {
    const curves = [];
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
            const {x: x1, y: y1} = currPt;
            const [rx, ry, phi, fa, fs, x2, y2] = data;
            const radPhi = rad(phi);
            const {
                cx,
                cy,
                radiusX,
                radiusY,
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
                {x: cx, y: cy},
                radiusX,
                radiusY,
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