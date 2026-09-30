import { VolcanoCurve, VolcanoCurveParameters } from './volcano-curve';

describe('VolcanoCurve', () => {
  const sam: VolcanoCurveParameters = {type: "sam", c: 2, s0: 0.5, df: 4, x0: 0}

  it('should create an instance', () => {
    expect(new VolcanoCurve(sam)).toBeTruthy();
  });

  it('should return Infinity inside the sam asymptote', () => {
    const curve = new VolcanoCurve(sam)
    expect(curve.thresholdAt(1)).toBe(Infinity)
    expect(curve.thresholdAt(-0.5)).toBe(Infinity)
  });

  it('should match the t-distribution for the sam curve', () => {
    const curve = new VolcanoCurve(sam)
    const expected = -Math.log10(0.016130)
    expect(curve.thresholdAt(2)).toBeCloseTo(expected, 2)
    expect(curve.thresholdAt(-2)).toBeCloseTo(expected, 2)
  });

  it('should decrease towards the plain t cutoff as fold change grows', () => {
    const curve = new VolcanoCurve(sam)
    const flat = new VolcanoCurve({...sam, s0: 0})
    expect(curve.thresholdAt(2)).toBeGreaterThan(curve.thresholdAt(5))
    expect(curve.thresholdAt(1000)).toBeCloseTo(flat.thresholdAt(1000), 2)
  });

  it('should compute the hyperbolic curve', () => {
    const curve = new VolcanoCurve({type: "hyperbolic", c: 1, s0: 0, df: 0, x0: 0.5})
    expect(curve.thresholdAt(1.5)).toBeCloseTo(1)
    expect(curve.thresholdAt(0.4)).toBe(Infinity)
    expect(curve.isAbove(1.5, 1.2)).toBeTrue()
    expect(curve.isAbove(-1.5, 0.8)).toBeFalse()
  });

  it('should interpolate pasted points on each side', () => {
    const curve = new VolcanoCurve({type: "points", c: 0, s0: 0, df: 0, x0: 0}, [
      {x: 1, y: 4}, {x: 3, y: 2}, {x: -2, y: 6}, {x: -4, y: 2}
    ])
    expect(curve.thresholdAt(2)).toBeCloseTo(3)
    expect(curve.thresholdAt(10)).toBeCloseTo(2)
    expect(curve.thresholdAt(0.5)).toBe(Infinity)
    expect(curve.thresholdAt(-3)).toBeCloseTo(4)
  });

  it('should describe parameters for group labels', () => {
    expect(new VolcanoCurve(sam).description()).toBe("c=2;s0=0.5;df=4")
    expect(new VolcanoCurve({type: "points", c: 0, s0: 0, df: 0, x0: 0}).description()).toBe("")
  });

  it('should generate a symmetric curve clipped to the plot', () => {
    const points = new VolcanoCurve(sam).generate(6, 5, 10)
    expect(points.length).toBe(22)
    expect(points[0].x).toBeCloseTo(-points[11].x)
    expect(Math.max(...points.map(p => p.y))).toBeLessThanOrEqual(5)
    expect(points[11].y).toBeCloseTo(5, 3)
  });
});
