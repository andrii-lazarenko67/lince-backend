const { Parameter, User } = require('../../db/models');

// Get all parameters
exports.getAllParameters = async (req, res) => {
  try {
    const parameters = await Parameter.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['isSystemDefault', 'DESC'], ['name', 'ASC']]
    });

    res.json(parameters);
  } catch (error) {
    console.error('Error fetching parameters:', error);
    res.status(500).json({ message: 'Error fetching parameters', error: error.message });
  }
};

// Get parameter by ID
exports.getParameterById = async (req, res) => {
  try {
    const { id } = req.params;

    const parameter = await Parameter.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!parameter) {
      return res.status(404).json({ message: 'Parameter not found' });
    }

    res.json(parameter);
  } catch (error) {
    console.error('Error fetching parameter:', error);
    res.status(500).json({ message: 'Error fetching parameter', error: error.message });
  }
};

// Create new parameter
exports.createParameter = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Parameter name is required' });
    }

    // Check if parameter with same name already exists
    const existingParameter = await Parameter.findOne({ where: { name } });
    if (existingParameter) {
      return res.status(400).json({ message: 'Parameter with this name already exists' });
    }

    // Create parameter
    const parameter = await Parameter.create({
      name,
      description: description || null,
      createdBy: userId,
      isSystemDefault: false
    });

    // Fetch with associations
    const createdParameter = await Parameter.findByPk(parameter.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(createdParameter);
  } catch (error) {
    console.error('Error creating parameter:', error);
    res.status(500).json({ message: 'Error creating parameter', error: error.message });
  }
};

// Update parameter
exports.updateParameter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const parameter = await Parameter.findByPk(id);

    if (!parameter) {
      return res.status(404).json({ message: 'Parameter not found' });
    }

    // Check if trying to update system default
    if (parameter.isSystemDefault) {
      return res.status(403).json({ message: 'Cannot modify system default parameters' });
    }

    // Check if parameter with new name already exists
    if (name && name !== parameter.name) {
      const existingParameter = await Parameter.findOne({ where: { name } });
      if (existingParameter) {
        return res.status(400).json({ message: 'Parameter with this name already exists' });
      }
    }

    // Update parameter
    if (name !== undefined) parameter.name = name;
    if (description !== undefined) parameter.description = description;

    await parameter.save();

    // Fetch with associations
    const updatedParameter = await Parameter.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedParameter);
  } catch (error) {
    console.error('Error updating parameter:', error);
    res.status(500).json({ message: 'Error updating parameter', error: error.message });
  }
};

// Delete parameter
exports.deleteParameter = async (req, res) => {
  try {
    const { id } = req.params;

    const parameter = await Parameter.findByPk(id);

    if (!parameter) {
      return res.status(404).json({ message: 'Parameter not found' });
    }

    // Check if trying to delete system default
    if (parameter.isSystemDefault) {
      return res.status(403).json({ message: 'Cannot delete system default parameters' });
    }

    // Check if parameter is being used by any monitoring points
    const { MonitoringPoint } = require('../../db/models');
    const usageCount = await MonitoringPoint.count({ where: { parameterId: id } });

    if (usageCount > 0) {
      return res.status(400).json({
        message: `Cannot delete parameter. It is currently used by ${usageCount} monitoring point(s)`
      });
    }

    await parameter.destroy();

    res.json({ message: 'Parameter deleted successfully' });
  } catch (error) {
    console.error('Error deleting parameter:', error);
    res.status(500).json({ message: 'Error deleting parameter', error: error.message });
  }
};
