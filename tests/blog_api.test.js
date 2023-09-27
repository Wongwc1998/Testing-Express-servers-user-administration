const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')
const helper = require('./test_helper')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
}, 30000)

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  expect(titles).toContain(
    'React patterns'
  )
})


test('a valid blog can be added ', async () => {
  const newBlog = {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map(n => n.title)
  expect(titles).toContain(
    'Type wars'
  )
})

test('blog default likes is 0 ', async () => {
  await Blog.deleteMany({})
  const newBlogWithoutLikes = {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    __v: 0
  }

  await api
    .post('/api/blogs')
    .send(newBlogWithoutLikes)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  const likes = blogsAtEnd[0].likes
  expect(likes).toBe(0)
})

test('the unique identifier property of the blog posts is named _id', async () => {
  const response = await api.get('/api/blogs')
  console.log(response.body)
  const ids = response.body.map(r => r.id)
  console.log(ids)
    ids.forEach(id => {
    expect(id).toBeDefined()
  });
})


test('blog without title or url is not added', async () => {
  const newBlogWithoutTitle = {
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
  }
  const newBlogWithoutUrl = {
    title: "Type wars",
    author: "Robert C. Martin",
  }

  await api
    .post('/api/blogs')
    .send(newBlogWithoutTitle)
    .expect(400)

  await api
    .post('/api/blogs')
    .send(newBlogWithoutUrl)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  //const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

  expect(resultBlog.body).toEqual(blogToView)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(
    helper.initialBlogs.length - 1
  )

  const titles = blogsAtEnd.map(r => r.title)

  expect(titles).not.toContain(blogToDelete.title)
})
test('a blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const UpdatedBlog = {
    _id: "1",
    title: "New Title",
    author: "New Author",
    url: "New Url",
    likes: 0,
    __v: 0
  }
  const blogToUpdate = blogsAtStart[0]
  console.log(blogToUpdate)

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(UpdatedBlog)
    .expect(200)

  const blogsAtEnd = await helper.blogsInDb()
  console.log(blogsAtEnd)

  expect(blogsAtEnd).toHaveLength(
    helper.initialBlogs.length
  )

  const titles = blogsAtEnd.map(r => r.title)

  expect(titles).not.toContain(blogToUpdate.title)
  expect(titles).toContain(UpdatedBlog.title)
})

afterAll(async () => {
  await mongoose.connection.close()
})