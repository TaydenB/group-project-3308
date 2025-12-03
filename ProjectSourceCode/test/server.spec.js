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

describe('Testing Friend Requests', () => {
  const userA = randomString(10);
  const userB = randomString(10);
  const password = "password";

  // Register users
  before(async () => {
    await chai.request(server).post('/register').send({ username: userA, password });
    await chai.request(server).post('/register').send({ username: userB, password });
  });

  it('Send friend request', async () => {
    const agentA = chai.request.agent(server);
    await agentA.post('/login').send({ username: userA, password });

    // Send friend request
    const res = await agentA.post('/profile/social/requests/sent').send({ add_friend: userB });

    expect(res).to.have.status(201);
    expect(res.text).to.include("Friend request sent successfully");
    agentA.close();
  });

  it('See if friend request exists', async () => {
    const agentB = chai.request.agent(server);
    await agentB.post('/login').send({ username: userB, password });

    // Check incoming friend requests
    const res = await agentB.get('/profile/social/requests');

    expect(res).to.have.status(200);
    expect(res.text).to.include(userA);
    agentB.close();
  });

  it('Accept friend requests', async () => {
    const agentB = chai.request.agent(server);
    await agentB.post('/login').send({ username: userB, password });

    const res = await agentB.post('/profile/social/requests/accept').send({ friend_username: userA });

    expect(res).to.have.status(201);
    expect(res.text).to.include("Request Accepted");
    agentB.close();
  });
});
// ********************************************************************************