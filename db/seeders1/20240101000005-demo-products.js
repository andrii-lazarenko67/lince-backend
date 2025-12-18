'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Products', [
      // Disinfectants and Oxidizers
      {
        name: 'Sodium Hypochlorite 12%',
        type: 'Disinfectant',
        unit: 'L',
        supplier: 'Brazil Chemicals Ltd',
        currentStock: 500.00,
        minStockAlert: 100.00,
        description: 'Liquid chlorine for water disinfection, 12% concentration. Used in pools and potable water systems.',
        recommendedDosage: 'Pools: 50-100 ml/m³ for daily maintenance. Shock treatment: 200-300 ml/m³. Potable water: according to residual chlorine analysis (maintain 0.5-2.0 ppm).',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Granular Chlorine 65%',
        type: 'Disinfectant',
        unit: 'kg',
        supplier: 'Pool Tech Brazil',
        currentStock: 150.00,
        minStockAlert: 30.00,
        description: 'Granular calcium hypochlorite, high concentration. Ideal for pool shock treatment.',
        recommendedDosage: 'Shock treatment: 10-15 g/m³. Maintenance: 3-5 g/m³ daily. Dissolve in bucket before applying.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chlorine Dioxide',
        type: 'Disinfectant',
        unit: 'L',
        supplier: 'BioChemical Industrial',
        currentStock: 80.00,
        minStockAlert: 20.00,
        description: 'Oxidizing disinfectant for potable water systems and cooling towers. High efficacy against biofilm.',
        recommendedDosage: 'Potable water: 0.1-0.5 ppm. Cooling towers: 0.5-2.0 ppm. Apply continuously or by batch as needed.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // pH Regulators
      {
        name: 'Hydrochloric Acid 33%',
        type: 'pH Reducer',
        unit: 'L',
        supplier: 'Brazil Chemicals Ltd',
        currentStock: 200.00,
        minStockAlert: 50.00,
        description: 'Muriatic acid for pH and alkalinity reduction. Handling requires proper PPE.',
        recommendedDosage: 'Pools: 100-200 ml/10m³ to reduce 0.2 pH units. Add slowly around pool with pump running. Wait 4 hours before swimming.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sulfuric Acid 98%',
        type: 'pH Reducer',
        unit: 'L',
        supplier: 'IndChemical Inc.',
        currentStock: 100.00,
        minStockAlert: 25.00,
        description: 'Concentrated acid for industrial systems. Used in boilers and cooling towers.',
        recommendedDosage: 'Cooling towers: Dilute to 10% before applying. Dosage: 50-100 ml diluted solution/m³ to adjust pH. Boilers: according to pH analysis (maintain 10.5-11.5). Apply via metering pump.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Light Soda Ash (Sodium Carbonate)',
        type: 'pH Increaser',
        unit: 'kg',
        supplier: 'Alkali Mining',
        currentStock: 300.00,
        minStockAlert: 50.00,
        description: 'Increases water pH and alkalinity. Powder product, easy dissolution.',
        recommendedDosage: 'Pools: 100-150 g/10m³ to raise 0.2 pH units. Dissolve in bucket before applying. For alkalinity: 150-200 g/10m³ raises 10 ppm. Apply with pump running.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Caustic Soda (Sodium Hydroxide)',
        type: 'pH Increaser',
        unit: 'kg',
        supplier: 'Brazil Chemicals Ltd',
        currentStock: 150.00,
        minStockAlert: 30.00,
        description: 'Strong alkaline product for pH correction in industrial systems.',
        recommendedDosage: 'Cooling towers: 10% solution, dose 20-50 ml/m³ to raise pH. Effluent treatment: according to analysis. CAUTION: Corrosive product, use full PPE. Always add to water, never the opposite.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Algaecides and Bactericides
      {
        name: 'Quaternary Algaecide',
        type: 'Algaecide',
        unit: 'L',
        supplier: 'Pool Tech Brazil',
        currentStock: 75.00,
        minStockAlert: 15.00,
        description: 'Preventive algae control in pools. Non-foaming, compatible with chlorine.',
        recommendedDosage: 'Preventive maintenance: 50-100 ml/10m³ weekly. Shock treatment (green water): 200-300 ml/10m³. Apply at dusk with pump running. Wait 24h before swimming.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Copper Algaecide',
        type: 'Algaecide',
        unit: 'L',
        supplier: 'AquaTreat Products',
        currentStock: 40.00,
        minStockAlert: 10.00,
        description: 'Chelated copper sulfate for resistant algae treatment. Long-lasting action.',
        recommendedDosage: 'Persistent algae treatment: 100-150 ml/10m³. Maintenance: 30-50 ml/10m³ biweekly. Do not use in pools with metal lining. Maintain pH between 7.2-7.6. Wait 48h before swimming.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Industrial Bactericide THPS',
        type: 'Bactericide',
        unit: 'L',
        supplier: 'BioChemical Industrial',
        currentStock: 60.00,
        minStockAlert: 15.00,
        description: 'Biodegradable biocide for cooling towers. Effective against Legionella.',
        recommendedDosage: 'Cooling towers: Initial dosage: 50-100 ppm (50-100 ml/m³). Maintenance: 10-20 ppm (10-20 ml/m³) weekly. For Legionella control: 100-200 ppm for 24h, then maintain 20-30 ppm.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Inhibitors and Dispersants
      {
        name: 'Corrosion Inhibitor',
        type: 'Inhibitor',
        unit: 'L',
        supplier: 'IndChemical Inc.',
        currentStock: 120.00,
        minStockAlert: 25.00,
        description: 'Protects metal surfaces in water systems. Phosphate/molybdate base.',
        recommendedDosage: 'Cooling towers: 30-50 ppm (30-50 ml/m³) at initial startup. Maintenance: 10-20 ppm (10-20 ml/m³) according to blowdown. Closed systems: 200-500 ppm. Apply via continuous metering pump.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Scale Inhibitor',
        type: 'Anti-scalant',
        unit: 'L',
        supplier: 'AquaTreat Products',
        currentStock: 90.00,
        minStockAlert: 20.00,
        description: 'Prevents calcium carbonate and sulfate formation. For boilers and towers.',
        recommendedDosage: 'Cooling towers: 20-40 ppm (20-40 ml/m³) according to water hardness. Boilers: 50-100 ppm in feedwater. Adjust according to scale analysis. Continuous dosing via pump.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Polymeric Dispersant',
        type: 'Dispersant',
        unit: 'L',
        supplier: 'BioChemical Industrial',
        currentStock: 55.00,
        minStockAlert: 10.00,
        description: 'Keeps solids in suspension, prevents deposits. For cooling systems.',
        recommendedDosage: 'Cooling towers: 10-30 ppm (10-30 ml/m³) according to water turbidity. Add continuously with biocide. Adjust dosage according to suspended solids analysis.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Coagulants and Flocculants
      {
        name: 'Aluminum Sulfate',
        type: 'Coagulant',
        unit: 'kg',
        supplier: 'Alkali Mining',
        currentStock: 500.00,
        minStockAlert: 100.00,
        description: 'Primary coagulant for water treatment. Removes turbidity and color.',
        recommendedDosage: 'Water treatment: 10-50 mg/L (10-50 g/m³) according to turbidity. Prepare 10% solution and dose in rapid mix channel. Adjust pH to 6.5-7.5. Perform jar test for optimal dosage.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'PAC (Polyaluminum Chloride)',
        type: 'Coagulant',
        unit: 'L',
        supplier: 'IndChemical Inc.',
        currentStock: 300.00,
        minStockAlert: 60.00,
        description: 'High-efficiency liquid coagulant. Less sludge generation than sulfate.',
        recommendedDosage: 'Water treatment: 5-30 mg/L (5-30 ml/m³) according to turbidity. Use pure or diluted to 10%. Dose at clarifier inlet. Optimal pH: 6.0-8.0. Perform jar test. Reduces sludge by 30% vs sulfate.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Anionic Polymer',
        type: 'Flocculant',
        unit: 'kg',
        supplier: 'AquaTreat Products',
        currentStock: 50.00,
        minStockAlert: 10.00,
        description: 'Flocculation aid powder. Accelerates particle sedimentation.',
        recommendedDosage: 'Prepare 0.1-0.5% solution with slow agitation. Dose 0.1-1.0 mg/L (0.1-1.0 g/m³) after coagulant. Add in flocculation tank with gentle agitation. Maturation time: 30min.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cationic Polymer',
        type: 'Flocculant',
        unit: 'kg',
        supplier: 'AquaTreat Products',
        currentStock: 45.00,
        minStockAlert: 10.00,
        description: 'For sludge dewatering and effluent treatment.',
        recommendedDosage: 'Sludge dewatering: Prepare 0.5% solution. Dose 2-10 kg/ton dry sludge. Centrifuge: 3-6 kg/ton. Filter press: 5-10 kg/ton. Adjust by bench test.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Boiler Products
      {
        name: 'Oxygen Scavenger',
        type: 'Boiler Treatment',
        unit: 'L',
        supplier: 'IndChemical Inc.',
        currentStock: 80.00,
        minStockAlert: 20.00,
        description: 'Removes dissolved oxygen from boiler water. Prevents pitting corrosion.',
        recommendedDosage: 'Boiler feedwater: 10-20 ppm (10-20 ml/m³) for each 1 ppm O₂. Dose continuously in feed tank. Verify residual O₂ < 0.02 ppm. Sodium sulfite base.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Boiler Alkalizer',
        type: 'Boiler Treatment',
        unit: 'kg',
        supplier: 'BioChemical Industrial',
        currentStock: 100.00,
        minStockAlert: 25.00,
        description: 'Maintains adequate alkalinity in boiler water. Protects against acid corrosion.',
        recommendedDosage: 'Boiler water: Maintain alkalinity 200-400 ppm (low pressure) or 400-700 ppm (high pressure). Dose according to blowdown. Control pH 10.5-11.5. Use trisodium phosphate or caustic soda.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Auxiliary Products
      {
        name: 'Liquid Clarifier',
        type: 'Clarifier',
        unit: 'L',
        supplier: 'Pool Tech Brazil',
        currentStock: 60.00,
        minStockAlert: 15.00,
        description: 'Improves pool water clarity. Agglomerates fine particles.',
        recommendedDosage: 'Pools: 50-100 ml/10m³ when water is cloudy. Apply directly to pool with pump running. Maintain filtration for 24h. Backwash after. Do not use with granular flocculant.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chlorine Stabilizer (Cyanuric Acid)',
        type: 'Stabilizer',
        unit: 'kg',
        supplier: 'Pool Tech Brazil',
        currentStock: 40.00,
        minStockAlert: 10.00,
        description: 'Protects chlorine from UV degradation. For outdoor pools.',
        recommendedDosage: 'Outdoor pools: Maintain level 30-50 ppm. Initial dosage: 40-60 g/10m³. Dissolve in bucket and add to skimmer with pump running. Apply once/month. Do not use in indoor pools.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dechlorinator (Sodium Thiosulfate)',
        type: 'Neutralizer',
        unit: 'kg',
        supplier: 'Brazil Chemicals Ltd',
        currentStock: 30.00,
        minStockAlert: 5.00,
        description: 'Removes residual chlorine from water. Used before discharge or analysis.',
        recommendedDosage: 'Chlorine neutralization: 7 g for each 1 ppm chlorine in 1m³. Dissolve in water and add to system. Wait 15 min and test residual chlorine (should be < 0.1 ppm). For laboratory analysis.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Antifoam',
        type: 'Auxiliary',
        unit: 'L',
        supplier: 'AquaTreat Products',
        currentStock: 25.00,
        minStockAlert: 5.00,
        description: 'Eliminates foam in cooling towers and treatment plants.',
        recommendedDosage: 'Cooling towers: 10-50 ppm (10-50 ml/m³) according to foam severity. WWTP: 5-20 ppm. Add directly at foam point. Silicone or polyether base. Reapply as needed.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Granular Activated Carbon',
        type: 'Adsorbent',
        unit: 'kg',
        supplier: 'Alkali Mining',
        currentStock: 200.00,
        minStockAlert: 40.00,
        description: 'Removes chlorine, odors and organic compounds. For carbon filters.',
        recommendedDosage: 'Water filters: Bed height 0.8-1.2 m. Filtration rate 10-20 m³/m²/h. Replace when residual chlorine > 0.5 ppm at outlet. Weekly backwash. Lifetime: 12-24 months according to use.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Reset sequence to sync with inserted data (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"Products"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Products"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
