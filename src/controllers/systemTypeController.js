const { SystemType, System } = require('../../db/models');

// Get all system types
exports.getAllSystemTypes = async (req, res) => {
  try {
    const systemTypes = await SystemType.findAll({
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: systemTypes
    });
  } catch (error) {
    console.error('Error fetching system types:', error);
    res.status(500).json({ success: false, message: 'Error fetching system types', error: error.message });
  }
};

// Get system type by ID
exports.getSystemTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const systemType = await SystemType.findByPk(id);

    if (!systemType) {
      return res.status(404).json({ success: false, message: 'System type not found' });
    }

    res.json({
      success: true,
      data: systemType
    });
  } catch (error) {
    console.error('Error fetching system type:', error);
    res.status(500).json({ success: false, message: 'Error fetching system type', error: error.message });
  }
};

// Create new system type
exports.createSystemType = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, message: 'System type name is required' });
    }

    // Check if system type with same name already exists
    const existingSystemType = await SystemType.findOne({ where: { name } });
    if (existingSystemType) {
      return res.status(400).json({ success: false, message: 'System type with this name already exists' });
    }

    // Create system type
    const systemType = await SystemType.create({
      name,
      description: description || null
    });

    res.status(201).json({
      success: true,
      data: systemType
    });
  } catch (error) {
    console.error('Error creating system type:', error);
    res.status(500).json({ success: false, message: 'Error creating system type', error: error.message });
  }
};

// Update system type
exports.updateSystemType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const systemType = await SystemType.findByPk(id);

    if (!systemType) {
      return res.status(404).json({ success: false, message: 'System type not found' });
    }

    // Check if system type with new name already exists
    if (name && name !== systemType.name) {
      const existingSystemType = await SystemType.findOne({ where: { name } });
      if (existingSystemType) {
        return res.status(400).json({ success: false, message: 'System type with this name already exists' });
      }
    }

    // Update system type
    if (name !== undefined) systemType.name = name;
    if (description !== undefined) systemType.description = description;

    await systemType.save();

    res.json({
      success: true,
      data: systemType
    });
  } catch (error) {
    console.error('Error updating system type:', error);
    res.status(500).json({ success: false, message: 'Error updating system type', error: error.message });
  }
};

// Delete system type
exports.deleteSystemType = async (req, res) => {
  try {
    const { id } = req.params;

    const systemType = await SystemType.findByPk(id);

    if (!systemType) {
      return res.status(404).json({ success: false, message: 'System type not found' });
    }

    // Check if system type is being used by any systems
    const usageCount = await System.count({ where: { systemTypeId: id } });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete system type. It is currently used by ${usageCount} system(s)`
      });
    }

    await systemType.destroy();

    res.json({
      success: true,
      message: 'System type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting system type:', error);
    res.status(500).json({ success: false, message: 'Error deleting system type', error: error.message });
  }
};
