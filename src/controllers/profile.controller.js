import ProfileModel from '../models/user.model.js';

const PROFILE_FIELDS = new Set([
    'full_name',
    'date_of_birth',
    'occupation',
    'number_of_dependents',
    'monthly_income'
]);

const isValidUserId = (id) => {
    const userId = String(id);
    if (!/^[1-9]\d*$/.test(userId)) {
        return false;
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
        return 'Request body phải là một object JSON';
    }

    const entries = Object.entries(body);
    if (entries.length === 0) {
        return 'ít nhất một trường hợp lệ là bắt buộc';
    }

    if (entries.some(([field]) => !PROFILE_FIELDS.has(field))) {
        return 'Request body chỉ được chứa các trường: full_name, date_of_birth, occupation, number_of_dependents, monthly_income';
    }

    for (const [field, value] of entries) {
        if (field === 'full_name'
            && (typeof value !== 'string' || value.trim().length === 0 || value.length > 100)) {
            return 'full_name phải là một chuỗi không rỗng, tối đa 100 ký tự';
        }

        if (field === 'date_of_birth' && value !== null && !isValidDate(value)) {
            return 'date_of_birth phải là một chuỗi ngày hợp lệ theo định dạng YYYY-MM-DD hoặc null';
        }

        if (field === 'occupation'
            && value !== null
            && (typeof value !== 'string' || value.length > 100)) {
            return 'occupation phải là một chuỗi tối đa 100 ký tự hoặc null';
        }

        if (field === 'number_of_dependents'
            && (!Number.isInteger(value) || value < 0 || value > 255)) {
            return 'number_of_dependents phải là một số nguyên không âm, tối đa 255';
        }

        if (field === 'monthly_income'
            && (typeof value !== 'string'
                || !/^(0|[1-9]\d{0,12})(\.\d{1,2})?$/.test(value))) {
            return 'monthly_income phải là chuỗi số không âm, tối đa 13 chữ số trước dấu thập phân và tối đa 2 chữ số sau dấu thập phân';
        }
    }

    return null;
};

export const getMyProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidUserId(userId)) {
        return res.status(401).json({ status: 'false', message: 'Token không chứa ID người dùng hợp lệ' });
    }

    try {
        const profile = await ProfileModel.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        return res.status(200).json({ data: profile });
    } catch (error) {
        console.error('Failed to get profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

export const updateMyProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!isValidUserId(userId)) {
        return res.status(401).json({ status: 'false', message: 'Token không chứa ID người dùng hợp lệ' });
    }

    const validationError = validateChanges(req.body);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    try {
        await ProfileModel.updateProfile(userId, req.body);
        const profile = await ProfileModel.getProfile(userId);
        if (!profile) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        return res.status(200).json({
            message: 'Hồ sơ đã được cập nhật thành công',
            data: profile
        });
    } catch (error) {
        console.error('Failed to update profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};
