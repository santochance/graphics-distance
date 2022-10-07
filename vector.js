export function plus(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function minus(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function multiply(v, n) {
  return {
    x: v.x * n,
    y: v.y * n,
  };
}

export function divide(v, n) {
  return {
    x: v.x / n,
    y: v.y / n,
  };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function length(vec) {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

export function angle(vec) {
  return Math.atan2(vec.y, vec.x);
}

export function normalize(vec) {
  const len = length(vec);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: vec.x / len,
    y: vec.y / len,
  };
}

export function createVector(x = 0, y = 0) {
  return { x, y };
}

export function createVectorFromPts(a, b) {
  return minus(b, a);
}
