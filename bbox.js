import { Vector } from './vector';

export class BBox {
  constructor() {
    this.minX = Number.MAX_VALUE;
    this.minY = Number.MAX_VALUE;
    this.minZ = Number.MAX_VALUE;
    this.maxX = -Number.MAX_VALUE;
    this.maxY = -Number.MAX_VALUE;
    this.maxZ = -Number.MAX_VALUE;
  }

  checkBounds(x, y, z = 0) {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.minZ = Math.min(this.minZ, z);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
    this.maxZ = Math.max(this.maxZ, z);
  }

  checkPoint(p) {
    this.checkBounds(p.x, p.y, p.z);
  }

  center() {
    return new Vector(
      this.minX + (this.maxX - this.minX) / 2,
      this.minY + (this.maxY - this.minY) / 2,
      this.minZ + (this.maxZ - this.minZ) / 2
    );
  }
}
