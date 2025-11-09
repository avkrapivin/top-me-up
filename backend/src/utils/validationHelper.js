const Joi = require('joi');

// Schema for validation
const listSchema = Joi.object({
    title: Joi.string().required().trim().max(100),
    category: Joi.string().valid('movies', 'music', 'games').required(),
    description: Joi.string().max(500).allow(''),
    isPublic: Joi.boolean().default(false),
    items: Joi.array().items(Joi.object({
        externalId: Joi.string().required(),
        title: Joi.string().required().trim().max(200),
        position: Joi.number().integer().min(1).max(10).required(),
        category: Joi.string().valid('movies', 'music', 'games').required(),
        cachedData: Joi.object({
            posterUrl: Joi.string().uri().allow(''),
            year: Joi.number().integer().min(1900),
            artist: Joi.string().allow('').optional(),
            genres: Joi.array().items(Joi.string().trim()),
            rating: Joi.number().min(0).max(10),
            description: Joi.string().max(1000).allow('')
        }).optional()
    })).default([])
});

const listUpdateSchema = Joi.object({
    title: Joi.string().trim().max(100).optional(),
    category: Joi.string().valid('movies', 'music', 'games').optional(),
    description: Joi.string().max(500).allow('').optional(),
    isPublic: Joi.boolean().optional(),
    items: Joi.array().items(Joi.object({
        externalId: Joi.string().required(),
        title: Joi.string().required().trim().max(200),
        position: Joi.number().integer().min(1).max(10).required(),
        category: Joi.string().valid('movies', 'music', 'games').required(),
        cachedData: Joi.object({
            posterUrl: Joi.string().uri().allow(''),
            year: Joi.number().integer().min(1900),
            artist: Joi.string().allow('').optional(),
            genres: Joi.array().items(Joi.string().trim()),
            rating: Joi.number().min(0).max(10),
            description: Joi.string().max(1000).allow('')
        }).optional()
    })).optional()
});

const itemSchema = Joi.object({
    externalId: Joi.string().required(),
    title: Joi.string().required().trim().max(200),
    position: Joi.number().integer().min(1).max(10).required(),
    category: Joi.string().valid('movies', 'music', 'games').required(),
    cachedData: Joi.object({
        posterUrl: Joi.string().uri().allow(''),
        year: Joi.number().integer().min(1900),
        artist: Joi.string().allow('').optional(),
        genres: Joi.array().items(Joi.string().trim()),
        rating: Joi.number().min(0).max(10),
        description: Joi.string().max(1000).allow('')
    }).optional()
});

const commentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(500).required()
});

const profileUpdateSchema = Joi.object({
    displayName: Joi.string().trim().min(1).max(100).required()
});

// Middleware for validation
const validateList = (req, res, next) => {
    const { error } = listSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details[0].message
        });
    }
    next();
};

const validateListUpdate = (req, res, next) => {
    const { error } = listUpdateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details[0].message
        });
    }
    next();
}

const validateItem = (req, res, next) => {
    const { error } = itemSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details[0].message
        });
    }
    next();
};

const validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details[0].message
        });
    }
    next();
};

const validateProfileUpdate = (req, res, next) => {
    const { error } = profileUpdateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details[0].message
        });
    }
    next();
}

module.exports = {
    validateList,
    validateListUpdate,
    validateItem,
    validateComment,
    validateProfileUpdate
}