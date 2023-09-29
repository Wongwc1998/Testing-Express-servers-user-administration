const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const jwt = require("jsonwebtoken");

const api = supertest(app);

const Blog = require("../models/blog");
const User = require("../models/user");
const helper = require("./test_helper");

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const userObjects = helper.initialUsers.map((user) => new User(user));
  const promiseArrayUsers = userObjects.map((user) => user.save());
  await Promise.all(promiseArrayUsers);

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
  const promiseArrayBlogs = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArrayBlogs);
}, 30000);

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("all blogs are returned", async () => {
  const response = await api.get("/api/blogs");

  expect(response.body).toHaveLength(helper.initialBlogs.length);
});

test("a specific blog is within the returned blogs", async () => {
  const response = await api.get("/api/blogs");

  const titles = response.body.map((r) => r.title);

  expect(titles).toContain("React patterns");
});

test("a valid blog can be added ", async () => {
  const user = await User.findOne({ username: "MichaelChan" });
  if (!user) {
    throw new Error("User MichaelChan not found in database");
  }
  const userForToken = {
    username: user.username,
    id: user.id,
  };
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });

  const newBlog = {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0,
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

  const titles = blogsAtEnd.map((n) => n.title);
  expect(titles).toContain("Type wars");
});

test("a blog cannot be added without a token", async () => {
  const newBlog = {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0,
  };

  await api.post("/api/blogs").send(newBlog).expect(401);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);

  const titles = blogsAtEnd.map((n) => n.title);
  expect(titles).not.toContain("Type wars");
});

test("blog default likes is 0 ", async () => {
  const user = await User.findOne({ username: "MichaelChan" });
  if (!user) {
    throw new Error("User MichaelChan not found in database");
  }
  const userForToken = {
    username: user.username,
    id: user.id,
  };
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  await Blog.deleteMany({});
  const newBlogWithoutLikes = {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    __v: 0,
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlogWithoutLikes)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();

  const likes = blogsAtEnd[0].likes;
  expect(likes).toBe(0);
});

test("the unique identifier property of the blog posts is named _id", async () => {
  const response = await api.get("/api/blogs");
  console.log(response.body);
  const ids = response.body.map((r) => r.id);
  console.log(ids);
  ids.forEach((id) => {
    expect(id).toBeDefined();
  });
});

test("blog without title or url is not added", async () => {
  const user = await User.findOne({ username: "MichaelChan" });
  if (!user) {
    throw new Error("User MichaelChan not found in database");
  }
  const userForToken = {
    username: user.username,
    id: user.id,
  };
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  const newBlogWithoutTitle = {
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
  };
  const newBlogWithoutUrl = {
    title: "Type wars",
    author: "Robert C. Martin",
  };

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlogWithoutTitle)
    .expect(400);

  await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlogWithoutUrl)
    .expect(400);

  const blogsAtEnd = await helper.blogsInDb();

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
});

test("a specific blog can be viewed", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const usersAtStart = await helper.usersInDb();
  console.log(usersAtStart);

  const blogToView = blogsAtStart[0];
  const userForBlog = usersAtStart.find(
    (user) => user.id === blogToView.user.toString()
  );
  blogToView.user = userForBlog;

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(helper.omitUser(resultBlog.body)).toEqual(expect.objectContaining(helper.omitUser(blogToView)));
});

test("a blog can be deleted only by the user who added the blog", async () => {
  // Create and save a user
  const newUser = new User({
    username: "JohnDoe",
    name: "John Doe",
  });
  const savedUser = await newUser.save();

  // Create a blog using the saved user's id
  const newBlog = new Blog({
    title: "Test Blog",
    author: "John Doe",
    user: savedUser._id,
    url: "Test Url",
    likes: 7,
  });
  const savedBlog = await newBlog.save();

  // Generate a JWT for the saved user
  const userForToken = {
    username: savedUser.username,
    id: savedUser._id,
  };
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });

  // Delete the blog using the generated JWT
  await api
    .delete(`/api/blogs/${savedBlog._id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  // Verify the blog has been deleted
  const blogsAtEnd = await helper.blogsInDb();
  const titles = blogsAtEnd.map((r) => r.title);
  expect(titles).not.toContain(savedBlog.title);
});


test("a blog cannot be deleted by other users", async () => {
  const user = await User.findOne({ username: "RobertCMartin" });
  const userForToken = {
    username: user.username,
    id: user.id,
  };
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  const blogsAtStart = await helper.blogsInDb();
  const blogToDelete = blogsAtStart[0];

  await api.
  delete(`/api/blogs/${blogToDelete.id}`).
  set("Authorization", `Bearer ${token}`).
  expect(401)

  const blogsAtEnd = await helper.blogsInDb();

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);

  const titles = blogsAtEnd.map((r) => r.title);

  expect(titles).toContain(blogToDelete.title);
});

test("a blog can be updated", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const UpdatedBlog = {
    _id: "1",
    title: "New Title",
    author: "New Author",
    url: "New Url",
    likes: 0,
    __v: 0,
  };
  const blogToUpdate = blogsAtStart[0];
  console.log(blogToUpdate);

  await api.put(`/api/blogs/${blogToUpdate.id}`).send(UpdatedBlog).expect(200);

  const blogsAtEnd = await helper.blogsInDb();
  console.log(blogsAtEnd);

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);

  const titles = blogsAtEnd.map((r) => r.title);

  expect(titles).not.toContain(blogToUpdate.title);
  expect(titles).toContain(UpdatedBlog.title);
});

test("each blog contains information on the creator of the blog", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToView = blogsAtStart[0];
  console.log(blogToView);

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(resultBlog.body.user).toBeDefined();
});

afterAll(async () => {
  await mongoose.connection.close();
});
