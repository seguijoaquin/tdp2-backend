const geolib = require('geolib');
const LinkDB = require('../database/linkDB');
const UsersDB = require('../database/usersDB');
const SettingsDB = require('../database/settingDB');
const DenouncesDB = require('../database/denouncesDB');
const faceAPI = require('../clients/faceAPI');
const firebaseAPI = require('../clients/firebaseAPI');
const usersService = require('./usersService');

const MAX_CANDIDATES = 5;
const INITIAL_DENOUNCE_STATUS = 'pendiente';
const LINK_ACTION = 'link';
const BLOCK_ACTION = 'block';
const REPORT_ACTION = 'report';
const SUPER_LINK_ACTION = 'super-link';

/**
 * Get Candidates.
 *
 */
module.exports.getCandidates = (accessToken, userId) => {
  return Promise.resolve(userId ? { id: userId } : faceAPI.getProfile(accessToken, ['id']))
    .then((fbProfile) => usersService.get(accessToken, fbProfile.id))
    .then((user) => {
      const paramsToSearch = filterParamsToSearch(user);

      return Promise.all([
        UsersDB.search(paramsToSearch),
        SettingsDB.search(paramsToSearch),
        LinkDB.search({ sendUID: user.profile.id }),
        LinkDB.search({ recUID: user.profile.id, action: BLOCK_ACTION }),
        LinkDB.search({ recUID: user.profile.id, action: REPORT_ACTION }),
        user
        // TOD0: new people
      ])
    })
    .then(([candByProf, candBySet, noCandByLink, blockedUsers, reportedUsers, user]) => {
      return filterCandidates(candByProf, candBySet, noCandByLink.concat(blockedUsers).concat(reportedUsers), user)
    })
    .then((candidates) => {
      const parsedCandidates = candidates.map((candidate) => candidate); // (_.omit(candidate._doc, ['photos']
      return parsedCandidates.splice(0, MAX_CANDIDATES);
    })
}

/**
 * Add action to user
 *
 */
module.exports.addAction = (accessToken, userIdTo, body) => {
  return faceAPI.getProfile(accessToken, ['id'])
    .then(({ id }) => {
      return Promise.all([
        UsersDB.get(id),
        UsersDB.get(userIdTo)
      ])
      .then(([u1, u2]) => (u1 && u2 ? [u1, u2] : Promise.reject({ status: 404, message: 'user does not exist' })))
      .then(([u1, u2]) => {
        const newLink = new LinkDB({ sendUID: id, recUID: userIdTo, action: body.action });
        if (body.action === LINK_ACTION) {
          return onLinkAction(id, userIdTo, newLink);
        } else if (body.action === SUPER_LINK_ACTION) {
          return onSuperLinkAction(id, userIdTo, newLink);
        } else if (body.action === BLOCK_ACTION) {
          return LinkDB.create(newLink).then(() => onBlockAction(id, userIdTo));
        } else if (body.action === REPORT_ACTION) {
          return LinkDB.create(newLink).then(() => onReportAction(u1, u2, body.message));
        } else {
          return LinkDB.create(newLink);
        }
      })
    })
}

const onLinkAction = (id, userIdTo, newLink) => {
  return SettingsDB.get(id)
    .then((settings) => settings.interestType)
    .then((interestType) => {
      newLink.type = interestType;
      return LinkDB.create(newLink);
    })
    .then(() => LinkDB.existsLink(id, userIdTo))
    .then((existsLink) => {
      return (existsLink) ?
        Promise.resolve({ link: true }) : // coming soon --> Notification
        Promise.resolve({ link: false })
    })
}

const onSuperLinkAction = (id, userIdTo, newSuperLink) => {
  const newLink = new LinkDB({ sendUID: id, recUID: userIdTo, action: LINK_ACTION });

  return SettingsDB.get(id)
    .then((settings) => {
      const superLinksCount = settings.superLinksCount;
      const settingsToUpdate = { id, superLinksCount: superLinksCount - 1 };

      return (superLinksCount > 0) ?
        SettingsDB.updateSetting(settingsToUpdate) :
        Promise.reject({ status: 409, message: 'you have not more super links for today' })
    })
    .then(() => LinkDB.create(newSuperLink))
    .then(() => onLinkAction(id, userIdTo, newLink))
}

const onBlockAction = (id, userIdTo) => {
  return LinkDB.deleteLink(id, userIdTo).then(() => ({})); // coming soon --> Notification
  // or delete not BLOCK ? TOD0
}

// eslint-disable-next-line
const onReportAction = (user, userTo, message = 'No message') => {
  const params = {
    message,
    recUID: userTo.id,
    sendUID: user.id,
    recUName: userTo.name,
    sendUName: user.name,
    status: INITIAL_DENOUNCE_STATUS
  }
  const newDenounce = new DenouncesDB(params);

  return LinkDB.deleteLink(user.id, userTo.id)
    .then(() => DenouncesDB.create(newDenounce))
    .then(() => ({})); // coming soon --> Notification
}

/**
 * Get Links
 *
 */
module.exports.getLinks = (accessToken) => {
  return faceAPI.getProfile(accessToken, ['id'])
    .then(({ id }) => LinkDB.getLinks(id))
    .then((userLinks) => {
      const userIds = [];
      const userTypes = {};
      for (const user of userLinks) {
        userIds.push(user.sendUID);
        userTypes[user.sendUID] = user.type;
      }
      return UsersDB.getUsers(userIds)
        .then((up) => (up.map((prof) => (Object.assign({}, prof, { type: userTypes[prof.id] })))))
    })
}

const filterParamsToSearch = (user) => {
  return {
    id: user.profile.id,
    age: user.profile.age,
    gender: user.profile.gender,
    interests: user.profile.interests,
    ageRange: user.settings.ageRange,
    distRange: user.settings.distRange,
    invisible: user.settings.invisible,
    interestType: user.settings.interestType,
    location: user.profile.location
  };
}

/**
 * Delete Link
 *
 */
module.exports.deleteLink = (accessToken, userId) => {
  return faceAPI.getProfile(accessToken, ['id'])
    .then(({ id }) => (LinkDB.deleteLink(id, userId)
    .then(() => firebaseAPI.deleteConversation(id, userId))));
}

const filterCandidates = (candByProf, candBySet, noCandByLink, user) => {
  return candByProf.filter((cand) => {
    const doMatchLinked = noCandByLink.filter(($cand) => ($cand.recUID === cand.id || $cand.sendUID === cand.id)).length > 0;

    if (doMatchLinked || cand.id === user.profile.id) {
      return false;
    }
    return candBySet.filter(($cand) => ($cand.id === cand.id)).length > 0
  })
  .map((cand) => (Object.assign({}, cand, { distance: calculateDistance(user.profile.location, cand.location) })))
}

const calculateDistance = (location1, location2) => {
  const distance = geolib.getDistance(
    {latitude: location1[1], longitude: location1[0] },
    {latitude: location2[1], longitude: location2[0] }
  )

  return Math.round(distance / 1000);
}
