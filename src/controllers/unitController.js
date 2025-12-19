const { Unit, User } = require('../../db/models');

// Get all units
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['isSystemDefault', 'DESC'], ['category', 'ASC'], ['name', 'ASC']]
    });

    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ messageKey: 'units.errors.fetchError', error: error.message });
  }
};

// Get unit by ID
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!unit) {
      return res.status(404).json({ messageKey: 'units.errors.notFound' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ messageKey: 'units.errors.fetchError', error: error.message });
  }
};

// Get units by category
exports.getUnitsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const units = await Unit.findAll({
      where: { category },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['isSystemDefault', 'DESC'], ['name', 'ASC']]
    });

    res.json(units);
  } catch (error) {
    console.error('Error fetching units by category:', error);
    res.status(500).json({ messageKey: 'units.errors.fetchError', error: error.message });
  }
};

// Create new unit
exports.createUnit = async (req, res) => {
  try {
    const { name, abbreviation, category } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !abbreviation) {
      return res.status(400).json({ messageKey: 'units.errors.nameAndAbbrevRequired' });
    }

    // Check if unit with same abbreviation already exists
    const existingUnit = await Unit.findOne({ where: { abbreviation } });
    if (existingUnit) {
      return res.status(400).json({ messageKey: 'units.errors.abbreviationExists' });
    }

    // Create unit
    const unit = await Unit.create({
      name,
      abbreviation,
      category: category || null,
      createdBy: userId,
      isSystemDefault: false
    });

    // Fetch with associations
    const createdUnit = await Unit.findByPk(unit.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(createdUnit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ messageKey: 'units.errors.createError', error: error.message });
  }
};

// Update unit
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation, category } = req.body;

    const unit = await Unit.findByPk(id);

    if (!unit) {
      return res.status(404).json({ messageKey: 'units.errors.notFound' });
    }

    // Check if trying to update system default
    if (unit.isSystemDefault) {
      return res.status(403).json({ messageKey: 'units.errors.cannotModifyDefault' });
    }

    // Check if unit with new abbreviation already exists
    if (abbreviation && abbreviation !== unit.abbreviation) {
      const existingUnit = await Unit.findOne({ where: { abbreviation } });
      if (existingUnit) {
        return res.status(400).json({ messageKey: 'units.errors.abbreviationExists' });
      }
    }

    // Update unit
    if (name !== undefined) unit.name = name;
    if (abbreviation !== undefined) unit.abbreviation = abbreviation;
    if (category !== undefined) unit.category = category;

    await unit.save();

    // Fetch with associations
    const updatedUnit = await Unit.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedUnit);
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ messageKey: 'units.errors.updateError', error: error.message });
  }
};

// Delete unit
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id);

    if (!unit) {
      return res.status(404).json({ messageKey: 'units.errors.notFound' });
    }

    // Check if trying to delete system default
    if (unit.isSystemDefault) {
      return res.status(403).json({ messageKey: 'units.errors.cannotDeleteDefault' });
    }

    // Check if unit is being used by any monitoring points
    const { MonitoringPoint } = require('../../db/models');
    const usageCount = await MonitoringPoint.count({ where: { unitId: id } });

    if (usageCount > 0) {
      return res.status(400).json({
        messageKey: 'units.errors.inUse',
        messageParams: { count: usageCount }
      });
    }

    await unit.destroy();

    res.json({ messageKey: 'units.success.deleted' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ messageKey: 'units.errors.deleteError', error: error.message });
  }
};
