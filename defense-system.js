/**
 * OrbitalShield Advanced Asteroid Defense System
 * Comprehensive mission optimization for planetary defense
 * 
 * This system provides intelligent selection and optimization of asteroid deflection methods
 * based on asteroid characteristics, mission constraints, and technological capabilities.
 */

// =======================================================================================
// ASTEROID DEFENSE METHOD DATABASE
// =======================================================================================

const ASTEROID_DEFENSE_METHODS = {
  kinetic: {
    name: 'Kinetic Impactor',
    description: 'High-velocity spacecraft collision transfers momentum to asteroid',
    examples: 'DART (2022), Deep Impact (2005), AIDA concept',
    
    // Physical Capabilities
    deltaV_range: { min: 1, max: 50, units: 'mm/s', optimal: [5, 25] },
    spacecraft_mass: { base: 800, min: 400, max: 15000, units: 'kg' },
    momentum_enhancement: 2.8, // Beta factor from impact ejecta
    
    // Mission Parameters
    development_time: { min: 2.5, max: 5, units: 'years' },
    mission_duration: { min: 0.8, max: 3.5, units: 'years' },
    warning_time: { min: 5, max: 25, optimal: [8, 20], units: 'years' },
    
    // Effectiveness Profile
    optimal_mass_ratio: { min: 100, max: 500000, peak: [1000, 50000] },
    mass_effectiveness: 'decreases_rapidly_above_peak',
    reliability: 0.88,
    technology_readiness: 9,
    
    // Cost and Complexity
    cost_base: 450, // Million USD
    cost_scale_factor: 1.8, // How cost scales with mission complexity
    operational_complexity: 'medium',
    
    // Strategic Considerations
    advantages: ['Proven technology', 'Fast deployment', 'High precision', 'Predictable outcomes'],
    limitations: ['Mass-limited effectiveness', 'Single-use', 'Requires precise trajectory', 'Limited to smaller asteroids'],
    political_feasibility: 'high'
  },

  gravity: {
    name: 'Gravity Tractor',
    description: 'Spacecraft uses gravitational attraction to slowly deflect asteroid',
    examples: 'ESA NEO-MAPP studies, NASA gravity tractor concepts',
    
    // Physical Capabilities
    deltaV_range: { min: 0.01, max: 8, units: 'mm/s', optimal: [0.1, 3] },
    spacecraft_mass: { base: 3500, min: 1500, max: 25000, units: 'kg' },
    momentum_enhancement: 1.0, // Pure gravitational effect
    
    // Mission Parameters
    development_time: { min: 4, max: 8, units: 'years' },
    mission_duration: { min: 8, max: 25, units: 'years' },
    warning_time: { min: 15, max: 60, optimal: [20, 45], units: 'years' },
    
    // Effectiveness Profile
    optimal_mass_ratio: { min: 50, max: 100000, peak: [200, 10000] },
    mass_effectiveness: 'scales_well_with_time',
    reliability: 0.94,
    technology_readiness: 7,
    
    // Cost and Complexity
    cost_base: 1200,
    cost_scale_factor: 2.2,
    operational_complexity: 'high',
    
    // Strategic Considerations
    advantages: ['Extremely precise', 'Works on any composition', 'Scalable with time', 'No surface contact'],
    limitations: ['Very slow', 'Long missions', 'High fuel requirements', 'Complex operations'],
    political_feasibility: 'high'
  },

  nuclear: {
    name: 'Nuclear Standoff Burst',
    description: 'Nuclear device creates massive impulse through X-ray ablation',
    examples: 'Project Icarus (1968), NASA nuclear deflection studies',
    
    // Physical Capabilities
    deltaV_range: { min: 5, max: 1000, units: 'mm/s', optimal: [20, 400] },
    spacecraft_mass: { base: 8000, min: 3000, max: 80000, units: 'kg' },
    momentum_enhancement: 25.0, // Massive enhancement from vaporization
    
    // Mission Parameters
    development_time: { min: 4, max: 12, units: 'years' },
    mission_duration: { min: 1, max: 5, units: 'years' },
    warning_time: { min: 1, max: 15, optimal: [2, 10], units: 'years' },
    
    // Effectiveness Profile
    optimal_mass_ratio: { min: 5000, max: 50000000, peak: [100000, 10000000] },
    mass_effectiveness: 'excellent_for_massive_objects',
    reliability: 0.75,
    technology_readiness: 6,
    
    // Cost and Complexity
    cost_base: 3500,
    cost_scale_factor: 2.8,
    operational_complexity: 'extreme',
    
    // Strategic Considerations
    advantages: ['Handles massive asteroids', 'Fast execution', 'Enormous energy', 'Last resort capability'],
    limitations: ['Political barriers', 'Fragmentation risk', 'Complex technology', 'International treaties'],
    political_feasibility: 'very_low'
  },

  laser: {
    name: 'Laser Ablation Array',
    description: 'High-power laser array creates continuous thrust through surface ablation',
    examples: 'DE-STAR concept, Breakthrough Starshot scalability studies',
    
    // Physical Capabilities
    deltaV_range: { min: 0.1, max: 25, units: 'mm/s', optimal: [1, 12] },
    spacecraft_mass: { base: 4500, min: 2000, max: 35000, units: 'kg' },
    momentum_enhancement: 4.2, // Enhanced by ejected material
    
    // Mission Parameters
    development_time: { min: 8, max: 15, units: 'years' },
    mission_duration: { min: 3, max: 18, units: 'years' },
    warning_time: { min: 8, max: 30, optimal: [12, 25], units: 'years' },
    
    // Effectiveness Profile
    optimal_mass_ratio: { min: 200, max: 200000, peak: [1000, 50000] },
    mass_effectiveness: 'power_limited_scaling',
    reliability: 0.65,
    technology_readiness: 4,
    
    // Cost and Complexity
    cost_base: 2800,
    cost_scale_factor: 3.1,
    operational_complexity: 'extreme',
    
    // Strategic Considerations
    advantages: ['Continuous thrust', 'Precise control', 'Distance operation', 'Scalable power'],
    limitations: ['Unproven technology', 'Enormous power requirements', 'Beam diffraction', 'Complex targeting'],
    political_feasibility: 'medium'
  },

  ion: {
    name: 'Ion Beam Shepherd',
    description: 'Ion beam creates continuous low thrust on asteroid surface',
    examples: 'NASA JPL shepherd concepts, ESA ion deflection studies',
    
    // Physical Capabilities
    deltaV_range: { min: 0.05, max: 12, units: 'mm/s', optimal: [0.3, 6] },
    spacecraft_mass: { base: 2800, min: 1200, max: 20000, units: 'kg' },
    momentum_enhancement: 1.4, // Slight enhancement from surface interaction
    
    // Mission Parameters
    development_time: { min: 5, max: 9, units: 'years' },
    mission_duration: { min: 4, max: 20, units: 'years' },
    warning_time: { min: 10, max: 35, optimal: [15, 28], units: 'years' },
    
    // Effectiveness Profile
    optimal_mass_ratio: { min: 100, max: 150000, peak: [500, 30000] },
    mass_effectiveness: 'steady_scaling_with_time',
    reliability: 0.91,
    technology_readiness: 8,
    
    // Cost and Complexity
    cost_base: 950,
    cost_scale_factor: 2.0,
    operational_complexity: 'high',
    
    // Strategic Considerations
    advantages: ['High efficiency', 'Proven ion technology', 'Precise control', 'Long operational life'],
    limitations: ['Very low thrust', 'Close proximity required', 'Long mission times', 'Complex operations'],
    political_feasibility: 'high'
  },

  mass_driver: {
    name: 'Surface Mass Driver',
    description: 'Surface-mounted electromagnetic launcher ejects asteroid material for thrust',
    examples: 'Space tug concepts, asteroid mining propulsion studies',
    
    // Physical Capabilities
    deltaV_range: { min: 2, max: 180, units: 'mm/s', optimal: [8, 80] },
    spacecraft_mass: { base: 6500, min: 3500, max: 45000, units: 'kg' },
    momentum_enhancement: 6.8, // Efficient use of asteroid material
    
    // Mission Parameters
    development_time: { min: 6, max: 12, units: 'years' },
    mission_duration: { min: 2, max: 12, units: 'years' },
    warning_time: { min: 8, max: 25, optimal: [10, 20], units: 'years' },
    
    // Effectiveness Profile
    optimal_mass_ratio: { min: 1000, max: 5000000, peak: [10000, 1000000] },
    mass_effectiveness: 'excellent_for_large_objects',
    reliability: 0.82,
    technology_readiness: 5,
    
    // Cost and Complexity
    cost_base: 1800,
    cost_scale_factor: 2.4,
    operational_complexity: 'extreme',
    
    // Strategic Considerations
    advantages: ['Uses asteroid material', 'High thrust potential', 'Reduces asteroid mass', 'Scalable'],
    limitations: ['Complex surface operations', 'Landing required', 'Composition dependent', 'Unproven technology'],
    political_feasibility: 'medium'
  }
};

