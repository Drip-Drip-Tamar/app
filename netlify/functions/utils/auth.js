// Server-side authentication utilities for Netlify Functions

export function verifyToken(event) {
  const { identity, user } = event.context.clientContext || {};
  
  if (!user) {
    throw new Error('Unauthorized: No user found in request context');
  }
  
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata || {},
    app_metadata: user.app_metadata || {},
  };
}

export function hasRole(user, role) {
  // Check user_metadata.role first
  if (user.user_metadata?.role === role) return true;
  
  // Check app_metadata.roles array
  if (user.app_metadata?.roles?.includes(role)) return true;
  
  return false;
}

export function requireRole(user, role) {
  if (!hasRole(user, role)) {
    throw new Error(`Forbidden: Role '${role}' required`);
  }
}

export function canContribute(user) {
  return hasRole(user, 'contributor') || 
         hasRole(user, 'steward') || 
         hasRole(user, 'editor');
}

export function requireContributor(user) {
  if (!canContribute(user)) {
    throw new Error('Forbidden: Contributor role required');
  }
}