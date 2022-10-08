// svg : [A | a] (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+

function radian(ux, uy, vx, vy) {
  var dot = ux * vx + uy * vy;
  var mod = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  var rad = Math.acos(dot / mod);
  if (ux * vy - uy * vx < 0.0) {
    rad = -rad;
  }
  return rad;
}

function deg(rad) {
  if (rad < 0 || rad > Math.PI * 2) {
    rad = (Math.PI * 2 + rad) % (Math.PI * 2);
  }
  return (rad / Math.PI) * 180;
}

//conversion_from_endpoint_to_center_parameterization
//sample :  svgArcToCenterParam(200,200,50,50,0,1,1,300,200)
// x1 y1 rx ry φ fA fS x2 y2
export function svgArcToCenterParam(x1, y1, rx, ry, phi, fA, fS, x2, y2) {
  var cx, cy, startAngle, deltaAngle, endAngle;
  var PIx2 = Math.PI * 2.0;

  if (rx < 0) {
    rx = -rx;
  }
  if (ry < 0) {
    ry = -ry;
  }
  if (rx == 0.0 || ry == 0.0) {
    // invalid arguments
    throw Error('rx and ry can not be 0');
  }

  var s_phi = Math.sin(phi);
  var c_phi = Math.cos(phi);
  var hd_x = (x1 - x2) / 2.0; // half diff of x
  var hd_y = (y1 - y2) / 2.0; // half diff of y
  var hs_x = (x1 + x2) / 2.0; // half sum of x
  var hs_y = (y1 + y2) / 2.0; // half sum of y

  // F6.5.1
  var x1_ = c_phi * hd_x + s_phi * hd_y;
  var y1_ = c_phi * hd_y - s_phi * hd_x;

  // F.6.6 Correction of out-of-range radii
  //   Step 3: Ensure radii are large enough
  var lambda = (x1_ * x1_) / (rx * rx) + (y1_ * y1_) / (ry * ry);
  if (lambda > 1) {
    rx = rx * Math.sqrt(lambda);
    ry = ry * Math.sqrt(lambda);
  }

  var rxry = rx * ry;
  var rxy1_ = rx * y1_;
  var ryx1_ = ry * x1_;
  var sum_of_sq = rxy1_ * rxy1_ + ryx1_ * ryx1_; // sum of square
  if (!sum_of_sq) {
    throw Error('start point can not be same as end point');
  }
  var coe = Math.sqrt(Math.abs((rxry * rxry - sum_of_sq) / sum_of_sq));
  if (fA == fS) {
    coe = -coe;
  }

  // F6.5.2
  var cx_ = (coe * rxy1_) / ry;
  var cy_ = (-coe * ryx1_) / rx;

  // F6.5.3
  cx = c_phi * cx_ - s_phi * cy_ + hs_x;
  cy = s_phi * cx_ + c_phi * cy_ + hs_y;

  var xcr1 = (x1_ - cx_) / rx;
  var xcr2 = (x1_ + cx_) / rx;
  var ycr1 = (y1_ - cy_) / ry;
  var ycr2 = (y1_ + cy_) / ry;

  // F6.5.5
  startAngle = radian(1.0, 0.0, xcr1, ycr1) + phi;

  // F6.5.6
  deltaAngle = radian(xcr1, ycr1, -xcr2, -ycr2);
  while (deltaAngle > PIx2) {
    deltaAngle -= PIx2;
  }
  while (deltaAngle < 0.0) {
    deltaAngle += PIx2;
  }
  if (fS == false || fS == 0) {
    deltaAngle -= PIx2;
  }
  endAngle = startAngle + deltaAngle;
  while (endAngle > PIx2) {
    endAngle -= PIx2;
  }
  while (endAngle < 0.0) {
    endAngle += PIx2;
  }

  const sAng = Math.atan2(y1 - cy, x1 - cx);
  const eAng = Math.atan2(y2 - cy, x2 - cx);

  var outputObj = {
    /* cx, cy, startAngle, deltaAngle */
    cx: cx,
    cy: cy,
    startAngle: startAngle,
    deltaAngle: deltaAngle,
    endAngle: endAngle,
    startDeg: deg(startAngle),
    endDeg: deg(endAngle),
    radiuX: rx,
    radiuY: ry,
    clockwise: fS == true || fS == 1,
    sAng,
    eAng,
  };

  console.log('outputObj', outputObj);
  return outputObj;
}
