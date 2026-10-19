/**
 * Closed-Loop Pyrolysis Systems Simulator - Physical & Kinetic Model
 * Ported directly from Ezekiyas Tsegaye (2026):
 * 'Integrated Theoretical Framework for Byproduct Reintegration in Closed-Loop Pyrolysis Systems'
 */

export const CONFIG = {
  R_GAS: 8.314462618,
  T_AMB: 298.15,
  T_PYRO_NOMINAL: 500.0 + 273.15, // 773.15 K (500 °C)
  T_CHAR_NOMINAL: 800.0 + 273.15, // 1073.15 K (800 °C)
  TAU_VAPOR: 3.0,
  DELTA_H_PRIMARY: 1.0e6,         // J/kg (Endothermic cracking)
  DELTA_H_SECONDARY: -0.3e6,      // J/kg (Exothermic secondary)
  CP_BIOMASS_A: 1100.0,
  CP_BIOMASS_B: 1.2,
  CP_ASH: 950.0,
  CP_SYNGAS: 1200.0,
  CP_VAPOR: 1750.0,
  LHV_SYNGAS: 12.0e6,             // J/kg
  LHV_CHAR: 22.0e6,               // J/kg
  LHV_LPG: 46.1e6,                // J/kg
  BENCHMARK_FEED_MASS: 1000.0,
  BENCHMARK_ASH_MASS: 5940.0,
  BENCHMARK_EFFICIENCY: 73.6,
  KINETICS: {
    hemicellulose: { A: 2.1e9, Ea: 105.0e3, frac: 0.30 },
    cellulose:     { A: 5.0e14, Ea: 195.0e3, frac: 0.45 },
    lignin:        { A: 3.8e4,  Ea: 75.0e3,  frac: 0.25 },
    secondary_catalytic: { A: 120.0, Ea: 45.0e3 },
    secondary_thermal:   { A: 50.0,  Ea: 65.0e3 }
  }
};

export class PIDController {
  constructor(kp = 1.5, ki = 0.08, kd = 0.3, outMin = 0.0, outMax = 100.0) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.outMin = outMin;
    this.outMax = outMax;
    this.integral = 0.0;
    this.prevError = 0.0;
  }

  reset() {
    this.integral = 0.0;
    this.prevError = 0.0;
  }

  compute(setpoint, current, dt) {
    const error = setpoint - current;
    this.integral += error * dt;
    this.integral = Math.max(-150.0, Math.min(150.0, this.integral)); // Anti-windup
    const derivative = dt > 0 ? (error - this.prevError) / dt : 0;
    this.prevError = error;

    const output = (this.kp * error) + (this.ki * this.integral) + (this.kd * derivative);
    return Math.max(this.outMin, Math.min(this.outMax, output));
  }
}

export class FuzzySupervisor {
  evaluate(errorK, dErrorK) {
    let recircRatio = 0.5;
    let trimFuelPct = 0.0;

    if (errorK > 30.0) {
      trimFuelPct = Math.min(100.0, errorK * 2.2);
      recircRatio = 0.35;
    } else if (errorK > 5.0) {
      trimFuelPct = Math.min(40.0, errorK * 1.5);
      recircRatio = 0.45;
    } else if (errorK >= -5.0 && errorK <= 5.0) {
      trimFuelPct = Math.max(0.0, errorK * 0.5);
      recircRatio = 0.50;
    } else {
      trimFuelPct = 0.0;
      recircRatio = 0.60;
    }

    if (dErrorK < -2.0) {
      trimFuelPct *= 0.6;
    } else if (dErrorK > 2.0) {
      trimFuelPct = Math.min(100.0, trimFuelPct + 15.0);
    }

    return {
      recircRatio: Math.max(0.2, Math.min(0.75, recircRatio)),
      trimFuelPct: Math.max(0.0, Math.min(100.0, trimFuelPct))
    };
  }
}

export class PyrolysisSimulationModel {
  constructor() {
    this.reset();
  }

