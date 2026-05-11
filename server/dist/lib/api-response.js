export const errorResponse = (res, status, code, message, details) => {
    // One shared error shape keeps API responses predictable for clients.
    const payload = {
        error: {
            code,
            message,
        },
    };
    if (details !== undefined) {
        payload.error.details = details;
    }
    return res.status(status).json(payload);
};
//# sourceMappingURL=api-response.js.map