class ValidationUtils {
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static isValidAmount(amount) {
        return typeof amount === 'number' && !isNaN(amount);
    }

    static sanitizeDescription(description) {
        return description.trim().replace(/[<>]/g, '');
    }
}

module.exports = ValidationUtils;