// =======================================================================================
// ASTEROID CLASSIFICATION SYSTEM
// =======================================================================================

const ASTEROID_MASS_CATEGORIES = {
  tiny: {
    range: [1e6, 1e9], // 1M to 1B kg
    label: 'Tiny',
    description: 'Small near-Earth objects',
    typical_diameter: '1-10 meters',
    threat_level: 'minimal',
    optimal_methods: ['kinetic', 'laser'],
    deployment_urgency: 'low'
  },
  small: {
    range: [1e9, 1e11], // 1B to 100B kg
    label: 'Small',
    description: 'House to building-sized asteroids',
    typical_diameter: '10-50 meters',
    threat_level: 'local',
    optimal_methods: ['kinetic', 'gravity', 'ion'],
    deployment_urgency: 'medium'
  },
  medium: {
    range: [1e11, 1e13], // 100B to 10T kg
    label: 'Medium',
    description: 'City-killer asteroids',
    typical_diameter: '50-200 meters',
    threat_level: 'regional',
    optimal_methods: ['kinetic', 'nuclear', 'mass_driver'],
    deployment_urgency: 'high'
  },
  large: {
    range: [1e13, 1e15], // 10T to 1000T kg
    label: 'Large',
    description: 'Regional devastation asteroids',
    typical_diameter: '200-500 meters',
    threat_level: 'continental',
    optimal_methods: ['nuclear', 'mass_driver', 'gravity'],
    deployment_urgency: 'critical'
  },
  massive: {
    range: [1e15, 1e17], // 1000T to 100,000T kg
    label: 'Massive',
    description: 'Global catastrophe asteroids',
    typical_diameter: '500-1000 meters',
    threat_level: 'global',
    optimal_methods: ['nuclear', 'mass_driver'],
    deployment_urgency: 'maximum'
  },
  ultra_massive: {
    range: [1e17, 1e20], // 100,000T+ kg
    label: 'Ultra-Massive',
    description: 'Extinction-level asteroids',
    typical_diameter: '1+ kilometers',
    threat_level: 'extinction',
    optimal_methods: ['nuclear'],
    deployment_urgency: 'absolute'
  }
};

