/* eslint no-undef:off */
const assert = require('chai').assert;
const nock = require('nock');
const request = require('./requests.js')
const DB = require('../database/database');

// Start the app
const server = require('../app.js'); // eslint-disable-line
const accessToken = 'access_token';

describe('Integration user tests', () => {
  let response;

  // Leave the database in a valid state
  beforeEach((done) => {
    DB.drop()
		.then(done)
		.catch(done);
  });

  describe('get Profile', () => {
    describe('When the user is not login', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
      })
      beforeEach(() => (response = request.getProfile('access_token')));

      it('should return not found', () => response
        .then((res) => {
          assert.equal(res.status, 404);
          assert.equal(res.response.body, 'user is not login');
          assert.equal(res.message, 'Not Found');
        }));
    });

    describe('When the user exists', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
        return DB.initialize([userProfile])
      })
      beforeEach(() => (response = request.getProfile('access_token')));

      it('should return the profile', () => response
        .then((res) => {
          const resultProf = res.body;
          delete resultProf.__v;
          delete resultProf._id;

          assert.equal(res.status, 200);
          assert.deepEqual(resultProf, userProfile);
        }));
    });
  });

  describe('update Profile', () => {
    describe('When the user is not login', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
      })
      beforeEach(() => (response = request.updateProfile('access_token', updateParams)));

      it('should return not found', () => response
        .then((res) => {
          assert.equal(res.status, 404);
          assert.equal(res.response.body, 'user is not login');
          assert.equal(res.message, 'Not Found');
        }));
    });

    describe('When the user exists', () => {
      beforeEach(() => {
        nockProfile(['id'], accessToken, { id: 'id' })
        return DB.initialize([userProfile])
      })
      beforeEach(() => (response = request.updateProfile('access_token', updateParams)));

      it('should return the updated profile', () => response
        .then((res) => {
          let resultProf = res.body;
          delete resultProf.__v;
          delete resultProf._id;
          resultProf = Object.assign({}, resultProf, userProfile)

          assert.equal(res.status, 200);
          assert.deepEqual(resultProf, userProfile);
        }));
    });
  });
});

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

const userProfile = {
  id: 'id',
  name: 'name',
  description: 'alta descripcion',
  photos: [
    'foto 1',
    'foto 2'
  ],
  photo: 'foto 1',
  education: 'High School',
  birthday: '08/13/1993',
  gender: 'male',
  interests: [
    'racing',
    'fiuba'
  ],
  work: 'work description'
}

const updateParams = {
  photo: 'up foto',
  photos: [
    'up foto',
    'up foto'
  ],
  description: 'descr'
}
