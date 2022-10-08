import { length, minus } from "./Vector2";

export function stringifyPts(pts) {
  return pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
}

export function angleBetween(theta, s, e, clockwise = true) {
  let sRadian = clockwise ? s : e;
  let eRadian = clockwise ? e : s;
  // @ts-ignore
  if (Math.abs(sRadian - eRadian) < Number.EPSILON) return false;
  
  if (eRadian < sRadian) {
    if (sRadian > theta) {
      theta += 2 * Math.PI;
    }
    eRadian += 2 * Math.PI;
  }
  
  // @ts-ignore
  if (theta > eRadian + Number.EPSILON || theta < sRadian - Number.EPSILON) {
    return false;
  }
  return true;
}

export function rad(deg) {
  return (deg / 180) * Math.PI;
}

export function deg(rad) {
  return (rad / Math.PI) * 180;
}

export function sq(a) {
  return a * a;
}

export function distance(a, b) {
  return length(minus(b, a));
}