// =======================================================================================
// ASTEROID DEFENSE SYSTEM CLASS
// =======================================================================================

class AsteroidDefenseSystem {
  constructor() {
    this.methods = ASTEROID_DEFENSE_METHODS;
    this.categories = ASTEROID_MASS_CATEGORIES;
    this.debugMode = true;
  }

  /**
   * Classifies an asteroid based on its mass
   */
  classifyAsteroid(mass) {
    for (const [category, info] of Object.entries(this.categories)) {
      if (mass >= info.range[0] && mass < info.range[1]) {
        return { category, ...info };
      }
    }
    // Ultra-massive catch-all
    return { category: 'ultra_massive', ...this.categories.ultra_massive };
  }

  /**
   * Calculate mass ratio for a given method and asteroid
   */
  calculateMassRatio(asteroidMass, method) {
    const methodInfo = this.methods[method];
    return asteroidMass / methodInfo.spacecraft_mass.base;
  }

  /**
   * Evaluate method effectiveness based on mass ratio
   */
  evaluateMassEffectiveness(massRatio, method) {
    const methodInfo = this.methods[method];
    const optimal = methodInfo.optimal_mass_ratio;
    
    if (massRatio >= optimal.peak[0] && massRatio <= optimal.peak[1]) {
      // Perfect zone
      return 1.0;
    } else if (massRatio >= optimal.min && massRatio <= optimal.max) {
      // Acceptable zone - calculate distance from peak
      const peakCenter = (optimal.peak[0] + optimal.peak[1]) / 2;
      const distance = Math.abs(Math.log10(massRatio) - Math.log10(peakCenter));
      return Math.max(0.6, 1.0 - distance * 0.15);
    } else if (massRatio < optimal.min) {
      // Below minimum - overkill penalty
      const underFactor = optimal.min / massRatio;
      return Math.max(0.2, 0.7 - Math.log10(underFactor) * 0.2);
    } else {
      // Above maximum - inadequate power penalty
      const overFactor = massRatio / optimal.max;
      return Math.max(0.1, 0.6 - Math.log10(overFactor) * 0.3);
    }
  }

