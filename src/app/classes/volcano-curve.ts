// @ts-ignore
import * as jstat from 'jstat';

export interface VolcanoCurvePoint {
  x: number
  y: number
}

export interface VolcanoCurveParameters {
  type: string
  c: number
  s0: number
  df: number
  x0: number
}

/**
 * Curved significance cutoff for the volcano plot.
 *
 * Supported types:
 * - "sam": SAM/Perseus threshold where |x| / (s + s0) = c, drawn on -log10(p) of a Student's t-test with df degrees of freedom.
 * - "hyperbolic": y = c / (|x| - x0).
 * - "points": piecewise linear interpolation of user supplied points, left side from x < 0 and right side from x >= 0.
 */
export class VolcanoCurve {
  private readonly leftPoints: VolcanoCurvePoint[]
  private readonly rightPoints: VolcanoCurvePoint[]

  constructor(public parameters: VolcanoCurveParameters, points: VolcanoCurvePoint[] = []) {
    const valid = points.filter(p => isFinite(p.x) && isFinite(p.y))
    const byDistance = (a: VolcanoCurvePoint, b: VolcanoCurvePoint) => Math.abs(a.x) - Math.abs(b.x)
    this.leftPoints = valid.filter(p => p.x < 0).sort(byDistance)
    this.rightPoints = valid.filter(p => p.x >= 0).sort(byDistance)
  }

  /**
   * Returns the -log10(p) value of the curve at fold change x, or Infinity where the curve does not reach.
   */
  thresholdAt(x: number): number {
    const distance = Math.abs(x)
    switch (this.parameters.type) {
      case "sam":
        return this.samThreshold(distance)
      case "hyperbolic":
        return this.hyperbolicThreshold(distance)
      case "points":
        return this.pointsThreshold(x)
      default:
        return Infinity
    }
  }

  /**
   * Returns true when the point lies on or above the curve.
   */
  isAbove(x: number, y: number): boolean {
    return y >= this.thresholdAt(x)
  }

  /**
   * Returns the curve parameters formatted for use in significance group labels.
   */
  description(): string {
    switch (this.parameters.type) {
      case "sam":
        return `c=${this.parameters.c};s0=${this.parameters.s0};df=${this.parameters.df}`
      case "hyperbolic":
        return `c=${this.parameters.c};x0=${this.parameters.x0}`
      default:
        return ""
    }
  }

  /**
   * Returns points for drawing the curve on both sides of the plot, from where the curve enters the plot at yMax out to xMax.
   */
  generate(xMax: number, yMax: number, steps: number = 200): VolcanoCurvePoint[] {
    if (this.parameters.type === "points") {
      return [...this.leftPoints, ...this.rightPoints]
    }
    const start = this.entryDistance(xMax, yMax)
    if (start === null) {
      return []
    }
    const right: VolcanoCurvePoint[] = []
    for (let i = 0; i <= steps; i++) {
      const distance = start + (xMax - start) * Math.pow(i / steps, 2)
      right.push({x: distance, y: Math.min(this.thresholdAt(distance), yMax)})
    }
    const left = right.map(p => ({x: -p.x, y: p.y}))
    return [...left, ...right]
  }

  private samThreshold(distance: number): number {
    const {c, s0, df} = this.parameters
    const asymptote = c * s0
    if (distance <= asymptote || c <= 0 || df <= 0) {
      return Infinity
    }
    const t = c * distance / (distance - asymptote)
    const p = 2 * jstat.studentt.cdf(-t, df)
    if (p <= 0) {
      return Infinity
    }
    return -Math.log10(p)
  }

  private hyperbolicThreshold(distance: number): number {
    const {c, x0} = this.parameters
    if (distance <= x0) {
      return Infinity
    }
    return c / (distance - x0)
  }

  private pointsThreshold(x: number): number {
    let side = x < 0 ? this.leftPoints : this.rightPoints
    if (side.length === 0) {
      side = x < 0 ? this.rightPoints : this.leftPoints
    }
    if (side.length === 0) {
      return Infinity
    }
    const distance = Math.abs(x)
    if (distance < Math.abs(side[0].x)) {
      return Infinity
    }
    for (let i = 1; i < side.length; i++) {
      const a = Math.abs(side[i - 1].x)
      const b = Math.abs(side[i].x)
      if (distance <= b) {
        if (b === a) {
          return Math.min(side[i - 1].y, side[i].y)
        }
        return side[i - 1].y + (side[i].y - side[i - 1].y) * (distance - a) / (b - a)
      }
    }
    return side[side.length - 1].y
  }

  /**
   * Finds by bisection the fold change distance at which the monotonically decreasing curve drops to yMax.
   */
  private entryDistance(xMax: number, yMax: number): number | null {
    const lower = this.parameters.type === "sam" ? this.parameters.c * this.parameters.s0 : this.parameters.x0
    if (!(xMax > lower) || this.thresholdAt(xMax) > yMax) {
      return null
    }
    let low = Math.max(lower, 0)
    let high = xMax
    for (let i = 0; i < 60; i++) {
      const middle = (low + high) / 2
      if (this.thresholdAt(middle) > yMax) {
        low = middle
      } else {
        high = middle
      }
    }
    return high
  }
}
