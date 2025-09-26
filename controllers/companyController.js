const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


// exports.createCompany = async (req, res) => {
//   console.log('Authenticated user:', req.user);
//   try {
//     let {
//       businessName,
//       businessEmail,
//       businessPhone,
//       EmergencyMobNo,
//       password,
//       businessCreatedDate,
//       businessSubscriptionPlan,
//       weeklyHoliday,
//       address,
//       businessLogo,
//       franchise
//     } = req.body;

//     if (typeof weeklyHoliday === 'string') {
//       weeklyHoliday = [weeklyHoliday];
//     }

//     const existing = await Company.findOne({ businessEmail });
//     if (existing) return res.status(400).json({ message: 'Company email already exists' });

//     const company = new Company({
//       superadmin: req.user.id,  // make sure req.user is set
//       franchise,
//       businessName,
//       businessEmail,
//       businessPhone,
//       EmergencyMobNo,
//       password,  
//       businessCreatedDate,
//       businessSubscriptionPlan,
//       weeklyHoliday,
//       address,
//       businessLogo
//     });

//     await company.save();
//     res.status(201).json({ message: 'Company created', company });
//   } catch (error) {
//     console.error('Error creating company:', error);
//     res.status(500).json({ message: 'Server error', error: error.message || error });
//   }
// };

// Get all companies for superadmin