  /**
   * Evaluate timing effectiveness
   */
  evaluateTimingEffectiveness(yearsToImpact, method) {
    const methodInfo = this.methods[method];
    const timing = methodInfo.warning_time;
    
    if (yearsToImpact >= timing.optimal[0] && yearsToImpact <= timing.optimal[1]) {
      return 1.0;
    } else if (yearsToImpact >= timing.min && yearsToImpact <= timing.max) {
      // Calculate distance from optimal zone
      const optimalCenter = (timing.optimal[0] + timing.optimal[1]) / 2;
      const distance = Math.abs(yearsToImpact - optimalCenter) / optimalCenter;
      return Math.max(0.5, 1.0 - distance * 0.8);
    } else if (yearsToImpact < timing.min) {
      // Too urgent
      const urgencyPenalty = (timing.min - yearsToImpact) / timing.min;
      return Math.max(0.1, 0.6 - urgencyPenalty * 0.5);
    } else {
      // Too much time (less critical)
      return 0.7;
    }
  }

  /**
   * Select the optimal defense method
   */
  selectOptimalMethod(asteroidMass, yearsToImpact, isHazardous = false) {
    const classification = this.classifyAsteroid(asteroidMass);
    let bestMethod = null;
    let bestScore = -Infinity;
    let detailedScores = {};

    if (this.debugMode) {
      console.log(`\n🎯 === ASTEROID DEFENSE ANALYSIS ===`);
      console.log(`📊 Mass: ${(asteroidMass/1e9).toFixed(1)}B kg (${classification.label})`);
      console.log(`⏰ Time to impact: ${yearsToImpact} years`);
      console.log(`⚠️ Hazardous: ${isHazardous}`);
      console.log(`💀 Threat level: ${classification.threat_level}`);
    }

    for (const [methodKey, methodInfo] of Object.entries(this.methods)) {
      const massRatio = this.calculateMassRatio(asteroidMass, methodKey);
      const massEffectiveness = this.evaluateMassEffectiveness(massRatio, methodKey);
      const timingEffectiveness = this.evaluateTimingEffectiveness(yearsToImpact, methodKey);
      
      // Base score components
      let massScore = massEffectiveness * 40;
      let timingScore = timingEffectiveness * 30;
      let reliabilityScore = methodInfo.reliability * 20;
      let readinessScore = (methodInfo.technology_readiness / 10) * 10;
      
      // Adjustments for hazardous asteroids
      if (isHazardous) {
        // Prefer proven methods for hazardous asteroids
        if (methodInfo.technology_readiness >= 8) {
          reliabilityScore *= 1.3;
        }
        
        // Political feasibility matters more for hazardous asteroids
        const politicalPenalty = {
          'very_low': 0.3,
          'low': 0.7,
          'medium': 0.9,
          'high': 1.0
        };
        const penalty = politicalPenalty[methodInfo.political_feasibility] || 1.0;
        reliabilityScore *= penalty;
      }
      
      // Classification-based preferences
      if (classification.optimal_methods.includes(methodKey)) {
        massScore *= 1.2; // Boost for category-optimal methods
      }
      
      const totalScore = massScore + timingScore + reliabilityScore + readinessScore;
      
      detailedScores[methodKey] = {
        massRatio,
        massEffectiveness,
        timingEffectiveness,
        massScore,
        timingScore,
        reliabilityScore,
        readinessScore,
        totalScore
      };
      
      if (this.debugMode) {
        console.log(`${methodKey}: ratio=${massRatio.toFixed(0)}, mass=${massScore.toFixed(1)}, time=${timingScore.toFixed(1)}, rel=${reliabilityScore.toFixed(1)}, total=${totalScore.toFixed(1)}`);
      }
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMethod = methodKey;
      }
    }

