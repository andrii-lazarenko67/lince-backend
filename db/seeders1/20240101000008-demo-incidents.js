'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo, hours = 12) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hours, Math.floor(Math.random() * 60), 0, 0);
      return date;
    };

    // Fetch actual inserted user and system IDs
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM "Users" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const systems = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Systems" WHERE "parentId" IS NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get stages (child systems) for stageId references
    const stages = await queryInterface.sequelize.query(
      'SELECT id, name, "parentId" FROM "Systems" WHERE "parentId" IS NOT NULL ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create user lookup by email
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'manager@lince.com') userMap.manager = user.id;
      else if (user.email === 'anna.johnson@lince.com') userMap.anna = user.id;
      else if (user.email === 'technician@lince.com') userMap.peter = user.id;
      else if (user.email === 'mary.brown@lince.com') userMap.mary = user.id;
      else if (user.email === 'john.davis@lince.com') userMap.john = user.id;
    });

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name === 'Main Pool - Sunset Hotel') systemMap.pool = system.id;
      else if (system.name === 'Children\'s Pool - Sunset Hotel') systemMap.childpool = system.id;
      else if (system.name === 'Cooling Tower - Unit 1') systemMap.tower1 = system.id;
      else if (system.name === 'Cooling Tower - Unit 2') systemMap.tower2 = system.id;
      else if (system.name === 'Steam Boiler - Main') systemMap.boiler = system.id;
      else if (system.name === 'WTP - Water Treatment Plant') systemMap.wtp = system.id;
      else if (system.name === 'WWTP - Wastewater Treatment') systemMap.wwtp = system.id;
    });

    // Create stage lookup by name
    const stageMap = {};
    stages.forEach(stage => {
      if (stage.name === 'Aeration Tank') stageMap.aerationTank = stage.id;
      else if (stage.name === 'Secondary Clarifier') stageMap.secondaryClarifier = stage.id;
      else if (stage.name === 'Polishing Filter') stageMap.polishingFilter = stage.id;
      else if (stage.name === 'Flocculator') stageMap.flocculator = stage.id;
      else if (stage.name === 'Filters') stageMap.filters = stage.id;
    });

    const incidents = [
      // Incident 1: Resolved - Chlorine pump failure
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.peter,
        title: 'Chlorine metering pump failure',
        description: 'Chlorine metering pump stopped working during normal operation. Detected by drop in residual chlorine levels. Possible diaphragm failure.',
        priority: 'high',
        status: 'resolved',
        assignedTo: userMap.john,
        resolvedAt: getDate(24, 14),
        resolution: 'Replaced metering pump diaphragm. Performed calibration and operation test. System normalized.',
        createdAt: getDate(25, 9),
        updatedAt: getDate(24, 14)
      },
      // Incident 2: Resolved - pH out of range
      {
        systemId: systemMap.childpool,
        stageId: null,
        userId: userMap.mary,
        title: 'Children\'s pool pH out of range',
        description: 'pH measured at 8.2, above maximum limit of 7.8. Possible cause: excessive soda ash dosage the day before.',
        priority: 'medium',
        status: 'resolved',
        assignedTo: userMap.peter,
        resolvedAt: getDate(20, 11),
        resolution: 'Applied hydrochloric acid for pH correction. Value normalized to 7.4. Adjusted automatic dosing.',
        createdAt: getDate(20, 8),
        updatedAt: getDate(20, 11)
      },
      // Incident 3: Resolved - Legionella alert
      {
        systemId: systemMap.tower1,
        stageId: null,
        userId: userMap.john,
        title: 'Legionella alert in cooling tower',
        description: 'Legionella pneumophila count above 1000 CFU/L detected in monthly analysis. Requires immediate treatment per safety protocol.',
        priority: 'critical',
        status: 'resolved',
        assignedTo: userMap.mary,
        resolvedAt: getDate(3, 16),
        resolution: 'Performed shock treatment with oxidizing biocide. Increased system blowdown. Cleaned trays. New analysis confirmed levels below 100 CFU/L.',
        createdAt: getDate(5, 10),
        updatedAt: getDate(3, 16)
      },
      // Incident 4: In Progress - Scale buildup
      {
        systemId: systemMap.tower2,
        stageId: null,
        userId: userMap.peter,
        title: 'Scale detected in piping',
        description: 'Calcium carbonate scale detected in tower 2 distribution piping. Temperature delta increasing.',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: userMap.john,
        resolvedAt: null,
        resolution: null,
        createdAt: getDate(2, 14),
        updatedAt: getDate(1, 9)
      },
      // Incident 5: Resolved - Boiler water quality
      {
        systemId: systemMap.boiler,
        stageId: null,
        userId: userMap.john,
        title: 'Elevated hardness in boiler feedwater',
        description: 'Total hardness measured at 15 mg/L CaCO3 in feedwater, above limit of 5 mg/L. Softener may have regeneration problem.',
        priority: 'high',
        status: 'resolved',
        assignedTo: userMap.peter,
        resolvedAt: getDate(11, 15),
        resolution: 'Identified problem with softener regeneration timer. Replaced timer and performed manual regeneration. Hardness normalized to 0.5 mg/L.',
        createdAt: getDate(12, 7),
        updatedAt: getDate(11, 15)
      },
      // Incident 6: Resolved - WTP turbidity (with stage: Flocculator)
      {
        systemId: systemMap.wtp,
        stageId: stageMap.flocculator,
        userId: userMap.peter,
        title: 'Elevated raw water turbidity',
        description: 'Raw water turbidity reached 150 NTU due to heavy rainfall in region. Treatment process adjustment needed in flocculator.',
        priority: 'medium',
        status: 'resolved',
        assignedTo: userMap.mary,
        resolvedAt: getDate(19, 18),
        resolution: 'Increased coagulant dosage from 25 to 40 mg/L. Added auxiliary polymer. Treated water turbidity maintained at 0.5 NTU.',
        createdAt: getDate(20, 6),
        updatedAt: getDate(19, 18)
      },
      // Incident 7: Open - WWTP odor (with stage: Aeration Tank)
      {
        systemId: systemMap.wwtp,
        stageId: stageMap.aerationTank,
        userId: userMap.mary,
        title: 'Characteristic odor in aeration tank',
        description: 'Sulfide odor detected in aeration tank. Possible oxygenation problem or high organic load effluent input.',
        priority: 'low',
        status: 'open',
        assignedTo: null,
        resolvedAt: null,
        resolution: null,
        createdAt: getDate(1, 15),
        updatedAt: getDate(1, 15)
      },
      // Incident 8: Resolved - Pool filter issue
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.john,
        title: 'High pressure in sand filter',
        description: 'Filter pressure gauge indicating 2.5 bar, above limit of 2.0 bar. Backwash needed or possible blockage.',
        priority: 'low',
        status: 'resolved',
        assignedTo: userMap.john,
        resolvedAt: getDate(15, 12),
        resolution: 'Performed filter backwash for 5 minutes. Pressure normalized to 1.2 bar. Scheduled sand replacement for next maintenance.',
        createdAt: getDate(15, 10),
        updatedAt: getDate(15, 12)
      },
      // Incident 9: In Progress - Cooling tower fan
      {
        systemId: systemMap.tower1,
        stageId: null,
        userId: userMap.peter,
        title: 'Excessive fan vibration',
        description: 'Abnormal vibration detected in cooling tower 1 fan. Possible blade imbalance or bearing problem.',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: userMap.mary,
        resolvedAt: null,
        resolution: null,
        createdAt: getDate(3, 8),
        updatedAt: getDate(2, 10)
      },
      // Incident 10: Resolved - Chemical spill (with stage: Filters)
      {
        systemId: systemMap.wtp,
        stageId: stageMap.filters,
        userId: userMap.mary,
        title: 'Acid leak in dosing system',
        description: 'Small leak detected in acid pump suction hose near filters. Approximately 2L spilled in containment basin.',
        priority: 'high',
        status: 'resolved',
        assignedTo: userMap.peter,
        resolvedAt: getDate(8, 13),
        resolution: 'Leak contained in containment basin. Hose replaced. Area neutralized with soda ash and washed. No environmental damage.',
        createdAt: getDate(8, 11),
        updatedAt: getDate(8, 13)
      }
    ];

    await queryInterface.bulkInsert('Incidents', incidents, {});

    // Get inserted incidents
    const insertedIncidents = await queryInterface.sequelize.query(
      'SELECT id, title, status FROM "Incidents" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create incident comments
    const incidentComments = [
      // Comments for Incident 1 (Chlorine pump)
      {
        incidentId: insertedIncidents[0].id,
        userId: userMap.peter,
        content: 'Pump stopped at 9am. Chlorine levels dropped from 2.0 to 0.8 mg/L in 2 hours. Manual dosing initiated.',
        createdAt: getDate(25, 9),
        updatedAt: getDate(25, 9)
      },
      {
        incidentId: insertedIncidents[0].id,
        userId: userMap.manager,
        content: 'Authorized emergency repair kit purchase. Supplier confirmed delivery for tomorrow.',
        createdAt: getDate(25, 11),
        updatedAt: getDate(25, 11)
      },
      {
        incidentId: insertedIncidents[0].id,
        userId: userMap.john,
        content: 'Parts received. Beginning diaphragm and valve replacement.',
        createdAt: getDate(24, 10),
        updatedAt: getDate(24, 10)
      },
      {
        incidentId: insertedIncidents[0].id,
        userId: userMap.john,
        content: 'Repair completed. Pump operating normally. Chlorine stabilized at 1.8 mg/L.',
        createdAt: getDate(24, 14),
        updatedAt: getDate(24, 14)
      },

      // Comments for Incident 3 (Legionella)
      {
        incidentId: insertedIncidents[2].id,
        userId: userMap.john,
        content: 'URGENT: Lab result indicates 1,200 CFU/L Legionella. Emergency protocol activated.',
        createdAt: getDate(5, 10),
        updatedAt: getDate(5, 10)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: userMap.manager,
        content: 'Tower isolated from air conditioning system as precaution. Maintenance team notified.',
        createdAt: getDate(5, 11),
        updatedAt: getDate(5, 11)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: userMap.mary,
        content: 'Shock treatment initiated with 50 ppm free chlorine. Partial drainage performed.',
        createdAt: getDate(5, 14),
        updatedAt: getDate(5, 14)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: userMap.mary,
        content: 'Day two of treatment. Chlorine maintained at 20 ppm. Tray cleaning in progress.',
        createdAt: getDate(4, 10),
        updatedAt: getDate(4, 10)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: userMap.mary,
        content: 'Sample collected for new analysis. Result expected tomorrow.',
        createdAt: getDate(4, 15),
        updatedAt: getDate(4, 15)
      },
      {
        incidentId: insertedIncidents[2].id,
        userId: userMap.manager,
        content: 'New analysis result: 85 CFU/L. Below action limit. Treatment successful.',
        createdAt: getDate(3, 16),
        updatedAt: getDate(3, 16)
      },

      // Comments for Incident 4 (Scale - in progress)
      {
        incidentId: insertedIncidents[3].id,
        userId: userMap.peter,
        content: 'Scale visible on visual inspection. Delta T rose from 8°C to 12°C.',
        createdAt: getDate(2, 14),
        updatedAt: getDate(2, 14)
      },
      {
        incidentId: insertedIncidents[3].id,
        userId: userMap.john,
        content: 'Chemical cleaning scheduled for next weekend. Requires 8h system shutdown.',
        createdAt: getDate(1, 9),
        updatedAt: getDate(1, 9)
      },

      // Comments for Incident 5 (Boiler hardness)
      {
        incidentId: insertedIncidents[4].id,
        userId: userMap.john,
        content: 'Hardness test confirmed 15 mg/L. Softener appears not to be regenerating correctly.',
        createdAt: getDate(12, 8),
        updatedAt: getDate(12, 8)
      },
      {
        incidentId: insertedIncidents[4].id,
        userId: userMap.peter,
        content: 'Checked regeneration timer. Display not lighting. Possible electronic failure.',
        createdAt: getDate(12, 14),
        updatedAt: getDate(12, 14)
      },
      {
        incidentId: insertedIncidents[4].id,
        userId: userMap.peter,
        content: 'Timer replaced. Manual regeneration performed. Awaiting stabilization.',
        createdAt: getDate(11, 10),
        updatedAt: getDate(11, 10)
      },
      {
        incidentId: insertedIncidents[4].id,
        userId: userMap.peter,
        content: 'Hardness at softener outlet: 0.5 mg/L. Problem resolved.',
        createdAt: getDate(11, 15),
        updatedAt: getDate(11, 15)
      },

      // Comments for Incident 7 (WWTP odor - open)
      {
        incidentId: insertedIncidents[6].id,
        userId: userMap.mary,
        content: 'Odor detected during routine inspection. Dissolved oxygen measured: 1.5 mg/L (low).',
        createdAt: getDate(1, 15),
        updatedAt: getDate(1, 15)
      },

      // Comments for Incident 9 (Fan vibration - in progress)
      {
        incidentId: insertedIncidents[8].id,
        userId: userMap.peter,
        content: 'Vibration measured with accelerometer: 8 mm/s. Limit is 4.5 mm/s. Needs investigation.',
        createdAt: getDate(3, 8),
        updatedAt: getDate(3, 8)
      },
      {
        incidentId: insertedIncidents[8].id,
        userId: userMap.mary,
        content: 'Visual inspection of blades revealed no damage. Suspect bearings. Quote requested.',
        createdAt: getDate(2, 10),
        updatedAt: getDate(2, 10)
      },

      // Comments for Incident 10 (Chemical spill)
      {
        incidentId: insertedIncidents[9].id,
        userId: userMap.mary,
        content: 'Leak identified at hose connection. Area immediately isolated.',
        createdAt: getDate(8, 11),
        updatedAt: getDate(8, 11)
      },
      {
        incidentId: insertedIncidents[9].id,
        userId: userMap.peter,
        content: 'Hose replaced and connections redone. Area neutralized and cleaned.',
        createdAt: getDate(8, 13),
        updatedAt: getDate(8, 13)
      }
    ];

    await queryInterface.bulkInsert('IncidentComments', incidentComments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('IncidentComments', null, {});
    await queryInterface.bulkDelete('Incidents', null, {});
  }
};
