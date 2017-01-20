class User {
    /**
     *
     * @param {object} props
     */
    constructor(props) {
        for (let prop of ['id', 'email', 'token', 'firstname', 'lastname', 'fullname']) {
            Object.defineProperty(this, prop, { get: () => this._load(prop) });
        }
        for (let prop of props) {
            this['_' + prop] = props[prop];
        }
    }

    /**
     * Returns true or false depending on whether the user has the given permission.
     * @param name
     */
    permission(name) {
        // TODO
    }

    /**
     * Loads the properties of the user from database.
     * @private
     */
    _load(prop) {
        if (this['_' + prop]) {
            return this['_' + prop];
        }
        // TODO async load from ES
    }
}

module.exports = User;