// Pure physics helpers. Units: km, s, kg unless stated. No game values in here.
export const vCirc = (mu, r) => Math.sqrt(mu / r);
export const vEsc = (mu, r) => Math.sqrt(2 * mu / r);

// Hohmann transfer between two circular orbits of radius r1 and r2 around a body with parameter mu.
export function hohmann(mu, r1, r2) {
  const a = (r1 + r2) / 2;
  const vT1 = Math.sqrt(mu * (2 / r1 - 1 / a));
  const vT2 = Math.sqrt(mu * (2 / r2 - 1 / a));
  return {
    dv1: Math.abs(vT1 - vCirc(mu, r1)),
    dv2: Math.abs(vCirc(mu, r2) - vT2),
    tofS: Math.PI * Math.sqrt(a ** 3 / mu),
  };
}

// Burn needed in a circular parking orbit of radius r to leave with hyperbolic excess speed vInf.
export const departureDv = (vInf, mu, r) => Math.sqrt(vInf ** 2 + 2 * mu / r) - vCirc(mu, r);

// Burn at periapsis rp to drop from a hyperbola (vInf) into an ellipse with apoapsis ra (ra = rp gives a circle).
export function captureDv(vInf, mu, rp, ra = rp) {
  const a = (rp + ra) / 2;
  return Math.sqrt(vInf ** 2 + 2 * mu / rp) - Math.sqrt(mu * (2 / rp - 1 / a));
}

export function apoapsisFromPeriod(mu, rp, periodS) {
  const a = Math.cbrt(mu * (periodS / (2 * Math.PI)) ** 2);
  return 2 * a - rp;
}

// Tsiolkovsky: initial mass over final mass for a burn of dv (km/s) at specific impulse isp (s).
export const massRatio = (dvKmS, isp, g0 = 9.80665) => Math.exp((dvKmS * 1000) / (isp * g0));

export const solarFlux = (tsi, rAU) => tsi / rAU ** 2;
export const lightTimeMin = (distKm, c = 299792.458) => distKm / c / 60;
export const dishGain = (diamM, lambdaM, eff) => eff * (Math.PI * diamM / lambdaM) ** 2;

// Friis link: achievable bit rate for the given transmit power, antenna gains, range and receiver noise.
export function linkRateBps({ ptW, gt, gr, lambdaM, distM, tsK, ebn0, kB = 1.380649e-23 }) {
  const pr = ptW * gt * gr * (lambdaM / (4 * Math.PI * distM)) ** 2;
  return pr / (kB * tsK) / ebn0;
}
