/**
 * @brief convSvgEllipseParams calculates the center point and the start angle
 * and end angle of an ellipse from the obscure SVG parameters of an
 * elliptic arc. It returns an array with two points, the center
 * point and a point with the start and end angles.
 * The term "point" means a JS object { x:number1, y:number2 }
 *
 * @author Balint Morvai <balint@morvai.de>
 * @license http://en.wikipedia.org/wiki/MIT_License MIT License
 * @param ps starting point
 * @param pe end point
 * @param rh horizontal radius
 * @param rv vertical radius
 * @param rot rotation in degree
 * @param fa large arc flag
 * @param fs sweep flag
 * @return array
 */
export var convSvgEllipseParams = function (ps, pe, rh, rv, rot, fa, fs) {
  // function for calculating angle between two vectors
  var angle = function (u, v) {
    var sign = u.x * v.y - u.y * v.x > 0 ? 1 : -1;
    return (
      sign *
      Math.acos(
        (u.x * v.x + u.y * v.y) /
          (Math.sqrt(u.x * u.x + u.y * u.y) * Math.sqrt(u.x * u.x + u.y * u.y))
      )
    );
  };
  // sanitize input
  rot = rot % 360;
  rh = Math.abs(rh);
  rv = Math.abs(rv);
  // do calculation
  var cosRot = Math.cos(rot);
  var sinRot = Math.sin(rot);
  var x = (cosRot * (ps.x - pe.x)) / 2 + (sinRot * (ps.y - pe.y)) / 2;
  var y = (-1 * sinRot * (ps.x - pe.x)) / 2 + (cosRot * (ps.y - pe.y)) / 2;
  var rh2 = rh * rh;
  var rv2 = rv * rv;
  var x2 = x * x;
  var y2 = y * y;
  var fr =
    (fa == fs ? -1 : 1) *
    Math.sqrt((rh2 * (rv2 - y2) - rv2 * x2) / (rh2 * y2 + rv2 * x2));
  var xt = (fr * rh * y) / rv;
  var yt = (-1 * fr * rv * x) / rh;
  var cx = cosRot * xt - sinRot * yt + (ps.x + pe.x) / 2;
  var cy = sinRot * xt + cosRot * yt + (ps.y + pe.y) / 2;
  var vt = { x: (x - xt) / rh, y: (y - yt) / rv };
  var phi1 = angle({ x: 1, y: 0 }, vt);
  var phiD = angle(vt, { x: (-x - xt) / rh, y: (-y - yt) / rv }) % 360;
  var phi2 = phi1 + phiD;
  return {
    cx,
    cy,
    phi1,
    phi2,
    phiD,
  };
};
