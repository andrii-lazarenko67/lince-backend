const { Product, ProductType, ProductUsage, System, User, Unit } = require('../../db/models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const productController = {
  async getTypes(req, res, next) {
    try {
      const types = await ProductType.findAll({
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      next(error);
    }
  },

  async createType(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Product type name is required'
        });
      }

      const type = await ProductType.create({ name, description });

      res.status(201).json({
        success: true,
        data: type
      });
    } catch (error) {
      next(error);
    }
  },

  async updateType(req, res, next) {
    try {
      const { name, description } = req.body;
      const type = await ProductType.findByPk(req.params.typeId);

      if (!type) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      if (name !== undefined) type.name = name;
      if (description !== undefined) type.description = description;

      await type.save();

      res.json({
        success: true,
        data: type
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteType(req, res, next) {
    try {
      const type = await ProductType.findByPk(req.params.typeId);

      if (!type) {
        return res.status(404).json({
          success: false,
          message: 'Product type not found'
        });
      }

      // Check if any products are using this type
      const productCount = await Product.count({ where: { typeId: req.params.typeId } });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete product type. ${productCount} product(s) are using this type.`
        });
      }

      await type.destroy();

      res.json({
        success: true,
        message: 'Product type deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const { typeId, isActive, search, lowStock, systemId } = req.query;

      const where = {};

      // Client filtering - required for data isolation
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      if (typeId) where.typeId = typeId;
      // By default, only show active products unless explicitly requested otherwise
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      } else {
        where.isActive = true; // Default to showing only active products
      }
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { supplier: { [Op.iLike]: `%${search}%` } }
        ];
      }

      let products;

      // If systemId is provided, filter products that have been used in that system
      if (systemId) {
        // Find all product IDs that have usages in the specified system
        const usages = await ProductUsage.findAll({
          where: { systemId: parseInt(systemId) },
          attributes: ['productId'],
          group: ['productId']
        });
        const productIds = usages.map(u => u.productId);

        if (productIds.length > 0) {
          where.id = { [Op.in]: productIds };
          products = await Product.findAll({
            where,
            include: [
              { model: ProductType, as: 'type' },
              { model: Unit, as: 'unit' }
            ],
            order: [['name', 'ASC']]
          });
        } else {
          products = [];
        }
      } else {
        products = await Product.findAll({
          where,
          include: [
            { model: ProductType, as: 'type' },
            { model: Unit, as: 'unit' }
          ],
          order: [['name', 'ASC']]
        });
      }

      // Filter low stock products
      if (lowStock === 'true') {
        products = products.filter(p =>
          p.minStockAlert && parseFloat(p.currentStock) <= parseFloat(p.minStockAlert)
        );
      }

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const product = await Product.findOne({
        where,
        include: [
          { model: ProductType, as: 'type' },
          { model: Unit, as: 'unit' }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          messageKey: 'products.errors.notFound'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsages(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Verify product belongs to client
      const productWhere = { id: req.params.id };
      if (req.clientId) {
        productWhere.clientId = req.clientId;
      }

      const product = await Product.findOne({ where: productWhere });
      if (!product) {
        return res.status(404).json({
          success: false,
          messageKey: 'products.errors.notFound'
        });
      }

      const where = { productId: req.params.id };

      if (startDate && endDate) {
        where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const usages = await ProductUsage.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system' }
        ],
        order: [['date', 'DESC']]
      });

      res.json({
        success: true,
        data: usages
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      // Require clientId for creating products
      if (!req.clientId) {
        return res.status(400).json({
          success: false,
          messageKey: 'errors.clientIdRequired'
        });
      }

      const { name, typeId, unitId, supplier, currentStock, minStockAlert, description, recommendedDosage } = req.body;

      const product = await Product.create({
        name,
        typeId,
        unitId,
        supplier,
        currentStock: currentStock || 0,
        minStockAlert,
        description,
        recommendedDosage,
        clientId: req.clientId
      });

      // Fetch with associations
      const productWithAssociations = await Product.findByPk(product.id, {
        include: [
          { model: ProductType, as: 'type' },
          { model: Unit, as: 'unit' }
        ]
      });

      res.status(201).json({
        success: true,
        data: productWithAssociations
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, typeId, unitId, supplier, currentStock, minStockAlert, description, recommendedDosage, isActive } = req.body;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const product = await Product.findOne({ where });

      if (!product) {
        return res.status(404).json({
          success: false,
          messageKey: 'products.errors.notFound'
        });
      }

      await product.update({
        name: name || product.name,
        typeId: typeId !== undefined ? typeId : product.typeId,
        unitId: unitId !== undefined ? unitId : product.unitId,
        supplier: supplier !== undefined ? supplier : product.supplier,
        currentStock: currentStock !== undefined ? currentStock : product.currentStock,
        minStockAlert: minStockAlert !== undefined ? minStockAlert : product.minStockAlert,
        description: description !== undefined ? description : product.description,
        recommendedDosage: recommendedDosage !== undefined ? recommendedDosage : product.recommendedDosage,
        isActive: isActive !== undefined ? isActive : product.isActive
      });

      // Fetch with associations
      const productWithAssociations = await Product.findByPk(product.id, {
        include: [
          { model: ProductType, as: 'type' },
          { model: Unit, as: 'unit' }
        ]
      });

      res.json({
        success: true,
        data: productWithAssociations
      });
    } catch (error) {
      next(error);
    }
  },

  async addUsage(req, res, next) {
    try {
      const { type, quantity, systemId, notes, date } = req.body;
      const userId = req.user.id;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const product = await Product.findOne({ where });

      if (!product) {
        return res.status(404).json({
          success: false,
          messageKey: 'products.errors.notFound'
        });
      }

      // Validate systemId belongs to client if provided
      if (systemId && req.clientId) {
        const system = await System.findOne({
          where: { id: systemId, clientId: req.clientId }
        });
        if (!system) {
          return res.status(404).json({
            success: false,
            messageKey: 'systems.errors.notFound'
          });
        }
      }

      const usage = await ProductUsage.create({
        productId: product.id,
        userId,
        systemId,
        type,
        quantity,
        notes,
        date: date || new Date()
      });

      // Update stock
      let newStock;
      if (type === 'in') {
        newStock = parseFloat(product.currentStock) + parseFloat(quantity);
      } else {
        newStock = parseFloat(product.currentStock) - parseFloat(quantity);
      }

      await product.update({ currentStock: newStock });

      // Check for low stock alert
      if (product.minStockAlert && newStock <= parseFloat(product.minStockAlert)) {
        // Fetch product with unit to get unit abbreviation
        const productWithUnit = await Product.findByPk(product.id, {
          include: [{ model: Unit, as: 'unit' }]
        });

        await notificationService.notifyManagers({
          type: 'stock',
          titleKey: 'notifications.messages.lowStock.title',
          messageKey: 'notifications.messages.lowStock.message',
          messageParams: { name: product.name, stock: newStock, unit: productWithUnit.unit?.abbreviation || '' },
          priority: 'high',
          referenceType: 'Product',
          referenceId: product.id,
          createdById: userId,
          clientId: req.clientId
        });
      }

      // Fetch the usage with associations for proper frontend display
      const usageWithAssociations = await ProductUsage.findByPk(usage.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: System, as: 'system' }
        ]
      });

      res.status(201).json({
        success: true,
        data: usageWithAssociations
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStock(req, res, next) {
    try {
      const { quantity, type, notes } = req.body;
      const userId = req.user.id;

      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const product = await Product.findOne({ where });

      if (!product) {
        return res.status(404).json({
          success: false,
          messageKey: 'products.errors.notFound'
        });
      }

      // Calculate new stock
      let newStock;
      if (type === 'add') {
        newStock = parseFloat(product.currentStock) + parseFloat(quantity);
      } else {
        newStock = parseFloat(product.currentStock) - parseFloat(quantity);
      }

      // Prevent negative stock
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          messageKey: 'products.errors.negativeStock'
        });
      }

      await product.update({ currentStock: newStock });

      // Create a usage record for tracking
      await ProductUsage.create({
        productId: product.id,
        userId,
        type: type === 'add' ? 'in' : 'out',
        quantity,
        notes: notes || `Stock ${type === 'add' ? 'added' : 'removed'} manually`,
        date: new Date()
      });

      // Check for low stock alert
      if (product.minStockAlert && newStock <= parseFloat(product.minStockAlert)) {
        // Fetch product with unit to get unit abbreviation
        const productWithUnit = await Product.findByPk(product.id, {
          include: [{ model: Unit, as: 'unit' }]
        });

        await notificationService.notifyManagers({
          type: 'stock',
          titleKey: 'notifications.messages.lowStock.title',
          messageKey: 'notifications.messages.lowStock.message',
          messageParams: { name: product.name, stock: newStock, unit: productWithUnit.unit?.abbreviation || '' },
          priority: 'high',
          referenceType: 'Product',
          referenceId: product.id,
          createdById: userId,
          clientId: req.clientId
        });
      }

      res.json({
        success: true,
        data: await Product.findByPk(product.id, {
          include: [
            { model: ProductType, as: 'type' },
            { model: Unit, as: 'unit' }
          ]
        })
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const where = { id: req.params.id };

      // Client filtering
      if (req.clientId) {
        where.clientId = req.clientId;
      }

      const product = await Product.findOne({ where });

      if (!product) {
        return res.status(404).json({
          success: false,
          messageKey: 'products.errors.notFound'
        });
      }

      await product.update({ isActive: false });

      res.json({
        success: true,
        messageKey: 'products.success.deactivated'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;
