const mongoose = require('mongoose')

if (process.argv.length<3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url =
  `mongodb+srv://fullstack:${password}@cluster0.o1opl.mongodb.net/?retryWrites=true&w=majority`

mongoose.set('strictQuery',false)
mongoose.connect(url)

const blogSchema = new mongoose.Schema({
  content: String,
  date: Date,
  important: Boolean,
})

const Blog = mongoose.model('Blog', blogSchema)

const blog = new Blog({
  content: 'Mongoose makes things easy',
  date: new Date(),
  important: true,
})

/*
blog.save().then(result => {
  console.log('blog saved!')
  mongoose.connection.close()
})
*/

Blog.find({}).then(result => {
  result.forEach(blog => {
    console.log(blog)
  })
  mongoose.connection.close()
})