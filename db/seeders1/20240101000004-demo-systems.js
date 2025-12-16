'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert Systems
    await queryInterface.bulkInsert('Systems', [
      {
        parentId: null,
        name: 'Main Pool - Sunset Hotel',
        systemTypeId: 1,
        location: 'Recreation Area - Block A',
        description: 'Main hotel pool with 500,000 liter capacity. Recreational use.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Children\'s Pool - Sunset Hotel',
        systemTypeId: 1,
        location: 'Recreation Area - Block A',
        description: 'Children\'s pool with maximum depth of 60cm.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Cooling Tower - Unit 1',
        systemTypeId: 2,
        location: 'Industrial Area - Sector B',
        description: 'Main cooling tower for central air conditioning system.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Cooling Tower - Unit 2',
        systemTypeId: 2,
        location: 'Industrial Area - Sector B',
        description: 'Secondary backup cooling tower.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Steam Boiler - Main',
        systemTypeId: 3,
        location: 'Machine Room',
        description: 'Main boiler for industrial steam generation. Capacity: 10 ton/h.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'WTP - Water Treatment Plant',
        systemTypeId: 4,
        location: 'Utilities Area',
        description: 'Water treatment plant for industrial water supply.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'WWTP - Wastewater Treatment',
        systemTypeId: 5,
        location: 'Utilities Area - Rear',
        description: 'Industrial wastewater treatment plant before discharge.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: null,
        name: 'Effluent System - Line 1',
        systemTypeId: 6,
        location: 'Production Area',
        description: 'Collection and treatment system for production line 1 effluent.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Get inserted parent systems to retrieve their IDs
    const [parentSystems] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Systems" WHERE "parentId" IS NULL ORDER BY id;`
    );

    // Create lookup for parent systems by name
    const parentSystemMap = {};
    parentSystems.forEach(s => { parentSystemMap[s.name] = s.id; });

    // Insert Stages (child systems) for WWTP
    await queryInterface.bulkInsert('Systems', [
      {
        parentId: parentSystemMap['WWTP - Wastewater Treatment'],
        name: 'Pump Station',
        systemTypeId: 5,
        location: 'WWTP - Inlet',
        description: 'Pumping of wastewater to the treatment system.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WWTP - Wastewater Treatment'],
        name: 'Aeration Tank',
        systemTypeId: 5,
        location: 'WWTP - Biological',
        description: 'Aeration tank for aerobic biological treatment.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WWTP - Wastewater Treatment'],
        name: 'Secondary Clarifier',
        systemTypeId: 5,
        location: 'WWTP - Clarification',
        description: 'Clarifier for activated sludge separation.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WWTP - Wastewater Treatment'],
        name: 'Polishing Filter',
        systemTypeId: 5,
        location: 'WWTP - Final',
        description: 'Final filtration for treated effluent polishing.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WWTP - Wastewater Treatment'],
        name: 'Treated Effluent Tank',
        systemTypeId: 5,
        location: 'WWTP - Outlet',
        description: 'Treated effluent reservoir before discharge.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Stages for WTP
      {
        parentId: parentSystemMap['WTP - Water Treatment Plant'],
        name: 'Intake',
        systemTypeId: 4,
        location: 'WTP - Inlet',
        description: 'Raw water intake.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WTP - Water Treatment Plant'],
        name: 'Flocculator',
        systemTypeId: 4,
        location: 'WTP - Coagulation',
        description: 'Flocculation for particle agglomeration.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WTP - Water Treatment Plant'],
        name: 'Clarifier',
        systemTypeId: 4,
        location: 'WTP - Clarification',
        description: 'Sedimentation of flocculated particles.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WTP - Water Treatment Plant'],
        name: 'Filters',
        systemTypeId: 4,
        location: 'WTP - Filtration',
        description: 'Clarified water filtration.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: parentSystemMap['WTP - Water Treatment Plant'],
        name: 'Treated Water Reservoir',
        systemTypeId: 4,
        location: 'WTP - Outlet',
        description: 'Treated water storage.',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Get ALL systems (parent + child) for monitoring points and checklist items
    const [systems] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Systems" ORDER BY id;`
    );

    // Get parameter and unit IDs for creating monitoring points
    const [parameters] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Parameters";`
    );
    const [units] = await queryInterface.sequelize.query(
      `SELECT id, abbreviation FROM "Units";`
    );

    // Create lookup maps
    const systemMap = {};
    systems.forEach((s, index) => { systemMap[index + 1] = s.id; });

    // Create lookup by name for stages
    const systemByName = {};
    systems.forEach(s => { systemByName[s.name] = s.id; });

    const paramMap = {};
    parameters.forEach(p => { paramMap[p.name] = p.id; });

    const unitMap = {};
    units.forEach(u => { unitMap[u.abbreviation] = u.id; });

    // Insert Monitoring Points with foreign keys
    await queryInterface.bulkInsert('MonitoringPoints', [
      // Main Pool (System 1)
      { systemId: systemMap[1], name: 'Water pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Free Residual Chlorine', parameterId: paramMap['Chlorine'], unitId: unitMap['mg/L'], minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Temperature', parameterId: paramMap['Temperature'], unitId: unitMap['°C'], minValue: 24, maxValue: 30, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Turbidity', parameterId: paramMap['Turbidity'], unitId: unitMap['NTU'], minValue: 0, maxValue: 0.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Total Alkalinity', parameterId: paramMap['Alkalinity'], unitId: unitMap['mg/L'], minValue: 80, maxValue: 120, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // Children's Pool (System 2)
      { systemId: systemMap[2], name: 'Water pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.2, maxValue: 7.8, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Free Residual Chlorine', parameterId: paramMap['Chlorine'], unitId: unitMap['mg/L'], minValue: 1.0, maxValue: 3.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Temperature', parameterId: paramMap['Temperature'], unitId: unitMap['°C'], minValue: 26, maxValue: 32, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Cooling Tower 1 (System 3)
      { systemId: systemMap[3], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Conductivity', parameterId: paramMap['Conductivity'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Inlet Temperature', parameterId: paramMap['Temperature'], unitId: unitMap['°C'], minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Outlet Temperature', parameterId: paramMap['Temperature'], unitId: unitMap['°C'], minValue: 15, maxValue: 35, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Total Chlorine', parameterId: paramMap['Chlorine'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Concentration Cycles', parameterId: paramMap['Cycles'], unitId: unitMap[''], minValue: 3, maxValue: 6, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Cooling Tower 2 (System 4)
      { systemId: systemMap[4], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 7.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Conductivity', parameterId: paramMap['Conductivity'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 2500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Inlet Temperature', parameterId: paramMap['Temperature'], unitId: unitMap['°C'], minValue: 20, maxValue: 45, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Total Chlorine', parameterId: paramMap['Chlorine'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 1.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Boiler (System 5)
      { systemId: systemMap[5], name: 'Feedwater pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 8.5, maxValue: 9.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Conductivity', parameterId: paramMap['Conductivity'], unitId: unitMap['µS/cm'], minValue: 0, maxValue: 3500, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Total Hardness', parameterId: paramMap['Hardness'], unitId: unitMap['mg/L CaCO3'], minValue: 0, maxValue: 5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Silica', parameterId: paramMap['Silica'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 150, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Dissolved Oxygen', parameterId: paramMap['DO'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 0.007, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Total Iron', parameterId: paramMap['Iron'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 0.1, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Alkalinity', parameterId: paramMap['Alkalinity'], unitId: unitMap['mg/L'], minValue: 200, maxValue: 700, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },

      // WTP (System 6)
      { systemId: systemMap[6], name: 'Inlet pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Outlet pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.5, maxValue: 8.5, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Inlet Turbidity', parameterId: paramMap['Turbidity'], unitId: unitMap['NTU'], minValue: 0, maxValue: 100, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Outlet Turbidity', parameterId: paramMap['Turbidity'], unitId: unitMap['NTU'], minValue: 0, maxValue: 1.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Residual Chlorine', parameterId: paramMap['Chlorine'], unitId: unitMap['mg/L'], minValue: 0.5, maxValue: 2.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Apparent Color', parameterId: paramMap['Color'], unitId: unitMap['uH'], minValue: 0, maxValue: 15, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // WWTP (System 7)
      { systemId: systemMap[7], name: 'Inlet pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 5.0, maxValue: 9.0, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Outlet pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 5.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Inlet BOD', parameterId: paramMap['BOD'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 500, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Outlet BOD', parameterId: paramMap['BOD'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 60, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Outlet COD', parameterId: paramMap['COD'], unitId: unitMap['mg/L'], minValue: 0, maxValue: 150, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Settleable Solids', parameterId: paramMap['SS'], unitId: unitMap['mL/L'], minValue: 0, maxValue: 1.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Dissolved Oxygen', parameterId: paramMap['DO'], unitId: unitMap['mg/L'], minValue: 2.0, maxValue: 8.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },

      // Effluent Line 1 (System 8)
      { systemId: systemMap[8], name: 'pH', parameterId: paramMap['pH'], unitId: unitMap[''], minValue: 6.0, maxValue: 9.0, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Temperature', parameterId: paramMap['Temperature'], unitId: unitMap['°C'], minValue: 15, maxValue: 40, alertEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Flow Rate', parameterId: paramMap['Flow Rate'], unitId: unitMap['m³/h'], minValue: 0, maxValue: 50, alertEnabled: false, createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Insert Checklist Items
    await queryInterface.bulkInsert('ChecklistItems', [
      // Main Pool (System 1)
      { systemId: systemMap[1], name: 'Check water level', description: 'Verify water level is adequate', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Clean skimmers', description: 'Remove debris from skimmers', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Check circulation pump', description: 'Verify operation and abnormal noises', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Inspect filters', description: 'Check pressure and backwash needs', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Filter pressure', description: 'Record current pressure', isRequired: false, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[1], name: 'Check chemical feeders', description: 'Verify product levels and operation', isRequired: true, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // Children's Pool (System 2)
      { systemId: systemMap[2], name: 'Check water level', description: 'Verify water level is adequate', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Clean skimmers', description: 'Remove debris from skimmers', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Check temperature', description: 'Ensure appropriate temperature for children', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[2], name: 'Inspect surrounding area', description: 'Check area safety', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // Cooling Tower 1 (System 3)
      { systemId: systemMap[3], name: 'Check for leaks', description: 'Inspect entire structure for leaks', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Check basin level', description: 'Verify water level in basin', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Inspect fans', description: 'Check operation and noises', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Check fill media', description: 'Inspect fill media condition', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Check automatic blowdown', description: 'Verify blowdown system operation', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[3], name: 'Check biocide dosing', description: 'Verify dosing system', isRequired: true, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // Cooling Tower 2 (System 4)
      { systemId: systemMap[4], name: 'Check for leaks', description: 'Inspect entire structure for leaks', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Check basin level', description: 'Verify water level in basin', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Inspect fans', description: 'Check operation and noises', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[4], name: 'Check fill media', description: 'Inspect fill media condition', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // Boiler (System 5)
      { systemId: systemMap[5], name: 'Check water level', description: 'Check level gauges', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Test level alarms', description: 'Perform alarm testing', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Check operating pressure', description: 'Check pressure gauges', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Current pressure', description: 'Record operating pressure', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Inspect safety valves', description: 'Check valve condition', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Check bottom blowdown', description: 'Perform bottom blowdown if needed', isRequired: false, order: 6, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[5], name: 'Check treatment system', description: 'Verify softener and feeders', isRequired: true, order: 7, createdAt: new Date(), updatedAt: new Date() },

      // WTP (System 6)
      { systemId: systemMap[6], name: 'Check coagulation', description: 'Verify floc formation', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Inspect clarifiers', description: 'Check sludge accumulation', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Check filters', description: 'Verify backwash needs', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Check chlorine dosing', description: 'Verify chlorination system', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[6], name: 'Check reservoirs', description: 'Inspect level and conditions', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },

      // WWTP (System 7)
      { systemId: systemMap[7], name: 'Check inlet screen', description: 'Clean coarse solids', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Check grit chamber', description: 'Verify sand accumulation', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Inspect aerators', description: 'Check aerator operation', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Check secondary clarifier', description: 'Verify clarification', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Check sludge recirculation', description: 'Verify recirculation pump', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[7], name: 'Check sludge disposal', description: 'Verify drying bed', isRequired: false, order: 6, createdAt: new Date(), updatedAt: new Date() },

      // Effluent Line 1 (System 8)
      { systemId: systemMap[8], name: 'Check effluent pH', description: 'Measure pH before treatment', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Check temperature', description: 'Verify effluent temperature', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Inspect equalization tank', description: 'Check level and mixing', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemMap[8], name: 'Check dosing system', description: 'Verify metering pumps', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WWTP Stages - Pump Station
      { systemId: systemByName['Pump Station'], name: 'Check pumps', description: 'Verify submersible pump operation', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Pump Station'], name: 'Inspect screen', description: 'Check retention screen cleaning', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Pump Station'], name: 'Check wet well level', description: 'Verify effluent level in wet well', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Pump Station'], name: 'Check control panel', description: 'Verify alarms and panel operation', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WWTP Stages - Aeration Tank
      { systemId: systemByName['Aeration Tank'], name: 'Check aerators', description: 'Verify surface aerator operation', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Aeration Tank'], name: 'Measure dissolved oxygen', description: 'Check DO level in tank', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Aeration Tank'], name: 'Observe sludge characteristics', description: 'Check color, odor and foam formation', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Aeration Tank'], name: 'Check tank level', description: 'Verify operating level', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Aeration Tank'], name: 'Check mixing', description: 'Confirm activated sludge homogenization', isRequired: false, order: 5, createdAt: new Date(), updatedAt: new Date() },

      // WWTP Stages - Secondary Clarifier
      { systemId: systemByName['Secondary Clarifier'], name: 'Check clarification', description: 'Observe clarified effluent quality', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Secondary Clarifier'], name: 'Check sludge blanket', description: 'Verify sludge blanket height', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Secondary Clarifier'], name: 'Inspect scraper', description: 'Check bottom scraper operation', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Secondary Clarifier'], name: 'Check weir', description: 'Verify weir overflow', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Secondary Clarifier'], name: 'Check return pump', description: 'Verify sludge recirculation pump', isRequired: true, order: 5, createdAt: new Date(), updatedAt: new Date() },

      // WWTP Stages - Polishing Filter
      { systemId: systemByName['Polishing Filter'], name: 'Check differential pressure', description: 'Verify filter head loss', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Polishing Filter'], name: 'Inspect filter media', description: 'Check filter bed condition', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Polishing Filter'], name: 'Check filtrate quality', description: 'Assess filtered effluent turbidity', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Polishing Filter'], name: 'Check backwash need', description: 'Determine if backwash is needed', isRequired: false, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WWTP Stages - Treated Effluent Tank
      { systemId: systemByName['Treated Effluent Tank'], name: 'Check level', description: 'Verify reservoir level', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Treated Effluent Tank'], name: 'Inspect visual quality', description: 'Observe effluent color and turbidity', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Treated Effluent Tank'], name: 'Check disinfection system', description: 'Verify chlorine dosing or UV', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Treated Effluent Tank'], name: 'Check discharge point', description: 'Verify discharge point conditions', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WTP Stages - Intake
      { systemId: systemByName['Intake'], name: 'Check intake pumps', description: 'Verify pump operation', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Intake'], name: 'Inspect screens', description: 'Check screen cleaning', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Intake'], name: 'Check source level', description: 'Verify source conditions', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Intake'], name: 'Check intake flow', description: 'Record intake flow', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WTP Stages - Flocculator
      { systemId: systemByName['Flocculator'], name: 'Check coagulant dosing', description: 'Verify aluminum sulfate dosing', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Flocculator'], name: 'Observe floc formation', description: 'Assess quality of formed flocs', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Flocculator'], name: 'Check mixers', description: 'Verify mixer operation', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Flocculator'], name: 'Check coagulation pH', description: 'Verify optimal pH for coagulation', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WTP Stages - Clarifier
      { systemId: systemByName['Clarifier'], name: 'Check clarification', description: 'Observe clarified water quality', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Clarifier'], name: 'Inspect sludge accumulation', description: 'Check need for sludge disposal', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Clarifier'], name: 'Check weirs', description: 'Verify uniform distribution at weirs', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Clarifier'], name: 'Check scraper', description: 'Verify sludge scraper operation', isRequired: false, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WTP Stages - Filters
      { systemId: systemByName['Filters'], name: 'Check head loss', description: 'Verify filter differential pressure', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filters'], name: 'Assess filtrate quality', description: 'Measure filtered water turbidity', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filters'], name: 'Check backwash need', description: 'Determine backwash schedule', isRequired: true, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Filters'], name: 'Inspect filter media', description: 'Check sand and anthracite condition', isRequired: false, order: 4, createdAt: new Date(), updatedAt: new Date() },

      // WTP Stages - Treated Water Reservoir
      { systemId: systemByName['Treated Water Reservoir'], name: 'Check level', description: 'Verify reservoir level', isRequired: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Treated Water Reservoir'], name: 'Check residual chlorine', description: 'Measure free residual chlorine', isRequired: true, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Treated Water Reservoir'], name: 'Check fluoridation', description: 'Verify fluoride dosing if applicable', isRequired: false, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { systemId: systemByName['Treated Water Reservoir'], name: 'Inspect structure', description: 'Check physical condition of reservoir', isRequired: true, order: 4, createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ChecklistItems', null, {});
    await queryInterface.bulkDelete('MonitoringPoints', null, {});
    await queryInterface.bulkDelete('Systems', null, {});
  }
};
