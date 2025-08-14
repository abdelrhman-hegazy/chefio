const BaseRepository = require("./base.repository");
const Category = require("../models/CategoryModel");
class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

}
module.exports = new CategoryRepository();