  reset() {
    this.time = 0.0;
    this.feedRate = 1000.0;                   // kg/h
    this.targetTempC = 500.0;                 // °C
    this.combustorTempC = 800.0;              // °C
    this.currentTempK = 380.0 + 273.15;       // Initial warm reactor temp
    this.charCatalysis = true;
    this.syngasRecirc = true;
    this.syngasRecircRatio = 0.50;
    this.manualMode = false;
    this.manualTrimFuel = 0.0;

    this.pid = new PIDController();
    this.fuzzy = new FuzzySupervisor();

    this.history = {
      times: [],
      temps: [],
      targetTemps: [],
      bioOilYields: [],
      charYields: [],
      gasYields: [],
      autothermalMargins: [],
      efficiencies: [],
      trimFuels: [],
      ashCarrierRates: []
    };

    this.lastState = this.computeState(0.1);
  }

  setFeedRate(rate) { this.feedRate = Math.max(100, Math.min(3000, rate)); }
  setTargetTempC(temp) { this.targetTempC = Math.max(400, Math.min(650, temp)); }
  setCombustorTempC(temp) { this.combustorTempC = Math.max(650, Math.min(950, temp)); }
  setSyngasRatio(ratio) { this.syngasRecircRatio = Math.max(0.0, Math.min(0.85, ratio)); }
  setCharCatalysis(enabled) { this.charCatalysis = !!enabled; }
  setSyngasRecirc(enabled) { this.syngasRecirc = !!enabled; }
  setManualMode(manual) { this.manualMode = !!manual; }
  setManualTrimFuel(pct) { this.manualTrimFuel = Math.max(0, Math.min(100, pct)); }

  computeKinetics(T_K) {
    const R = CONFIG.R_GAS;
    let kHemi = CONFIG.KINETICS.hemicellulose.A * Math.exp(-CONFIG.KINETICS.hemicellulose.Ea / (R * T_K));
    let kCell = CONFIG.KINETICS.cellulose.A * Math.exp(-CONFIG.KINETICS.cellulose.Ea / (R * T_K));
    let kLig  = CONFIG.KINETICS.lignin.A * Math.exp(-CONFIG.KINETICS.lignin.Ea / (R * T_K));

    kHemi = Math.max(1e-6, Math.min(10.0, kHemi));
    kCell = Math.max(1e-6, Math.min(10.0, kCell));
    kLig  = Math.max(1e-6, Math.min(10.0, kLig));

    const tau = CONFIG.TAU_VAPOR;
    const convHemi = 1.0 - Math.exp(-kHemi * tau);
    const convCell = 1.0 - Math.exp(-kCell * tau);
    const convLig  = 1.0 - Math.exp(-kLig * tau);

    // Primary product yields from biomass breakdown
    const rawVapor = (0.55 * convHemi * CONFIG.KINETICS.hemicellulose.frac) +
                     (0.70 * convCell * CONFIG.KINETICS.cellulose.frac) +
                     (0.40 * convLig * CONFIG.KINETICS.lignin.frac);

    const rawChar = (0.25 * convHemi * CONFIG.KINETICS.hemicellulose.frac) +
                    (0.12 * convCell * CONFIG.KINETICS.cellulose.frac) +
                    (0.45 * convLig * CONFIG.KINETICS.lignin.frac) +
                    (1.0 - (convHemi * 0.3 + convCell * 0.45 + convLig * 0.25)) * 0.15;

    const rawGas = Math.max(0.05, 1.0 - (rawVapor + rawChar));

    // Secondary catalytic tar cracking
    let secondaryCracked = 0.0;
    let retainedBioOil = rawVapor;
    let secondaryGas = 0.0;
    let secondaryChar = 0.0;

    if (this.charCatalysis) {
      const kCat = CONFIG.KINETICS.secondary_catalytic.A * Math.exp(-CONFIG.KINETICS.secondary_catalytic.Ea / (R * (this.combustorTempC + 273.15)));
      const crackFrac = Math.min(0.45, 1.0 - Math.exp(-kCat * 1.5));
      secondaryCracked = rawVapor * crackFrac;
      retainedBioOil = rawVapor - secondaryCracked;
      secondaryGas = secondaryCracked * 0.72;
      secondaryChar = secondaryCracked * 0.28;
    }

    // Syngas hydrodeoxygenation (HDO) upgrading
    let finalBioOil = retainedBioOil;
    let finalGas = rawGas + secondaryGas;
    let finalChar = rawChar + secondaryChar;

    if (this.syngasRecirc) {
      const deoxygenationExtent = Math.min(0.25, this.syngasRecircRatio * 0.35);
      const massShift = retainedBioOil * deoxygenationExtent * 0.12;
      finalBioOil = retainedBioOil - massShift;
      finalGas += massShift;
    }

    // Normalize to 100% total mass
    const total = finalBioOil + finalChar + finalGas;
    return {
      bioOilYieldPct: (finalBioOil / total) * 100.0,
      charYieldPct: (finalChar / total) * 100.0,
      gasYieldPct: (finalGas / total) * 100.0,
      secondaryCrackedMassFrac: secondaryCracked
    };
  }

