const User = require('./user');

module.exports = app => {
    app.use((req, res, next) => {
        req.user && (req.user = new User(req.user));
        next();
    });
};