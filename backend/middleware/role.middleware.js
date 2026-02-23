/**
 * Require that req.auth.role matches one of the allowed roles.
 * Use after authenticate middleware.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
}

export const builderOnly = requireRole('BUILDER');
export const investorOnly = requireRole('INVESTOR');
export const adminOnly = requireRole('ADMIN');
