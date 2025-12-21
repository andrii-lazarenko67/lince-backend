const { ProductDosage, Product, System, Unit, User } = require('../../db/models');

// Get all product dosages with filters
exports.getAllProductDosages = async (req, res) => {
  try {
    const { productId, systemId, startDate, endDate } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (systemId) where.systemId = systemId;

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.$gte = new Date(startDate);
      if (endDate) where.recordedAt.$lte = new Date(endDate);
    }

    const dosages = await ProductDosage.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'typeId']
        },
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'abbreviation']
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['recordedAt', 'DESC']]
    });

    res.json(dosages);
  } catch (error) {
    console.error('Error fetching product dosages:', error);
    res.status(500).json({ messageKey: 'productDosages.errors.fetchError', error: error.message });
  }
};

// Get product dosage by ID
exports.getProductDosageById = async (req, res) => {
  try {
    const { id } = req.params;

    const dosage = await ProductDosage.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'typeId']
        },
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'abbreviation']
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!dosage) {
      return res.status(404).json({ messageKey: 'productDosages.errors.notFound' });
    }

    res.json(dosage);
  } catch (error) {
    console.error('Error fetching product dosage:', error);
    res.status(500).json({ messageKey: 'productDosages.errors.fetchError', error: error.message });
  }
};

// Get dosages by product ID
exports.getDosagesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { productId };

    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.$gte = new Date(startDate);
      if (endDate) where.recordedAt.$lte = new Date(endDate);
    }

    const dosages = await ProductDosage.findAll({
      where,
      include: [
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'abbreviation']
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['recordedAt', 'DESC']]
    });

    res.json(dosages);
  } catch (error) {
    console.error('Error fetching product dosages:', error);
    res.status(500).json({ messageKey: 'productDosages.errors.fetchError', error: error.message });
  }
};

// Create new product dosage
exports.createProductDosage = async (req, res) => {
  try {
    const { productId, systemId, value, unitId, dosageMode, frequency, notes, recordedAt } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!productId || value === undefined || !unitId || !dosageMode) {
      return res.status(400).json({
        messageKey: 'productDosages.errors.requiredFields'
      });
    }

    // Validate dosageMode enum
    if (!['manual', 'automatic'].includes(dosageMode)) {
      return res.status(400).json({
        messageKey: 'productDosages.errors.invalidDosageMode'
      });
    }

    // Verify product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ messageKey: 'products.errors.notFound' });
    }

    // Verify unit exists
    const unit = await Unit.findByPk(unitId);
    if (!unit) {
      return res.status(404).json({ messageKey: 'units.errors.notFound' });
    }

    // Verify system exists if provided
    if (systemId) {
      const system = await System.findByPk(systemId);
      if (!system) {
        return res.status(404).json({ messageKey: 'systems.errors.notFound' });
      }
    }

    // Create dosage
    const dosage = await ProductDosage.create({
      productId,
      systemId: systemId || null,
      value,
      unitId,
      dosageMode,
      frequency: frequency || null,
      notes: notes || null,
      recordedBy: userId,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date()
    });

    // Fetch with associations
    const createdDosage = await ProductDosage.findByPk(dosage.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'typeId']
        },
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'abbreviation']
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(createdDosage);
  } catch (error) {
    console.error('Error creating product dosage:', error);
    res.status(500).json({ messageKey: 'productDosages.errors.createError', error: error.message });
  }
};

// Update product dosage
exports.updateProductDosage = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, systemId, value, unitId, dosageMode, frequency, notes, recordedAt } = req.body;

    const dosage = await ProductDosage.findByPk(id);

    if (!dosage) {
      return res.status(404).json({ messageKey: 'productDosages.errors.notFound' });
    }

    // Validate dosageMode enum if provided
    if (dosageMode && !['manual', 'automatic'].includes(dosageMode)) {
      return res.status(400).json({
        messageKey: 'productDosages.errors.invalidDosageMode'
      });
    }

    // Verify product exists if changed
    if (productId && productId !== dosage.productId) {
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ messageKey: 'products.errors.notFound' });
      }
    }

    // Verify unit exists if changed
    if (unitId && unitId !== dosage.unitId) {
      const unit = await Unit.findByPk(unitId);
      if (!unit) {
        return res.status(404).json({ messageKey: 'units.errors.notFound' });
      }
    }

    // Verify system exists if changed
    if (systemId && systemId !== dosage.systemId) {
      const system = await System.findByPk(systemId);
      if (!system) {
        return res.status(404).json({ messageKey: 'systems.errors.notFound' });
      }
    }

    // Update fields
    if (productId !== undefined) dosage.productId = productId;
    if (systemId !== undefined) dosage.systemId = systemId;
    if (value !== undefined) dosage.value = value;
    if (unitId !== undefined) dosage.unitId = unitId;
    if (dosageMode !== undefined) dosage.dosageMode = dosageMode;
    if (frequency !== undefined) dosage.frequency = frequency;
    if (notes !== undefined) dosage.notes = notes;
    if (recordedAt !== undefined) dosage.recordedAt = new Date(recordedAt);

    await dosage.save();

    // Fetch with associations
    const updatedDosage = await ProductDosage.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'typeId']
        },
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name']
        },
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'abbreviation']
        },
        {
          model: User,
          as: 'recorder',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedDosage);
  } catch (error) {
    console.error('Error updating product dosage:', error);
    res.status(500).json({ messageKey: 'productDosages.errors.updateError', error: error.message });
  }
};

// Delete product dosage
exports.deleteProductDosage = async (req, res) => {
  try {
    const { id } = req.params;

    const dosage = await ProductDosage.findByPk(id);

    if (!dosage) {
      return res.status(404).json({ messageKey: 'productDosages.errors.notFound' });
    }

    await dosage.destroy();

    res.json({ messageKey: 'productDosages.success.deleted' });
  } catch (error) {
    console.error('Error deleting product dosage:', error);
    res.status(500).json({ messageKey: 'productDosages.errors.deleteError', error: error.message });
  }
};
