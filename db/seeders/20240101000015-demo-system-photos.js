'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get all parent systems to add photos
    const [systems] = await queryInterface.sequelize.query(
      `SELECT id, name, "clientId" FROM "Systems" WHERE "parentId" IS NULL ORDER BY id;`
    );

    // Create photos for each parent system using placeholder images
    const photos = [];

    systems.forEach((system, index) => {
      // Add 1-2 photos per system using picsum.photos placeholder service
      const photoCount = (index % 2) + 1; // Alternates between 1 and 2 photos

      for (let i = 0; i < photoCount; i++) {
        const seed = system.id * 10 + i; // Unique seed for consistent images
        photos.push({
          systemId: system.id,
          filename: `system-${system.id}-photo-${i + 1}.jpg`,
          originalName: `${system.name.replace(/[^a-zA-Z0-9]/g, '_')}_foto_${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          fileSize: 150000 + (seed * 1000), // Simulated file size
          url: `https://picsum.photos/seed/${seed}/800/600`,
          description: i === 0
            ? `Vista geral do sistema ${system.name}`
            : `Detalhe do equipamento - ${system.name}`,
          uploadedBy: 1, // Admin user
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    if (photos.length > 0) {
      await queryInterface.bulkInsert('SystemPhotos', photos, {});
    }

    // Reset sequence
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"SystemPhotos"', 'id'),
        COALESCE((SELECT MAX(id) FROM "SystemPhotos"), 0),
        true
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SystemPhotos', null, {});
  }
};
