// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
function randomString(length) {
  return Math.random().toString(36).substring(2, 2 + length);
}
describe('Testing Register New User', () => {
  const str = randomString(20);
  it('Registers new user', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: str, password: "password" })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.text).to.include("Account created successfully!");
        done();
      });
  });

  it('Fail registration', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: str, password: "password" })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.include("Username already exists");
        done();
      });
  });
});

// ********************************************************************************