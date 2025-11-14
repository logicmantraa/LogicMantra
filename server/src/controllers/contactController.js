import Contact from '../models/Contact.js';

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public (optional auth)
export const submitContact = async (req, res) => {
  try {
    const { name, email, intent, message } = req.body;

    // Validation
    if (!name || !email || !intent || !message) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    // Get userId if user is authenticated (optional - req.user may be undefined)
    const userId = req.user?._id || null;

    // Create contact submission
    const contact = await Contact.create({
      name,
      email,
      intent,
      message,
      userId
    });

    res.status(201).json({
      message: 'Thank you for contacting us! We will get back to you soon.',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        intent: contact.intent
      }
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get all contact submissions (Admin only)
// @route   GET /api/contact
// @access  Private/Admin
export const getContacts = async (req, res) => {
  try {
    const { status, intent, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (intent) query.intent = intent;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contact by ID (Admin only)
// @route   GET /api/contact/:id
// @access  Private/Admin
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'name email');

    if (!contact) {
      res.status(404);
      throw new Error('Contact submission not found');
    }

    res.json(contact);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Update contact status (Admin only)
// @route   PUT /api/contact/:id
// @access  Private/Admin
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
      res.status(400);
      throw new Error('Please provide a valid status');
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact submission not found');
    }

    contact.status = status;
    await contact.save();

    res.json({
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete contact submission (Admin only)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact submission not found');
    }

    await contact.deleteOne();

    res.json({ message: 'Contact submission deleted successfully' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

