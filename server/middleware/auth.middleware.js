const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "eKarya_super_secret_2026";

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);

    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = authenticateToken;