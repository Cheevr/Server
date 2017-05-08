let config = require('@cheevr/config');
let Database = require('@cheevr/database');

class User {
    /**
     *
     * @param {object} props
     */
    constructor(props) {
        for (let prop of props) {
            this['_' + prop] = props[prop];
            Object.defineProperty(this, prop, {get: () => this['_' + prop]})
        }
        this._db = Database.factory(config.users.database.instance);
    }

    /**
     * Loads any additional values that may be stored in the database. This may include a permissions object on the user.
     */
    async load() {
        if (!this.id) {
            throw new Error('Unable to retrieve user from database without user id');
        }
        let response = await this._db.get({
            index: config.users.database.index,
            type: 'users',
            id: this.id
        });
        for (let prop of response._source) {
            this['_' + prop] = response._source[prop];
            Object.defineProperty(this, prop, {get: () => this['_' + prop]})
        }
        return this;
    }
}

module.exports = User;
