class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }
  async findById(id) {
    return this.model.findById(id);
  }
  async findOne(query) {
    return this.model.findOne(query);
  }
  async findAll(query = {}) {
    return this.model.find(query);
  }
  async updateById(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
  async deleteMany(data) {
    return this.model.deleteMany(data);
  }
  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
  async saveModel(model) {
    return model.save();
  }
  async countDocuments(query = {}) {
    return this.model.countDocuments(query);
  }
 
}

module.exports = BaseRepository;
