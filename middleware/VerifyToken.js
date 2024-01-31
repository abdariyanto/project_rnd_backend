const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  const tokenSecret = process.env.ACCESS_TOKEN_SECRET;

  if (token == null) return res.json({msg : "Token not provided!",code : 401});
  jwt.verify(token, tokenSecret, (err, decoded) => {
    if (err) return res.json({msg : "Failed Verify",code : 401});
    req.email = decoded.email;
    next();
  });
};

module.exports = verifyToken;
