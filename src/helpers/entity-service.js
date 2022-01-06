const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// provides crud methods for an entity saved to lowdb
module.exports = class EntityService {
  constructor(entity, dbPath = '/etc/data/db/db.json') {
    this.entity = entity;

    const adapter = new FileSync(dbPath);
    this.db = low(adapter);
  }

  get() {
    return this.db.get(this.entity).value();
  }

  getById(id) {
    id = parseInt(id);
    return this.db.get(this.entity).find({ id }).value();
  }

  create(obj) {
    return this.db.get(this.entity).push(obj).write();
  }

  update(id, obj) {
    id = parseInt(id);
    return this.db.get(this.entity).find({ id }).assign(obj).write();
  }

  delete(id) {
    id = parseInt(id);
    return this.db.get(this.entity).remove({ id }).write();
  }
};
