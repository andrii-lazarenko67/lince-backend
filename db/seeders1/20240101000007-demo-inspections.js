'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const today = new Date();
    const getDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
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

    // Create user lookup by email
    const userMap = {};
    users.forEach(user => {
      if (user.email === 'technician@lince.com') userMap.peter = user.id; // Peter - userId 3
      else if (user.email === 'mary.brown@lince.com') userMap.mary = user.id; // Mary - userId 4
      else if (user.email === 'john.davis@lince.com') userMap.john = user.id; // John - userId 5
    });

    // Create system lookup by name
    const systemMap = {};
    systems.forEach(system => {
      if (system.name === 'Main Pool - Sunset Hotel') systemMap.pool = system.id; // systemId 1
      else if (system.name === 'Cooling Tower - Unit 1') systemMap.tower = system.id; // systemId 3
      else if (system.name === 'Steam Boiler - Main') systemMap.boiler = system.id; // systemId 5
      else if (system.name === 'WTP - Water Treatment Plant') systemMap.wtp = system.id; // systemId 6
      else if (system.name === 'WWTP - Wastewater Treatment') systemMap.wwtp = system.id; // systemId 7
    });

    // Create inspections
    const inspections = [
      // System 1: Main Pool - weekly inspections
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.peter,
        date: getDate(56),
        status: 'completed',
        conclusion: 'Weekly inspection completed. System in perfect condition. Filters clean.',
        managerNotes: 'Approved. Continue regular monitoring.',
        createdAt: getDate(56),
        updatedAt: getDate(56)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.mary,
        date: getDate(49),
        status: 'completed',
        conclusion: 'All equipment checked. Chlorine metering pump requires calibration adjustment.',
        managerNotes: 'Request preventive maintenance.',
        createdAt: getDate(49),
        updatedAt: getDate(49)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.john,
        date: getDate(42),
        status: 'completed',
        conclusion: 'Complete inspection. Preventive cleaning of pre-filters performed.',
        managerNotes: null,
        createdAt: getDate(42),
        updatedAt: getDate(42)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.peter,
        date: getDate(35),
        status: 'approved',
        conclusion: 'Monthly safety inspection. All emergency equipment verified.',
        managerNotes: 'Excellent work. Equipment in compliance.',
        createdAt: getDate(35),
        updatedAt: getDate(35)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.mary,
        date: getDate(28),
        status: 'completed',
        conclusion: 'Weekly inspection. System operating normally.',
        managerNotes: null,
        createdAt: getDate(28),
        updatedAt: getDate(28)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.john,
        date: getDate(21),
        status: 'completed',
        conclusion: 'Complete verification. Replaced circulation pump o-ring.',
        managerNotes: 'Record replaced part in inventory.',
        createdAt: getDate(21),
        updatedAt: getDate(21)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.peter,
        date: getDate(14),
        status: 'completed',
        conclusion: 'System in excellent condition. Crystal clear water.',
        managerNotes: null,
        createdAt: getDate(14),
        updatedAt: getDate(14)
      },
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.mary,
        date: getDate(7),
        status: 'completed',
        conclusion: 'Last weekly inspection. All parameters compliant.',
        managerNotes: null,
        createdAt: getDate(7),
        updatedAt: getDate(7)
      },

      // System 3: Cooling Tower 1 - inspections with issues
      {
        systemId: systemMap.tower,
        stageId: null,
        userId: userMap.peter,
        date: getDate(45),
        status: 'completed',
        conclusion: 'Routine inspection. Light scale detected on heat exchange plates.',
        managerNotes: 'Schedule chemical cleaning for next week.',
        createdAt: getDate(45),
        updatedAt: getDate(45)
      },
      {
        systemId: systemMap.tower,
        stageId: null,
        userId: userMap.john,
        date: getDate(38),
        status: 'completed',
        conclusion: 'Corrective inspection after problem detection. Chemical cleaning of plates performed.',
        managerNotes: 'Problem successfully corrected.',
        createdAt: getDate(38),
        updatedAt: getDate(38)
      },
      {
        systemId: systemMap.tower,
        stageId: null,
        userId: userMap.peter,
        date: getDate(30),
        status: 'approved',
        conclusion: 'Post-cleaning verification. Heat exchange efficiency restored.',
        managerNotes: 'Excellent system recovery.',
        createdAt: getDate(30),
        updatedAt: getDate(30)
      },
      {
        systemId: systemMap.tower,
        stageId: null,
        userId: userMap.mary,
        date: getDate(15),
        status: 'completed',
        conclusion: 'Biweekly inspection. System operating in optimal conditions.',
        managerNotes: null,
        createdAt: getDate(15),
        updatedAt: getDate(15)
      },
      {
        systemId: systemMap.tower,
        stageId: null,
        userId: userMap.john,
        date: getDate(5),
        status: 'completed',
        conclusion: 'Emergency inspection after bacterial count alarm. Shock biocide applied.',
        managerNotes: 'Monitor microbiological analysis results.',
        createdAt: getDate(5),
        updatedAt: getDate(4)
      },

      // System 5: Boiler
      {
        systemId: systemMap.boiler,
        stageId: null,
        userId: userMap.john,
        date: getDate(50),
        status: 'approved',
        conclusion: 'Monthly boiler inspection. Safety valves and instrumentation verified.',
        managerNotes: 'All safety items in compliance.',
        createdAt: getDate(50),
        updatedAt: getDate(50)
      },
      {
        systemId: systemMap.boiler,
        stageId: null,
        userId: userMap.peter,
        date: getDate(20),
        status: 'approved',
        conclusion: 'Safety inspection. All relief valves tested. Compliant.',
        managerNotes: 'Approved without reservations.',
        createdAt: getDate(20),
        updatedAt: getDate(20)
      },

      // System 6: WTP
      {
        systemId: systemMap.wtp,
        stageId: null,
        userId: userMap.peter,
        date: getDate(40),
        status: 'completed',
        conclusion: 'WTP weekly inspection. Flocculators operating well. Clarifiers clean.',
        managerNotes: null,
        createdAt: getDate(40),
        updatedAt: getDate(40)
      },
      {
        systemId: systemMap.wtp,
        stageId: null,
        userId: userMap.mary,
        date: getDate(25),
        status: 'completed',
        conclusion: 'Filter verification. Scheduled backwash performed.',
        managerNotes: null,
        createdAt: getDate(25),
        updatedAt: getDate(25)
      },
      {
        systemId: systemMap.wtp,
        stageId: null,
        userId: userMap.john,
        date: getDate(10),
        status: 'approved',
        conclusion: 'Monthly regulatory inspection. All parameters within regulation limits.',
        managerNotes: 'Documentation filed for inspection.',
        createdAt: getDate(10),
        updatedAt: getDate(10)
      },

      // System 7: WWTP
      {
        systemId: systemMap.wwtp,
        stageId: null,
        userId: userMap.mary,
        date: getDate(35),
        status: 'completed',
        conclusion: 'Biological system inspection. Activated sludge with good settling.',
        managerNotes: null,
        createdAt: getDate(35),
        updatedAt: getDate(35)
      },
      {
        systemId: systemMap.wwtp,
        stageId: null,
        userId: userMap.peter,
        date: getDate(18),
        status: 'completed',
        conclusion: 'Aerator verification. Aeration system functioning properly.',
        managerNotes: null,
        createdAt: getDate(18),
        updatedAt: getDate(18)
      },
      {
        systemId: systemMap.wwtp,
        stageId: null,
        userId: userMap.john,
        date: getDate(3),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: getDate(3),
        updatedAt: getDate(3)
      },

      // Pending/Scheduled inspections
      {
        systemId: systemMap.pool,
        stageId: null,
        userId: userMap.peter,
        date: getDate(-2),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        systemId: systemMap.tower,
        stageId: null,
        userId: userMap.mary,
        date: getDate(-5),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        systemId: systemMap.boiler,
        stageId: null,
        userId: userMap.john,
        date: getDate(-10),
        status: 'pending',
        conclusion: null,
        managerNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Inspections', inspections, {});

    // Get inserted inspections and checklist items
    const insertedInspections = await queryInterface.sequelize.query(
      'SELECT id, "systemId", status FROM "Inspections" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const checklistItems = await queryInterface.sequelize.query(
      'SELECT id, "systemId" FROM "ChecklistItems" ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create inspection items for completed inspections
    const inspectionItems = [];

    for (const inspection of insertedInspections) {
      if (inspection.status === 'completed' || inspection.status === 'approved') {
        const systemChecklistItems = checklistItems.filter(ci => ci.systemId === inspection.systemId);

        for (const item of systemChecklistItems) {
          const random = Math.random();
          let status;
          if (random > 0.2) {
            status = 'C'; // Conformant
          } else if (random > 0.1) {
            status = 'NC'; // Non-Conformant
          } else if (random > 0.05) {
            status = 'NA'; // Not Applicable
          } else {
            status = 'NV'; // Not Verified
          }

          inspectionItems.push({
            inspectionId: inspection.id,
            checklistItemId: item.id,
            status: status,
            comment: status === 'NC' ? 'Item requires attention. Corrective action scheduled.' : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (inspectionItems.length > 0) {
      await queryInterface.bulkInsert('InspectionItems', inspectionItems, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('InspectionItems', null, {});
    await queryInterface.bulkDelete('Inspections', null, {});
  }
};
