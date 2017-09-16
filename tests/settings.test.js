/* eslint no-undef:off */
const assert = require('chai').assert;
const nock = require('nock');
const request = require('./requests.js')
const DB = require('../database/database');

// Start the app
const server = require('../app.js'); // eslint-disable-line
const accessToken = 'access_token';

describe('Integration setting tests', () => {
  let response;

  // Leave the database in a valid state
  beforeEach((done) => {
    DB.drop()
		.then(done)
		.catch(done);
  });

  describe('get Settings', () => {
    describe('When the user is not login', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
      })
      beforeEach(() => (response = request.getSettings('access_token')));

      it('should return not found', () => response
        .then((res) => {
          assert.equal(res.status, 404);
          assert.equal(res.response.body.message, 'user is not login');
          assert.equal(res.message, 'Not Found');
        }));
    });

    describe('When the user exists', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
        return DB.initialize({ settings: [userSetting] })
      })
      beforeEach(() => (response = request.getSettings('access_token')));

      it('should return the settings', () => response
        .then((res) => {
          const resultSet = formatDBResponse(res.body);

          assert.equal(res.status, 200);
          assert.deepEqual(resultSet, userSetting);
        }));
    });
  });

  describe('update Settings', () => {
    describe('When the user is not login', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
      })
      beforeEach(() => (response = request.updateSettings('access_token', updateParams)));

      it('should return not found', () => response
        .then((res) => {
          assert.equal(res.status, 404);
          assert.equal(res.response.body.message, 'user is not login');
          assert.equal(res.message, 'Not Found');
        }));
    });

    describe('When the user exists', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
        return DB.initialize({ settings: [userSetting] })
      })
      beforeEach(() => (response = request.updateSettings('access_token', updateParams)));

      it('should return the updated settings', () => response
        .then((res) => {
          resultSet = Object.assign({}, formatDBResponse(res.body), userSetting);

          assert.equal(res.status, 200);
          assert.deepEqual(resultSet, userSetting);
        }));
    });
  });
});

const formatDBResponse = (dbResponse) => {
  const result = dbResponse;
  delete result.__v;
  delete result._id;

  return result;
}

const nockProfile = (params, accessToken, response) => {
  let paramsToSearch = '';
  for (const prop of params) {
    paramsToSearch = paramsToSearch.concat(prop).concat('%2C');
  }
  paramsToSearch = paramsToSearch.slice(0, -3);

  return nock('https://graph.facebook.com')
    .get(`/v2.3/me?fields=${paramsToSearch}&access_token=${accessToken}`)
    .reply(200, response);
}

const userSetting = {
  id: 'id',
  ageRange: {
    min: 18,
    max: 29
  },
  distRange: {
    min: 1,
    max: 3
  },
  invisible: true,
  interestType: 'male'
}

const updateParams = {
  ageRange: {
    min: 18,
    max: 32
  },
  distRange: {
    min: 1,
    max: 500
  },
  invisible: false,
  interestType: 'female'
}