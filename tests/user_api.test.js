const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

const User = require("../models/user");
const helper = require("./test_helper");

beforeEach(async () => {
  await User.deleteMany({});
  await User.insertMany(helper.initialUsers);
}, 30000);

test("users are returned as json", async () => {
  await api
    .get("/api/users")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("all users are returned", async () => {
  const response = await api.get("/api/users");

  expect(response.body).toHaveLength(helper.initialUsers.length);
});

test("a specific user is within the returned users", async () => {
  const response = await api.get("/api/users");

  const usernames = response.body.map((r) => r.username);

  expect(usernames).toContain("MichaelChan");
});

test("a valid user can be added ", async () => {
  const newUser = {
    username: "Johndoe",
    name: "John Doe",
    passwordHash: "hashed_password_1",
  };

  await api
    .post("/api/users")
    .send(newUser)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const usersAtEnd = await helper.usersInDb();
  expect(usersAtEnd).toHaveLength(helper.initialUsers.length + 1);

  const usernames = usersAtEnd.map((n) => n.username);
  expect(usernames).toContain("Johndoe");
});

test("user with username or password lesser than 3 characters is not added", async () => {
  const newUserWithShortUsername = {
    username: "Jo",
    name: "John Doe",
    passwordHash: "hashed_password_1",
  };
  const newUserWithShortPassword = {
    username: "Johndoe",
    name: "John Doe",
    passwordHash: "ha",
  };

  await api
    .post("/api/users")
    .send(newUserWithShortUsername)
    .expect(400)
    .expect("Content-Type", /application\/json/);
  await api
    .post("/api/users")
    .send(newUserWithShortPassword)
    .expect(400)
    .expect("Content-Type", /application\/json/);

  const usersAtEnd = await helper.usersInDb();
  expect(usersAtEnd).toHaveLength(helper.initialUsers.length);
});

test("each user contains information on their blogs", async () => {
  const response = await api.get("/api/users");

  const users = response.body;
  const user = users[0];
  expect(user.blogs).toBeDefined();
});

afterAll(async () => {
  await mongoose.connection.close();
});