  computeThermodynamics(T_pyro_K, yields) {
    const T_amb = CONFIG.T_AMB;
    const feedSec = this.feedRate / 3600.0; // kg/s
    const T_comb_K = this.combustorTempC + 273.15;

    // Sensible heat biomass
    const cpBiomass = CONFIG.CP_BIOMASS_A + CONFIG.CP_BIOMASS_B * ((T_pyro_K + T_amb) / 2.0);
    const qSensibleBiomass = feedSec * cpBiomass * (T_pyro_K - T_amb);

    // Endothermic primary reaction heat
    const qPrimaryEndo = feedSec * CONFIG.DELTA_H_PRIMARY;

    // Exothermic secondary cracking
    const qSecondaryExo = (feedSec * yields.secondaryCrackedMassFrac) * CONFIG.DELTA_H_SECONDARY;

    // Heat loss
    const qLossReactor = 0.05 * (qSensibleBiomass + qPrimaryEndo);
    const qTotalReactorSec = qSensibleBiomass + qPrimaryEndo + qSecondaryExo + qLossReactor;

    // Solid ash heat carrier mass rate required: Q = m_ash * cp_ash * (T_comb - T_pyro)
    const deltaT_carrier = Math.max(25.0, T_comb_K - T_pyro_K);
    const mAshCarrierSec = qTotalReactorSec / (CONFIG.CP_ASH * deltaT_carrier);
    const ashCarrierRateKgHr = mAshCarrierSec * 3600.0;

    // Heat delivered by carrier
    const qCarrierDeliveredSec = mAshCarrierSec * CONFIG.CP_ASH * deltaT_carrier;

    // Closed-loop combustion of byproducts for ash reheating
    const charBurnedFrac = 0.70;
    const syngasBurnedFrac = Math.max(0.0, 1.0 - (this.syngasRecirc ? this.syngasRecircRatio : 0.0));

    const charCombSec = (yields.charYieldPct / 100.0) * feedSec * charBurnedFrac;
    const syngasCombSec = (yields.gasYieldPct / 100.0) * feedSec * syngasBurnedFrac;

    const qCombustionGenSec = (charCombSec * CONFIG.LHV_CHAR) + (syngasCombSec * CONFIG.LHV_SYNGAS);

    // Heat needed to reheat spent ash back to combustor temp:
    const qAshReheatSec = mAshCarrierSec * CONFIG.CP_ASH * (T_comb_K - T_pyro_K);
    const qCombustorLossSec = 0.08 * (qAshReheatSec + qCombustionGenSec);
    const qCombustorDemandSec = qAshReheatSec + qCombustorLossSec;

    // Autothermal margin (Surplus energy in MJ/h)
    const netSurplusSec = qCombustionGenSec - qCombustorDemandSec;
    const autothermalMarginMJHr = (netSurplusSec * 3600.0) / 1.0e6;

    // Thermal efficiency: Output useful heat / Total input heat
    const usefulHeatSec = (yields.bioOilYieldPct / 100.0 * feedSec * 19.5e6) + // Bio-oil HHV ~19.5 MJ/kg
                          ((1.0 - charBurnedFrac) * (yields.charYieldPct / 100.0) * feedSec * CONFIG.LHV_CHAR) +
                          ((1.0 - syngasBurnedFrac) * (yields.gasYieldPct / 100.0) * feedSec * CONFIG.LHV_SYNGAS);
    const totalInputEnergySec = (feedSec * 18.5e6); // Dry biomass HHV ~18.5 MJ/kg
    const thermalEfficiency = Math.min(88.0, Math.max(45.0, (usefulHeatSec / totalInputEnergySec) * 100.0));

    return {
      qTotalReactorSec,
      ashCarrierRateKgHr,
      qCarrierDeliveredSec,
      autothermalMarginMJHr,
      thermalEfficiency,
      isAutothermal: autothermalMarginMJHr >= 0
    };
  }

