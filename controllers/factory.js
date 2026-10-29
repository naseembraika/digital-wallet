const create = async (Model, data) => {
  return await Model.create(data);
};

const find = async (Model, filter) => {
  return await Model.find(filter);
};

const findOne = async (Model, filter) => {
  return await Model.findOne(filter);
};

const findOneBySession = async (Model, filter, session) => {
  return await Model.findOne(filter).session(session);
};

module.exports = {
  create,
  find,
  findOne,
  findOneBySession,
};
