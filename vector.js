export class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }

  plus(vec) {
    return plus(this, vec);
  }

  minus(vec) {
    return minus(this, vec);
  }

  _minus(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
  }

  multiply(n) {
    return multiply(this, n);
  }

  divide(n) {
    return divide(this, n);
  }

  dot(vec) {
    return dot(this, vec);
  }

  length() {
    return length(this);
  }

  angle() {
    return angle(this);
  }

  normalize() {
    return normalize(this);
  }
}

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
