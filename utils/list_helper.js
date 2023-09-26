const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return Object.values(blogs).reduce(((total, blog) => {return total + blog.likes}), 0)
}

const favoriteBlog = (blogs) => {
    return 0
}

const mostBlogs = (blogs) => {
    return 0
}

const mostLikes = (blogs) => {
    return 0
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}