exports.createCompanyWithLogo = async (req, res) => {
  try {
    let {
      businessName,
      businessEmail,
      businessPhone,
      EmergencyMobNo,
      password,
      businessCreatedDate,
      businessSubscriptionPlan,
      weeklyHoliday,
      address,
      franchise
    } = req.body;

    if (typeof weeklyHoliday === 'string') {
      weeklyHoliday = [weeklyHoliday];
    }

    const existing = await Company.findOne({ businessEmail });
    if (existing) return res.status(400).json({ message: 'Company email already exists' });

    const businessLogo = req.file ? req.file.path : undefined;

    const company = new Company({
      superadmin: req.user.id,
      franchise,
      businessName,
      businessEmail,
      businessPhone,
      EmergencyMobNo,
      password,
      businessCreatedDate,
      businessSubscriptionPlan,
      weeklyHoliday,
      address,
      businessLogo
    });

    await company.save();
    res.status(201).json({ message: 'Company created', company });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ superadmin: req.user.id }); 
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.getCompanyById = async (req, res) => {
  try {
    const companies = await Company.findById(req.params.id);
    if (!companies) {
      return res.status(404).json({ message: 'companies not found' });
    }
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// Update Company
// exports.updateCompany = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const company = await Company.findOne({ _id: id, superadmin: req.user.id });
//     if (!company) return res.status(404).json({ message: 'Company not found' });

//     Object.assign(company, req.body);
//     await company.save();

//     res.json({ message: 'Company updated', company });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };

exports.updateCompanyWithLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.file) {
      updateData.businessLogo = req.file.path;
    }

    const company = await Company.findOne({ _id: id, superadmin: req.user.id });
    if (!company) return res.status(404).json({ message: 'Company not found' });

    Object.assign(company, updateData);
    await company.save();

    res.json({ message: 'Company updated', company });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




// Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findOneAndDelete({ _id: id, superadmin: req.user.id });
    if (!company) return res.status(404).json({ message: 'Company not found' });

    res.json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// exports.createBranch = async (req, res) => {
//   try {
//     const { parentCompanyId } = req.params; // parent company id from URL param
//     const {
//       businessName,
//       businessEmail,
//       businessPhone,
//       EmergencyMobNo,
//       password,
//       businessCreatedDate,
//       businessSubscriptionPlan,
//       weeklyHoliday,
//       address,
//       businessLogo,
//       franchise
//     } = req.body;

//     if (!businessName || !businessEmail || !password) {
//       return res.status(400).json({ message: 'businessName, businessEmail and password are required' });
//     }

//     if (!mongoose.Types.ObjectId.isValid(parentCompanyId)) {
//       return res.status(400).json({ message: 'Invalid parent company ID' });
//     }

//     // Validate parent company exists and is not a branch
//     const parentCompany = await Company.findById(parentCompanyId);
//     if (!parentCompany) {
//       return res.status(404).json({ message: 'Parent company not found' });
//     }
//     if (parentCompany.isBranch) {
//       return res.status(400).json({ message: 'Cannot add branch to a branch' });
//     }

//     // Check if branch email already exists (optional but recommended)
//     const existingBranch = await Company.findOne({ businessEmail });
//     if (existingBranch) {
//       return res.status(400).json({ message: 'Branch email already exists' });
//     }

//     // Create branch document with isBranch and parentCompanyId
//     const branch = new Company({
//       businessName,
//       businessEmail,
//       businessPhone,
//       EmergencyMobNo,
//       password,
//       businessCreatedDate,
//       businessSubscriptionPlan,
//       weeklyHoliday,
//       address,
//       businessLogo,
//       franchise,
//       isBranch: true,
//       parentCompanyId: parentCompany._id,
//       branches: [] // branches of a branch usually empty
//     });

//     await branch.save();

//     // Append branch id to parent company's branches array
//     parentCompany.branches.push(branch._id);
//     await parentCompany.save();

//     res.status(201).json({ message: 'Branch created successfully', branch });
//   } catch (error) {
//     console.error('Create branch error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };





// exports.updateBranch = async (req, res) => {
//   try {
//     const { companyId, branchId } = req.params;
//     const updateData = req.body;

//     if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(branchId)) {
//       return res.status(400).json({ message: 'Invalid company or branch ID' });
//     }

//     // Verify parent company exists and is not a branch
//     const parentCompany = await Company.findById(companyId);
//     if (!parentCompany) {
//       return res.status(404).json({ message: 'Company not found' });
//     }
//     if (parentCompany.isBranch) {
//       return res.status(400).json({ message: 'Provided company ID is a branch, not a company' });
//     }

//     // Find branch and verify it belongs to the company
//     const branch = await Company.findOne({ _id: branchId, parentCompanyId: companyId, isBranch: true });
//     if (!branch) {
//       return res.status(404).json({ message: 'Branch not found for this company' });
//     }

//     // Prevent changing parentCompanyId or isBranch via update
//     delete updateData.parentCompanyId;
//     delete updateData.isBranch;

//     // If password is being updated, it will be hashed by pre-save hook
//     Object.assign(branch, updateData);
//     await branch.save();

//     res.json({ message: 'Branch updated successfully', branch });
//   } catch (error) {
//     console.error('Update branch error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


exports.createBranchWithLogo = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      businessName,
      businessEmail,
      businessPhone,
      EmergencyMobNo,
      password,
      businessCreatedDate,
      businessSubscriptionPlan,
      weeklyHoliday,
      address,
      franchise
    } = req.body;

    if (!businessName || !businessEmail || !password) {
      return res.status(400).json({ message: 'businessName, businessEmail and password are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid parent company ID' });
    }

    const parentCompany = await Company.findById(companyId);
    if (!parentCompany) {
      return res.status(404).json({ message: 'Parent company not found' });
    }
    if (parentCompany.isBranch) {
      return res.status(400).json({ message: 'Cannot add branch to a branch' });
    }

    const existingBranch = await Company.findOne({ businessEmail });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch email already exists' });
    }

    const businessLogo = req.file ? req.file.path : undefined;

    const branch = new Company({
      businessName,
      businessEmail,
      businessPhone,
      EmergencyMobNo,
      password,
      businessCreatedDate,
      businessSubscriptionPlan,
      weeklyHoliday,
      address,
      businessLogo,
      franchise,
      isBranch: true,
      parentCompanyId: parentCompany._id,
      branches: []
    });

    await branch.save();

    parentCompany.branches.push(branch._id);
    await parentCompany.save();

    res.status(201).json({ message: 'Branch created successfully', branch });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateBranchWithLogo = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: 'Invalid company or branch ID' });
    }

    const parentCompany = await Company.findById(companyId);
    if (!parentCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }
    if (parentCompany.isBranch) {
      return res.status(400).json({ message: 'Provided company ID is a branch, not a company' });
    }

    const branch = await Company.findOne({ _id: branchId, parentCompanyId: companyId, isBranch: true });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found for this company' });
    }

    delete updateData.parentCompanyId;
    delete updateData.isBranch;

    if (req.file) {
      updateData.businessLogo = req.file.path;
    }

    Object.assign(branch, updateData);
    await branch.save();

    res.json({ message: 'Branch updated successfully', branch });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBranchesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    // Verify parent company exists and is not a branch
    const parentCompany = await Company.findById(companyId);
    if (!parentCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }
    if (parentCompany.isBranch) {
      return res.status(400).json({ message: 'Provided ID is a branch, not a company' });
    }

    // Find branches with parentCompanyId = companyId
    const branches = await Company.find({ parentCompanyId: companyId, isBranch: true });

    res.json({ branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: 'Invalid company or branch ID' });
    }

    // Verify parent company exists and is not a branch
    const parentCompany = await Company.findById(companyId);
    if (!parentCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }
    if (parentCompany.isBranch) {
      return res.status(400).json({ message: 'Provided company ID is a branch, not a company' });
    }

    // Find and delete branch if it belongs to the company
    const branch = await Company.findOneAndDelete({ _id: branchId, parentCompanyId: companyId, isBranch: true });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found for this company' });
    }

    // Remove branch ID from parent company's branches array
    parentCompany.branches.pull(branchId);
    await parentCompany.save();

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
