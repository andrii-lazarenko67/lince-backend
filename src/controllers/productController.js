const { Product, ProductUsage, System, User } = require('../../db/models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

const productController = {
  async getAll(req, res, next) {
    try {
      const { type, isActive, search, lowStock } = req.query;

      const where = {};

      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { supplier: { [Op.iLike]: `%${search}%` } }
        ];
      }

      let products = await Product.findAll({
        where,
        order: [['name', 'ASC']]
      });

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
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
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
      const { name, type, unit, supplier, currentStock, minStockAlert, description } = req.body;

      const product = await Product.create({
        name,
        type,
        unit,
        supplier,
        currentStock: currentStock || 0,
        minStockAlert,
        description
      });

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, type, unit, supplier, currentStock, minStockAlert, description, isActive } = req.body;

      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({
        name: name || product.name,
        type: type || product.type,
        unit: unit || product.unit,
        supplier: supplier !== undefined ? supplier : product.supplier,
        currentStock: currentStock !== undefined ? currentStock : product.currentStock,
        minStockAlert: minStockAlert !== undefined ? minStockAlert : product.minStockAlert,
        description: description !== undefined ? description : product.description,
        isActive: isActive !== undefined ? isActive : product.isActive
      });

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  },

  async addUsage(req, res, next) {
    try {
      const { type, quantity, systemId, notes, date } = req.body;
      const userId = req.user.id;

      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
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
        await notificationService.notifyManagers({
          type: 'stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low. Current stock: ${newStock} ${product.unit}`,
          priority: 'high',
          referenceType: 'Product',
          referenceId: product.id,
          createdById: userId
        });
      }

      res.status(201).json({
        success: true,
        data: {
          usage,
          product: await Product.findByPk(product.id)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({ isActive: false });

      res.json({
        success: true,
        message: 'Product deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;
