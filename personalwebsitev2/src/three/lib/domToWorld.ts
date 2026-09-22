import { Vector3, type Camera } from "three";

// Scratch vectors reused across calls — this runs every frame while an
// anchor is `live`, so avoiding per-call allocations matters here.
const _point = new Vector3();
const _origin = new Vector3();

/**
 * Projects a point of a DOM rect (in CSS pixels) onto the plane z = zPlane
 * in world space, using the canvas rect to derive NDC.
 */
export function domPointToWorld(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  camera: Camera,
  zPlane = 0,
  out = new Vector3()
): Vector3 {
  const ndcX = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
  const ndcY = -(((clientY - canvasRect.top) / canvasRect.height) * 2 - 1);

  const point = _point.set(ndcX, ndcY, 0.5).unproject(camera);
  const origin = _origin.setFromMatrixPosition(camera.matrixWorld);
  const dir = point.sub(origin).normalize();
  const t = (zPlane - origin.z) / (dir.z || 1e-6);
  return out.copy(origin).add(dir.multiplyScalar(t));
}

export type WorldAnchor = {
  /** bottom-centre of the rect in world units */
  bottomCenter: Vector3;
  /** Glyph metrics (only when measured with `glyphText`): baseline centre of the ink */
  glyphBase: Vector3;
  /** cap height of the glyph ink, world units */
  glyphCap: number;
  /** ink width of the glyph, world units */
  glyphWidth: number;
  /** centre of the rect */
  center: Vector3;
  /** rect height in world units on the z plane */
  height: number;
  width: number;
  ready: boolean;
};

let measureCtx: CanvasRenderingContext2D | null = null;

/** Baseline / cap-top / ink extents of a single glyph rendered in `el`'s font, in client px. */
function glyphMetrics(el: Element, r: DOMRect, text: string) {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return null;
  const cs = getComputedStyle(el);
  measureCtx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
  const m = measureCtx.measureText(text);
  const px = parseFloat(cs.fontSize) || 16;
  const asc = m.fontBoundingBoxAscent ?? px * 0.93;
  const desc = m.fontBoundingBoxDescent ?? px * 0.24;
  // the content area (asc + desc) is centred inside the line box
  const baselineY = r.top + (r.height - (asc + desc)) / 2 + asc;
  const capTopY = baselineY - (m.actualBoundingBoxAscent ?? px * 0.7);
  const inkLeft = r.left - (m.actualBoundingBoxLeft ?? 0);
  const inkRight = r.left + (m.actualBoundingBoxRight ?? r.width);
  return { baselineY, capTopY, inkLeft, inkRight };
}

// More scratch vectors for measureAnchor's own transient results (also
// called every frame while an anchor is `live`).
const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _d = new Vector3();

export function measureAnchor(
  el: Element,
  canvasEl: HTMLCanvasElement,
  camera: Camera,
  zPlane = 0,
  target?: WorldAnchor,
  glyphText?: string
): WorldAnchor {
  const r = el.getBoundingClientRect();
  const c = canvasEl.getBoundingClientRect();
  const bottomCenter = domPointToWorld(r.left + r.width / 2, r.bottom, c, camera, zPlane, _a);
  const topCenter = domPointToWorld(r.left + r.width / 2, r.top, c, camera, zPlane, _b);
  const leftMid = domPointToWorld(r.left, r.top + r.height / 2, c, camera, zPlane, _c);
  const rightMid = domPointToWorld(r.right, r.top + r.height / 2, c, camera, zPlane, _d);
  const anchor =
    target ??
    ({ bottomCenter: new Vector3(), center: new Vector3(), glyphBase: new Vector3(), glyphCap: 0, glyphWidth: 0, height: 0, width: 0, ready: false } as WorldAnchor);
  anchor.bottomCenter.copy(bottomCenter);
  anchor.center.copy(bottomCenter).lerp(topCenter, 0.5);
  anchor.height = topCenter.distanceTo(bottomCenter);
  anchor.width = leftMid.distanceTo(rightMid);
  anchor.ready = r.width > 0 && r.height > 0;

  if (glyphText) {
    const g = glyphMetrics(el, r, glyphText);
    if (g) {
      const cx = (g.inkLeft + g.inkRight) / 2;
      const base = domPointToWorld(cx, g.baselineY, c, camera, zPlane, _a);
      const capTop = domPointToWorld(cx, g.capTopY, c, camera, zPlane, _b);
      const l = domPointToWorld(g.inkLeft, g.baselineY, c, camera, zPlane, _c);
      const rr = domPointToWorld(g.inkRight, g.baselineY, c, camera, zPlane, _d);
      anchor.glyphBase.copy(base);
      anchor.glyphCap = capTop.distanceTo(base);
      anchor.glyphWidth = l.distanceTo(rr);
    }
  }
  return anchor;
}
