'use strict';

/**
 * Migration to update existing report templates with new occurrences block options
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all report templates
    const templates = await queryInterface.sequelize.query(
      'SELECT id, config FROM "ReportTemplates"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const template of templates) {
      try {
        let config = typeof template.config === 'string'
          ? JSON.parse(template.config)
          : template.config;

        if (!config || !config.blocks) continue;

        let modified = false;

        // Update each block
        config.blocks = config.blocks.map(block => {
          // Update inspections block
          if (block.type === 'inspections') {
            if (block.showInspectionOverview === undefined) {
              block.showInspectionOverview = true;
              modified = true;
            }
            if (block.showInspectionDetailed === undefined) {
              block.showInspectionDetailed = false;
              modified = true;
            }
            if (block.highlightOnlyNonConformities === undefined) {
              block.highlightOnlyNonConformities = true;
              modified = true;
            }
          }

          // Update occurrences block
          if (block.type === 'occurrences') {
            if (block.showOccurrenceOverview === undefined) {
              block.showOccurrenceOverview = true;
              modified = true;
            }
            if (block.showOccurrenceDetailed === undefined) {
              block.showOccurrenceDetailed = false;
              modified = true;
            }
            if (block.showOnlyHighestCriticality === undefined) {
              block.showOnlyHighestCriticality = true;
              modified = true;
            }
            if (block.criticalityFilter === undefined) {
              block.criticalityFilter = 'all';
              modified = true;
            }
            if (block.includeComments === undefined) {
              block.includeComments = true;
              modified = true;
            }
            if (block.includePhotos === undefined) {
              block.includePhotos = true;
              modified = true;
            }
          }

          return block;
        });

        // Check if occurrences block exists, if not add it
        const hasOccurrences = config.blocks.some(b => b.type === 'occurrences');
        if (!hasOccurrences) {
          // Find the highest order number
          const maxOrder = Math.max(...config.blocks.map(b => b.order || 0));

          // Insert occurrences block before conclusion if it exists
          const conclusionIndex = config.blocks.findIndex(b => b.type === 'conclusion');
          const insertOrder = conclusionIndex >= 0
            ? config.blocks[conclusionIndex].order
            : maxOrder + 1;

          // Shift conclusion and later blocks
          config.blocks = config.blocks.map(b => {
            if (b.order >= insertOrder) {
              return { ...b, order: b.order + 1 };
            }
            return b;
          });

          // Add occurrences block
          config.blocks.push({
            type: 'occurrences',
            enabled: true,
            order: insertOrder,
            includeTimeline: true,
            includePhotos: true,
            includeComments: true,
            showOccurrenceOverview: true,
            showOccurrenceDetailed: false,
            showOnlyHighestCriticality: true,
            criticalityFilter: 'all'
          });

          // Sort blocks by order
          config.blocks.sort((a, b) => a.order - b.order);
          modified = true;
        }

        if (modified) {
          await queryInterface.sequelize.query(
            'UPDATE "ReportTemplates" SET config = :config, "updatedAt" = NOW() WHERE id = :id',
            {
              replacements: {
                id: template.id,
                config: JSON.stringify(config)
              }
            }
          );
        }
      } catch (error) {
        console.error(`Error updating template ${template.id}:`, error.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is not reversible as we don't know the original state
    console.log('This migration cannot be reverted automatically');
  }
};
