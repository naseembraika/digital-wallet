const create = async (Model, data) => {
  return await Model.create(data);
};

const createBySession = async (Model, data, session) => {
  return await Model.create([data], { session });
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

const findOneAndUpdateBySession = async (Model, filter, update, session) => {
  return await Model.findOneAndUpdate(filter, update, {
    returnDocument: 'after',
  }).session(session);
};

module.exports = {
  create,
  createBySession,
  find,
  findOne,
  findOneBySession,
  findOneAndUpdateBySession,
};
