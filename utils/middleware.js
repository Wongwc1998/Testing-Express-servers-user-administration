const logger = require("./logger");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Body:  ", request.body);
  logger.info("---");
  next();
};

const unknownEndpoint = (request, response) => {
  logger.error("Unknown endpoint:", request.path);
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "JsonWebTokenError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

const tokenExtractor = (request, response, next) => {
  // code that extracts the token
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    request.token = authorization.substring(7);
  } else {
    request.token = null;
  }

  next();
};

const userExtractor = async (request, response, next) => {
  const authorization = request.get("authorization");

  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.substring(7);
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET);
      if (!decodedToken.id) {
        return response.status(401).json({ error: "Token missing or invalid" });
      }
      const user = await User.findById(decodedToken.id);
      if (!user) {
        return response
          .status(401)
          .json({ error: "Token associated user not found" });
      }
      request.user = user;
    } catch (error) {
      logger.error("Error extracting user:", error);
      if (request.method !== "GET") {
        return response
          .status(401)
          .json({ error: "Token verification failed" });
      }
    }
  } else if (request.method !== "GET") {
    // Make token mandatory for non-GET requests
    return response.status(401).json({ error: "Token missing" });
  }
  
  next();
};


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