    if (this.debugMode) {
      console.log(`\n🏆 Selected: ${bestMethod} (score: ${bestScore.toFixed(1)})`);
    }

    return {
      method: bestMethod,
      score: bestScore,
      classification,
      detailedScores
    };
  }

  /**
   * Calculate mission parameters for the selected method
   */
  calculateMissionParameters(method, asteroidMass, yearsToImpact, selection) {
    const methodInfo = this.methods[method];
    const classification = selection.classification;
    const massInBillions = asteroidMass / 1e9;
    
    // Calculate scaling factors based on asteroid mass category
    let massScaleFactor = 1.0;
    let deltaVScaleFactor = 1.0;
    let durationScaleFactor = 1.0;
    
    // Category-based scaling
    switch(classification.category) {
      case 'tiny':
        massScaleFactor = 0.6;
        deltaVScaleFactor = 0.8;
        durationScaleFactor = 0.8;
        break;
      case 'small':
        massScaleFactor = 1.0;
        deltaVScaleFactor = 1.0;
        durationScaleFactor = 1.0;
        break;
      case 'medium':
        massScaleFactor = 2.2;
        deltaVScaleFactor = 1.8;
        durationScaleFactor = 1.1;
        break;
      case 'large':
        massScaleFactor = 4.5;
        deltaVScaleFactor = 3.2;
        durationScaleFactor = 1.3;
        break;
      case 'massive':
        massScaleFactor = 8.5;
        deltaVScaleFactor = 6.0;
        durationScaleFactor = 1.6;
        break;
      case 'ultra_massive':
        massScaleFactor = 15.0;
        deltaVScaleFactor = 12.0;
        durationScaleFactor = 2.0;
        break;
    }
    
    // Method-specific adjustments
    if (method === 'nuclear') {
      // Nuclear scales exceptionally well with mass
      deltaVScaleFactor *= Math.min(3.0, Math.pow(massInBillions / 1000, 0.3));
      massScaleFactor *= Math.min(2.5, Math.pow(massInBillions / 5000, 0.2));
    } else if (method === 'kinetic') {
      // Kinetic has limited scalability
      deltaVScaleFactor = Math.min(deltaVScaleFactor, 2.0);
      massScaleFactor = Math.min(massScaleFactor, 3.0);
    } else if (method === 'gravity') {
      // Gravity tractor benefits from more time and larger spacecraft
      if (yearsToImpact > methodInfo.warning_time.optimal[1]) {
        durationScaleFactor *= 1.5;
        deltaVScaleFactor *= 0.7; // Can use less deltaV with more time
      }
    }
    
    // Calculate final parameters
    const spacecraftMass = Math.round(methodInfo.spacecraft_mass.base * massScaleFactor);
    const deltaV = Math.round(
      ((methodInfo.deltaV_range.optimal[0] + methodInfo.deltaV_range.optimal[1]) / 2) * 
      deltaVScaleFactor * 10
    ) / 10;
    const missionDuration = Math.round(
      ((methodInfo.mission_duration.min + methodInfo.mission_duration.max) / 2) * 
      durationScaleFactor * 10
    ) / 10;
    
    // Ensure parameters stay within realistic bounds
    const finalSpacecraftMass = Math.min(spacecraftMass, methodInfo.spacecraft_mass.max);
    const finalDeltaV = Math.min(deltaV, methodInfo.deltaV_range.max);
    const finalDuration = Math.max(
      methodInfo.mission_duration.min,
      Math.min(missionDuration, methodInfo.mission_duration.max)
    );
    
    // Calculate cost estimate
    const baseCost = methodInfo.cost_base;
    const complexityMultiplier = Math.pow(massScaleFactor, methodInfo.cost_scale_factor / 2);
    const totalCost = Math.round(baseCost * complexityMultiplier);
    
    const parameters = {
      spacecraftMass: finalSpacecraftMass,
      deltaV: finalDeltaV,
      missionDuration: finalDuration,
      yearsToImpact,
      estimatedCost: totalCost,
      developmentTime: methodInfo.development_time.max, // Use pessimistic estimate
      reliability: methodInfo.reliability,
      complexity: methodInfo.operational_complexity
    };
    
    if (this.debugMode) {
      console.log(`\n🛠️ MISSION PARAMETERS:`);
      console.log(`🚀 Spacecraft mass: ${parameters.spacecraftMass}kg (${massScaleFactor.toFixed(1)}x scale)`);
      console.log(`⚡ Delta-V: ${parameters.deltaV}mm/s (${deltaVScaleFactor.toFixed(1)}x scale)`);
      console.log(`⏱️ Mission duration: ${parameters.missionDuration} years`);
      console.log(`💰 Estimated cost: $${parameters.estimatedCost}M USD`);
      console.log(`⚙️ Development time: ${parameters.developmentTime} years`);
    }
    
    return parameters;
  }

  /**
   * Main function to analyze asteroid and recommend defense strategy
   */
  analyzeAsteroidDefense(asteroidMass, yearsToImpact, isHazardous = false) {
    const selection = this.selectOptimalMethod(asteroidMass, yearsToImpact, isHazardous);
    const parameters = this.calculateMissionParameters(
      selection.method, 
      asteroidMass, 
      yearsToImpact, 
      selection
    );
    
    return {
      ...selection,
      parameters,
      methodInfo: this.methods[selection.method],
      recommendation: this.generateRecommendation(selection, parameters)
    };
  }

  /**
   * Generate human-readable recommendation
   */
  generateRecommendation(selection, parameters) {
    const method = this.methods[selection.method];
    const category = selection.classification;
    
    let urgency = '';
    if (parameters.yearsToImpact < 5) urgency = 'URGENT';
    else if (parameters.yearsToImpact < 10) urgency = 'HIGH PRIORITY';
    else if (parameters.yearsToImpact < 20) urgency = 'MEDIUM PRIORITY';
    else urgency = 'LONG-TERM PLANNING';
    
    return {
      urgency,
      summary: `Deploy ${method.name} with ${parameters.spacecraftMass}kg spacecraft delivering ${parameters.deltaV}mm/s over ${parameters.missionDuration} years`,
      threat_assessment: `${category.label} asteroid poses ${category.threat_level} threat`,
      confidence: `${Math.round(selection.score)}% mission confidence`,
      cost_summary: `Estimated $${parameters.estimatedCost}M USD over ${parameters.developmentTime} years development`
    };
  }
}

// =======================================================================================
// EXPORT FOR INTEGRATION
// =======================================================================================

// Create global instance
window.AsteroidDefenseSystem = AsteroidDefenseSystem;
window.defenseSystem = new AsteroidDefenseSystem();

console.log('🛡️ OrbitalShield Defense System initialized');
console.log('📊 Available methods:', Object.keys(ASTEROID_DEFENSE_METHODS));
console.log('🎯 Mass categories:', Object.keys(ASTEROID_MASS_CATEGORIES));