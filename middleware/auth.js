const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Brak autoryzacji" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token nieprawidłowy" });
  }
}

function admin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: "Brak uprawnień administratora. Dostęp zabroniony." });
  }
}

module.exports = { admin, auth };