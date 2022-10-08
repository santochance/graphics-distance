import { angleBetween, distance, sq } from "../helpers";
import { angle, createVectorFromPts } from "../vector";

export function createArcCurve(
    s,
    e,
    c,
    radiusX,
    radiusY,
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
        radiusX,
        radiusY,
        startAngle,
        endAngle,
        rotation,
        clockwise,
    };
}

export function isPointInArcSector(arc, pt) {
    const vec = createVectorFromPts(arc.c, pt);
    const ang = angle(vec);
    return angleBetween(ang, arc.startAngle, arc.endAngle, arc.clockwise);
}

export function arcDistanceTo(arc, pt) {
    let dist;
    if (isPointInArcSector(arc, pt)) {
        dist = Math.abs(distance(arc.c, pt) - arc.radiusX);
    } else {
        dist = Math.max(distance(arc.s, pt), distance(arc.e, pt));
    }
    return dist;
}

export function ellipseDistanceTo(ellipse, pt) {
    const polarPoint = toEllipseCoordinateSystem(ellipse, pt);
    const L = radiusAtAngle(ellipse, polarPoint.angle);
    return Math.abs(polarPoint.radius - L);
}

export function toEllipseCoordinateSystem(ellipse, pt) {
    let x = pt.x - ellipse.c.x;
    let y = pt.y - ellipse.c.y;
    const angle = Math.atan2(y, x) - ellipse.rotation;
    const radius = distance({x: 0, y: 0}, {x, y});
    x = radius * Math.cos(angle);
    y = radius * Math.sin(angle);
    return {x, y, angle, radius};
}

export function radiusAtAngle(ellipse, angle) {
    return Math.sqrt(
        1 /
        (sq(Math.cos(angle) / ellipse.radiusX) +
            sq(Math.sin(angle) / ellipse.radiusY))
    );
}

export function ellipticalArcDistanceTo(ellipticalArc, pt) {
    if (isPointInArcSector(ellipticalArc, pt)) {
        return ellipseDistanceTo(ellipticalArc, pt);
    } else {
        return Math.max(
            distance(ellipticalArc.s, pt),
            distance(ellipticalArc.e, pt)
        );
    }
}