const mongoose = require("mongoose");

if (process.argv.length < 3) {
  console.log("give password as argument");
  process.exit(1);
}

const password = process.argv[2];

const url = `mongodb+srv://Fullstack:${password}@fullstackopen.yvhkeuh.mongodb.net/?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);
mongoose.connect(url);

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
});

const Blog = mongoose.model("Blog", blogSchema);

const blog = new Blog({
  title: "The Art of War",
  author: "Sun Tzu",
  url: "https://en.wikipedia.org/wiki/The_Art_of_War",
  likes: 100,
});

blog.save().then((result) => {
  console.log("blog saved!");
  mongoose.connection.close();
});

// Blog.find({}).then(result => {
//   result.forEach(blog => {
//     console.log(blog)
//   })
//   mongoose.connection.close()
// })
