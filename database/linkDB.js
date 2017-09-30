const mongoose = require('mongoose')
const _ = require('lodash');

//  Link Schema
const LinkSchema = mongoose.Schema({
  sendUID: {
    type: String
  },
  recUID: {
    type: String
  },
  action: {
    type: String // link, super-link, reject, block, report
  }
})

// eslint-disable-next-line
const Link = module.exports = mongoose.model('Link', LinkSchema)

module.exports.create = function (link) {
  const query = { sendUID: link.sendUID, recUID: link.recUID };

  return Link.findOne(query)
    .then((resp) => {
      const promise = link.save();
      if (resp) {
        promise.then(() => Link.remove({ _id: resp.__id }))
      }
      return promise;
    })
}

module.exports.existsLink = function (userId1, userId2) {
  const query = { $or: [
    { sendUID: userId1, recUID: userId2, action: 'link' },
    { sendUID: userId2, recUID: userId1, action: 'link' }
  ]}

  return Link.find(query)
    .then((res) => (res.length === 2))
}

module.exports.getLinks = function (userId) {
  const sendQuery = { sendUID: userId, action: 'link' }; // TOD0: SUPERLINK, LO HARIA CON LINK Y QUE SUPERLINK SOLO MANDE NOTIF

  return Link.find(sendQuery)
    .then((links) => { // filter by links
      const recQuery = links.map((link) => ({ sendUID: link.recUID, recUID: userId, action: 'link' }));

      return recQuery.length ? Link.find({ $or: recQuery }).sort({ __v: 1 }) : [];
    })
}

module.exports.deleteLink = function (id, userId) {
  const query = { $or: [
    { sendUID: userId, recUID: id, action: 'link' },
    { sendUID: id, recUID: userId, action: 'link' }
  ]}

  return Link.remove(query);
}

module.exports.search = function (params) {
  const query = _.pick(params, ['sendUID', 'recUID', 'action']);

  return Link.find(query);
}