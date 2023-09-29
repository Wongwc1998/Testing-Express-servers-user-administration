const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const logger = require("../utils/logger");

const jwt = require("jsonwebtoken");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (blog) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});

blogsRouter.post("/", async (request, response) => {
  logger.info("Request to post a blog received.");
  const body = request.body;
  const user = request.user
  logger.info({ user });

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  });

  logger.info({ blog });
  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save(); // This line is important

  logger.info("Blog saved successfully.");
  response.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
  //a blog can be deleted only by the user who added the blog
  //get blog
  const blog = await Blog.findById(request.params.id);
  //get userid
  const user = request.user
  const userid = user._id
  //compare userid with blog.user
  if (blog.user.toString() === userid.toString()) {
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    response.status(401).end();
  }
  // await Blog.findByIdAndRemove(request.params.id);
  // response.status(204).end();
});

blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;

  const newBlog = {
    author: body.author,
    title: body.title,
    url: body.url,
    likes: body.likes,
  };

  await Blog.findByIdAndUpdate(request.params.id, newBlog, { new: true });
  response.status(200).end();
});

module.exports = blogsRouter;
