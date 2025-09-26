const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinaryConfig');  // For deletion

// NEW: Helper to extract publicId from Cloudinary URL (for fixed images)
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // Cloudinary URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<publicId>.<ext>
    const parts = url.split('/');
    const publicIdPart = parts[parts.length - 1].split('.')[0];  // Last part before ext
    if (parts.includes('upload') && publicIdPart) {
      // Full publicId may include folder/path, but for deletion, base is fine
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1) {
        const potentialPublicId = parts.slice(uploadIndex + 2).join('/').split('.')[0];
        return potentialPublicId || null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting publicId:', error);
    return null;
  }
};

// NEW: Helper to delete from Cloudinary (generic for fixed/dynamic)
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;  // Skip if no ID
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
    console.log('Cloudinary deletion result:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

// Controller: Create employee (fixed + dynamic docs)
exports.createEmployee = async (req, res) => {
  try {
    const {
      company,
      teamMemberName,
      mobileNumber,
      emergencyMobileNumber,
      email,
      password,
      salary,
      dateOfJoining,
      shift,
      departments,  // <-- Changed: Expect 'departments' (plural) from frontend
      role,
      designation,
      aadharNumber,
      panNumber,
      userUpi,
      paidLeaves,
      weeklyHoliday,
      address,
      accessPermissions,
      qrCode,
      documents: documentTypes  // NEW: Array of strings for dynamic, e.g., ["Driving License", "Passport"]
    } = req.body;

    // Validate departments (unchanged)
    if (!departments || !Array.isArray(departments) || departments.length === 0) {
      return res.status(400).json({ message: 'At least one department is required' });
    }
    const validDepartments = [...new Set(departments.filter(id => id && id.trim() !== ''))];
    if (validDepartments.length === 0) {
      return res.status(400).json({ message: 'Invalid departments provided' });
    }

    console.log('Creating employee with departments:', validDepartments); // Debug log

    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Employee email already exists' });

    // FIXED: Extract uploaded file URLs (unchanged)
    const adharImage = req.files?.adharImage ? req.files.adharImage[0].path : undefined;
    const panImage = req.files?.panImage ? req.files.panImage[0].path : undefined;
    const profileImage = req.files?.profileImage ? req.files.profileImage[0].path : undefined;

    // NEW: Handle dynamic documents
    let dynamicDocuments = [];
    if (documentTypes && Array.isArray(documentTypes) && documentTypes.length > 0) {
      const types = documentTypes.filter(type => type && type.trim() !== '');
      if (types.length === 0) {
        return res.status(400).json({ message: 'Invalid dynamic document types provided' });
      }
      if (req.files?.documents && Array.isArray(req.files.documents)) {
        const files = req.files.documents;
        if (files.length !== types.length) {
          return res.status(400).json({ 
            message: `Dynamic docs mismatch: ${types.length} types but ${files.length} files` 
          });
        }
        // Check duplicates
        const uniqueTypes = [...new Set(types.map(t => t.toLowerCase()))];
        if (uniqueTypes.length !== types.length) {
          return res.status(400).json({ message: 'Duplicate dynamic document types not allowed' });
        }
        // Create array
        dynamicDocuments = files.map((file, index) => ({
          type: types[index].trim(),
          url: file.path,
          publicId: file.filename  // Cloudinary public ID
        }));
        console.log('Created dynamic documents:', dynamicDocuments.map(d => d.type));
      } else {
        return res.status(400).json({ message: 'Files required for dynamic document types' });
      }
    }

    const employee = new Employee({
      company,
      teamMemberName,
      mobileNumber,
      emergencyMobileNumber,
      email,
      password,
      salary,
      dateOfJoining,
      shift,
      department: validDepartments,  // <-- Fixed: Assign 'departments' to model field 'department' (as array)
      role,
      designation,
      aadharNumber,
      panNumber,
      userUpi,
      paidLeaves,
      weeklyHoliday,
      address,
      accessPermissions,
      // FIXED: Keep as is
      adharImage,
      panImage,
      profileImage,
      // NEW: Dynamic array
      documents: dynamicDocuments,
      qrCode
    });

    await employee.save();
    res.status(201).json({ message: 'Employee created', employee });
  } catch (error) {
    console.error('Create employee error:', error); // Enhanced logging
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Controller: Update employee (fixed + dynamic docs)
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const {
      teamMemberName,
      mobileNumber,
      emergencyMobileNumber,
      email,
      password,
      salary,
      dateOfJoining,
      shift,
      departments,  // <-- Changed: Expect 'departments' (plural) from frontend
      role,
      designation,
      aadharNumber,
      panNumber,
      userUpi,
      weeklyHoliday,
      paidLeaves,
      address,
      accessPermissions,
      qrCode,
      documents: newDocumentTypes,  // NEW: For adding new dynamic docs
      removeDocuments,  // NEW: Array of dynamic types to remove, e.g., ["Driving License"]
      adharImage: adharImageNull,  // NEW: Explicit null to delete fixed
      panImage: panImageNull,
      profileImage: profileImageNull
    } = req.body;

    // Handle departments update (unchanged)
    if (departments) {
      if (!Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({ message: 'Invalid departments provided' });
      }
      const validDepartments = [...new Set(departments.filter(id => id && id.trim() !== ''))];
      if (validDepartments.length === 0) {
        return res.status(400).json({ message: 'At least one department is required' });
      }
      employee.department = validDepartments;  // <-- Fixed: Assign to model field 'department' (as array)
      console.log('Updating employee departments:', validDepartments); // Debug log
    }

    // Standard field updates (unchanged)
    if (teamMemberName) employee.teamMemberName = teamMemberName;
    if (mobileNumber) employee.mobileNumber = mobileNumber;
    if (emergencyMobileNumber) employee.emergencyMobileNumber = emergencyMobileNumber;
    if (email) employee.email = email;
    if (salary !== undefined) employee.salary = salary;
    if (dateOfJoining) employee.dateOfJoining = dateOfJoining;
    if (shift) employee.shift = shift;
    if (role) employee.role = role;
    if (designation) employee.designation = designation;
    if (aadharNumber) employee.aadharNumber = aadharNumber;
    if (panNumber) employee.panNumber = panNumber;
    if (userUpi) employee.userUpi = userUpi;
    if (weeklyHoliday) employee.weeklyHoliday = weeklyHoliday;
    if (paidLeaves) employee.paidLeaves = paidLeaves;
    if (address) employee.address = address;
    if (accessPermissions) employee.accessPermissions = accessPermissions;
    if (qrCode) employee.qrCode = qrCode;

    // FIXED: Update images if uploaded (unchanged)
    if (req.files?.adharImage) {
      employee.adharImage = req.files.adharImage[0].path;
    }
    if (req.files?.panImage) {
      employee.panImage = req.files.panImage[0].path;
    }
    if (req.files?.profileImage) {
      employee.profileImage = req.files.profileImage[0].path;
    }

        // NEW: Handle explicit deletion of fixed images (if body sends null)
    if (adharImageNull === null && employee.adharImage) {
      const publicId = extractPublicIdFromUrl(employee.adharImage);
      if (publicId) await deleteFromCloudinary(publicId);
      employee.adharImage = null;
      console.log('Deleted Aadhar image from Cloudinary');
    }
    if (panImageNull === null && employee.panImage) {
      const publicId = extractPublicIdFromUrl(employee.panImage);
      if (publicId) await deleteFromCloudinary(publicId);
      employee.panImage = null;
      console.log('Deleted PAN image from Cloudinary');
    }
    if (profileImageNull === null && employee.profileImage) {
      const publicId = extractPublicIdFromUrl(employee.profileImage);
      if (publicId) await deleteFromCloudinary(publicId);
      employee.profileImage = null;
      console.log('Deleted Profile image from Cloudinary');
    }

    // NEW: Handle dynamic document removal (if removeDocuments in body)
    if (removeDocuments && Array.isArray(removeDocuments) && removeDocuments.length > 0) {
      const typesToRemove = removeDocuments.filter(type => type && type.trim() !== '');
      for (const typeToRemove of typesToRemove) {
        const docIndex = employee.documents.findIndex(doc => doc.type.toLowerCase() === typeToRemove.toLowerCase());
        if (docIndex !== -1) {
          const doc = employee.documents[docIndex];
          await deleteFromCloudinary(doc.publicId);  // Delete from Cloudinary
          employee.documents.splice(docIndex, 1);  // Remove from array
          console.log(`Removed dynamic document: ${doc.type}`);
        } else {
          console.warn(`Dynamic document type not found for removal: ${typeToRemove}`);
        }
      }
    }

    // NEW: Handle adding new dynamic documents
    if (newDocumentTypes && Array.isArray(newDocumentTypes) && newDocumentTypes.length > 0) {
      const types = newDocumentTypes.filter(type => type && type.trim() !== '');
      if (types.length === 0) {
        return res.status(400).json({ message: 'Invalid new dynamic document types provided' });
      }
      if (req.files?.documents && Array.isArray(req.files.documents)) {
        const files = req.files.documents;
        if (files.length !== types.length) {
          return res.status(400).json({ 
            message: `Dynamic docs mismatch: ${types.length} new types but ${files.length} new files` 
          });
        }
        // Check for duplicates with existing
        const existingTypes = employee.documents.map(doc => doc.type.toLowerCase());
        const newTypesLower = types.map(t => t.toLowerCase());
        const duplicates = newTypesLower.filter(t => existingTypes.includes(t));
        if (duplicates.length > 0) {
          return res.status(400).json({ message: `Duplicate dynamic types not allowed: ${duplicates.join(', ')}` });
        }
        // Add new documents
        const newDocs = files.map((file, index) => ({
          type: types[index].trim(),
          url: file.path,
          publicId: file.filename
        }));
        employee.documents.push(...newDocs);
        console.log('Added new dynamic documents:', newDocs.map(d => d.type));
      } else {
        return res.status(400).json({ message: 'Files required for new dynamic document types' });
      }
    }

    // Password hashing (fixed: your original code had a bug—salt was used twice)
    if (password) {
      const salt = await bcrypt.genSalt(10);
      employee.password = await bcrypt.hash(password, salt);
    }

    await employee.save();
    res.json({ message: 'Employee updated', employee });
  } catch (error) {
    console.error('Update employee error:', error); // Enhanced logging
    res.status(500).json({ message: 'Server error', error: error.message || error });
  }
};

// NEW: Get all documents for an employee (fixed + dynamic)
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id).select('adharImage panImage profileImage documents');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    res.json({
      message: 'Employee documents retrieved',
      documents: {
        fixed: {
          adharImage: employee.adharImage || null,
          panImage: employee.panImage || null,
          profileImage: employee.profileImage || null
        },
        dynamic: employee.documents || []  // Array of { type, url, publicId, uploadedAt }
      }
    });
  } catch (error) {
    console.error('Get employee documents error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ... (Rest unchanged: getAllEmployees, getEmployeeById, getEmployeesByCompany, deleteEmployee)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getEmployeesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const employees = await Employee.find({ company: companyId });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Employee (with full Cloudinary cleanup)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // NEW/ENHANCED: Delete all associated images/documents from Cloudinary before DB deletion
    const deletionErrors = [];  // Track any failures

    // Fixed images
    if (employee.adharImage) {
      try {
        const publicId = extractPublicIdFromUrl(employee.adharImage);
        if (publicId) {
          await deleteFromCloudinary(publicId);
          console.log('Deleted adharImage from Cloudinary');
        }
      } catch (error) {
        console.error('Failed to delete adharImage from Cloudinary:', error);
        deletionErrors.push('adharImage');
      }
    }

    if (employee.panImage) {
      try {
        const publicId = extractPublicIdFromUrl(employee.panImage);
        if (publicId) {
          await deleteFromCloudinary(publicId);
          console.log('Deleted panImage from Cloudinary');
        }
      } catch (error) {
        console.error('Failed to delete panImage from Cloudinary:', error);
        deletionErrors.push('panImage');
      }
    }

    if (employee.profileImage) {
      try {
        const publicId = extractPublicIdFromUrl(employee.profileImage);
        if (publicId) {
          await deleteFromCloudinary(publicId);
          console.log('Deleted profileImage from Cloudinary');
        }
      } catch (error) {
        console.error('Failed to delete profileImage from Cloudinary:', error);
        deletionErrors.push('profileImage');
      }
    }

    // Dynamic documents
    if (employee.documents && employee.documents.length > 0) {
      for (const doc of employee.documents) {
        try {
          await deleteFromCloudinary(doc.publicId);
          console.log(`Deleted dynamic document "${doc.type}" from Cloudinary`);
        } catch (error) {
          console.error(`Failed to delete dynamic document "${doc.type}" from Cloudinary:`, error);
          deletionErrors.push(doc.type);
        }
      }
    }

    // Delete from DB
    await Employee.findByIdAndDelete(id);

    // Response
    const message = deletionErrors.length > 0 
      ? `Employee deleted. Warning: Failed to delete from Cloudinary: ${deletionErrors.join(', ')}`
      : 'Employee deleted successfully (including all images/documents from Cloudinary)';

    res.json({ message });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};