  step(dt = 1.0) {
    this.time += dt;
    const targetK = this.targetTempC + 273.15;
    const errorK = targetK - this.currentTempK;
    const prevError = this.pid.prevError;
    const dErrorK = dt > 0 ? (errorK - prevError) / dt : 0;

    // Controller calculations
    let trimFuelPct = 0.0;
    if (this.manualMode) {
      trimFuelPct = this.manualTrimFuel;
    } else {
      const fuzzyOut = this.fuzzy.evaluate(errorK, dErrorK);
      if (this.syngasRecirc) {
        this.syngasRecircRatio = fuzzyOut.recircRatio;
      }
      const pidOut = this.pid.compute(targetK, this.currentTempK, dt);
      trimFuelPct = Math.max(0.0, Math.min(100.0, (fuzzyOut.trimFuelPct * 0.6) + (pidOut * 0.4)));
      
      // When within steady-state and autothermal, auxiliary fuel is cut to 0
      if (Math.abs(errorK) < 2.5 && this.time > 60.0) {
        trimFuelPct = 0.0;
      }
    }

    // Physical Kinetics & Thermodynamics
    const yields = this.computeKinetics(this.currentTempK);
    const thermo = this.computeThermodynamics(this.currentTempK, yields);

    // ODE Temperature Integration: c_bed * dT/dt = Q_net
    const effectiveBedCap = (this.feedRate * 0.2 * CONFIG.CP_BIOMASS_A) + (CONFIG.BENCHMARK_ASH_MASS * 0.1 * CONFIG.CP_ASH);
    let netQRate = (thermo.qCarrierDeliveredSec - thermo.qTotalReactorSec);
    // Add heat from trim fuel burner
    netQRate += (trimFuelPct / 100.0) * 1.5e5; // Auxiliary heater up to 150 kW

    let dT_dt = netQRate / effectiveBedCap;
    dT_dt = Math.max(-4.0, Math.min(6.0, dT_dt)); // Physically bounded heating/cooling rate
    this.currentTempK += dT_dt * dt;

    const state = {
      time: this.time,
      tempC: this.currentTempK - 273.15,
      targetTempC: this.targetTempC,
      combustorTempC: this.combustorTempC,
      bioOilYieldPct: yields.bioOilYieldPct,
      charYieldPct: yields.charYieldPct,
      gasYieldPct: yields.gasYieldPct,
      ashCarrierRateKgHr: thermo.ashCarrierRateKgHr,
      autothermalMarginMJ: thermo.autothermalMarginMJHr,
      thermalEfficiency: thermo.thermalEfficiency,
      trimFuelPct: trimFuelPct,
      syngasRecircRatio: this.syngasRecircRatio,
      charCatalysis: this.charCatalysis,
      syngasRecirc: this.syngasRecirc,
      isAutothermal: thermo.isAutothermal
    };

    this.lastState = state;

    // Record history (keep up to 300 points for real-time charting)
    this.history.times.push(this.time);
    this.history.temps.push(state.tempC);
    this.history.targetTemps.push(state.targetTempC);
    this.history.bioOilYields.push(state.bioOilYieldPct);
    this.history.charYields.push(state.charYieldPct);
    this.history.gasYields.push(state.gasYieldPct);
    this.history.autothermalMargins.push(state.autothermalMarginMJ);
    this.history.efficiencies.push(state.thermalEfficiency);
    this.history.trimFuels.push(state.trimFuelPct);
    this.history.ashCarrierRates.push(state.ashCarrierRateKgHr);

    if (this.history.times.length > 250) {
      for (const key in this.history) {
        this.history[key].shift();
      }
    }

    return state;
  }

  computeState(dt = 0.1) {
    return this.step(dt);
  }
}
