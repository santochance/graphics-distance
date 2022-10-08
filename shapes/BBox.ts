import { Vector2 } from '../math/Vector2';

export class BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;

  constructor() {
    this.minX = Number.MAX_VALUE;
    this.minY = Number.MAX_VALUE;
    this.maxX = -Number.MAX_VALUE;
    this.maxY = -Number.MAX_VALUE;
  }

  checkBounds(x, y) {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
  }

  checkPoint(p) {
    this.checkBounds(p.x, p.y);
  }

  center() {
    return new Vector2(
      this.minX + (this.maxX - this.minX) / 2,
      this.minY + (this.maxY - this.minY) / 2,
    );
  }
}
