export const hashPassword = async (password) => bcrypt.hash(password, 10);
export const comparePasswords = (password, hash) => bcrypt.compare(password, hash);
export const generateToken = (user) => jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "6h" });

export const getUserIdFromAuth = (req) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.id ?? null;
  } catch {
    return null;
  }
};