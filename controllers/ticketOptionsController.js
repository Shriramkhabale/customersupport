const TicketOptions = require('../models/TicketOptions');
const getCompanyId = (req) => {
  if (req.params.companyId) {
    return req.params.companyId;
  }
  
  if (req.body.companyId) {
    return req.body.companyId;
  }
  
  if (req.user) {
    if (req.user.role === 'company') {
      return req.user.id;
    }
    return req.user.companyId;
  }
  
  return null;
};


exports.addTicketOption = async (req, res) => {
  try {
    const { category, value } = req.body;
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company ID required' 
      });
    }

    const validCategories = ['services', 'materials', 'locations', 'customerNames', 'cities', 'subjects', 'descriptions'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }

    const values = Array.isArray(value) ? value : [value];
    const validValues = values.filter(v => v && typeof v === 'string' && v.trim());
    
    if (validValues.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one valid value required' 
      });
    }

    let options = await TicketOptions.findOne({ companyId });
    
    if (!options) {
      options = new TicketOptions({ companyId });
    }

    const current = options[category] || [];
    const currentLower = current.map(v => v.toLowerCase());
    
    const newValues = validValues
      .map(v => v.trim())
      .filter(v => !currentLower.includes(v.toLowerCase()));

    if (newValues.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No new values (duplicates filtered)',
        total: current.length
      });
    }

    options[category] = [...current, ...newValues];
    await options.save();

    res.status(201).json({ 
      success: true, 
      message: `Added ${newValues.length} new value(s) to ${category}`,
      added: newValues.length,
      total: options[category].length
    });
  } catch (error) {
    console.error('Add option error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

exports.getTicketOptions = async (req, res) => {
  try {
    const companyId = getCompanyId(req);

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company ID required' 
      });
    }

    let options = await TicketOptions.findOne({ companyId });

    if (!options) {
      options = {
        services: [],
        materials: [],
        locations: [],
        customerNames:[],
        cities: [],
        subjects: [],
        descriptions: []
      };
    } else {
      options = {
        services: options.services || [],
        materials: options.materials || [],
        locations: options.locations || [],
        customerNames : options.customerNames || [],
        cities: options.cities || [],
        subjects: options.subjects || [],
        descriptions: options.descriptions || []
      };
    }

    res.json({ 
      success: true, 
      options 
    });
  } catch (error) {
    console.error('Get options error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};



// NEW: Delete a specific item by index
exports.deleteTicketOption = async (req, res) => {
  try {
    const { companyId, category, index } = req.params;
    const parsedIndex = parseInt(index);

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company ID required' 
      });
    }

    const validCategories = ['services', 'materials', 'locations','customerNames', 'cities', 'subjects', 'descriptions'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }

    if (isNaN(parsedIndex) || parsedIndex < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid index' 
      });
    }

    let options = await TicketOptions.findOne({ companyId });
    
    if (!options) {
      return res.status(404).json({ 
        success: false, 
        message: 'No options found for this company' 
      });
    }

    const currentArray = options[category] || [];
    
    if (parsedIndex >= currentArray.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Index out of bounds' 
      });
    }

    // Remove the item at the specified index
    const updatedArray = currentArray.filter((_, i) => i !== parsedIndex);
    options[category] = updatedArray;
    
    await options.save();

    res.json({ 
      success: true, 
      message: `Item deleted from ${category}`,
      deletedIndex: parsedIndex,
      total: updatedArray.length
    });
  } catch (error) {
    console.error('Delete option error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

// NEW: Update entire category array (for bulk operations)
exports.updateTicketOptions = async (req, res) => {
  try {
    const { companyId, category, value } = req.body;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company ID required' 
      });
    }

    const validCategories = ['services', 'materials', 'locations', 'customerNames', 'cities', 'subjects', 'descriptions'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }

    if (!Array.isArray(value)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Value must be an array' 
      });
    }

    let options = await TicketOptions.findOne({ companyId });
    
    if (!options) {
      options = new TicketOptions({ companyId });
    }

    // Update the entire array
    options[category] = value.filter(v => v && typeof v === 'string' && v.trim());
    await options.save();

    res.json({ 
      success: true, 
      message: `${category} updated successfully`,
      total: options[category].length
    });
  } catch (error) {
    console.error('Update options error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};