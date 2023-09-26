var _ = require('lodash')
const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return Object.values(blogs).reduce(((total, blog) => {return total + blog.likes}), 0)
}

const favoriteBlog = (blogs) => {
    return blogs.reduce((a, obj) => a.likes > obj.likes ? a : obj)
}

const mostBlogs = (blogs) => {
    const authorsWithCount = _.map(
        _.groupBy(blogs, 'author'), 
        (authorBlogs, author) => ({ author: author, blogs: authorBlogs.length })
    );
    console.log(authorsWithCount);

    return _.maxBy(authorsWithCount, 'blogs');
}

const mostLikes = (blogs) => {
const authorsWithLikes = _.map(
        _.groupBy(blogs, 'author'), 
        (authorBlogs, author) => ({
            author: author, 
            likes: _.sumBy(authorBlogs, 'likes')
        })
    );

    return _.maxBy(authorsWithLikes, 'likes');
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}