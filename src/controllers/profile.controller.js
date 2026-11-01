import ProfileModel from '../models/user.model.js';

const PROFILE_FIELDS = new Set([
    'full_name',
    'date_of_birth',
    'occupation',
    'number_of_dependents',
    'monthly_income'
]);

const isValidUserId = (id) => {
    if (!/^[1-9]\d*$/.test(id)) {
        return false;
    }
    if (String(req.user.id) !== String(id)) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập hồ sơ của người khác' });
    }

    return BigInt(id) <= 18446744073709551615n;
};

const isValidDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (year < 1000) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

const validateChanges = (body) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be a JSON object';
    }

    const entries = Object.entries(body);
    if (entries.length === 0) {
        return 'At least one profile field is required';
    }

    if (entries.some(([field]) => !PROFILE_FIELDS.has(field))) {
        return 'Request contains an unsupported profile field';
    }

    for (const [field, value] of entries) {
        if (field === 'full_name'
            && (typeof value !== 'string' || value.trim().length === 0 || value.length > 100)) {
            return 'full_name must be a non-empty string of at most 100 characters';
        }

        if (field === 'date_of_birth' && value !== null && !isValidDate(value)) {
            return 'date_of_birth must be a valid YYYY-MM-DD date or null';
        }

        if (field === 'occupation'
            && value !== null
            && (typeof value !== 'string' || value.length > 100)) {
            return 'occupation must be a string of at most 100 characters or null';
        }

        if (field === 'number_of_dependents'
            && (!Number.isInteger(value) || value < 0 || value > 255)) {
            return 'number_of_dependents must be an integer between 0 and 255';
        }

        if (field === 'monthly_income'
            && (typeof value !== 'number'
                || !Number.isFinite(value)
                || value < 0
                || value > 9999999999999.99
                || Number(value.toFixed(2)) !== value)) {
            return 'monthly_income must be a non-negative number with at most two decimal places';
        }
    }

    return null;
};

export const getMyProfile = async (req, res) => {
    if (!isValidUserId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }

    try {
        const profile = await ProfileModel.getProfile(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ data: profile });
    } catch (error) {
        console.error('Failed to get profile:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateMyProfile = async (req, res) => {
    if (!isValidUserId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user id' });
    }

    const validationError = validateChanges(req.body);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    try {
        await ProfileModel.updateProfile(req.params.id, req.body);
        const profile = await ProfileModel.getProfile(req.params.id);
        if (!profile) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            data: profile
        });
    } catch (error) {
        console.error('Failed to update profile:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
