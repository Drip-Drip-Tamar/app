// Server-side authentication utilities for Astro API routes
import type { APIContext } from 'astro';

export interface NetlifyUser {
  id: string;
  email: string;
  user_metadata?: {
    role?: 'contributor' | 'steward' | 'editor';
    full_name?: string;
  };
  app_metadata?: {
    roles?: string[];
  };
}

export function verifyNetlifyUser(context: APIContext): NetlifyUser {
  // In Netlify, user context comes from the request headers
  const authHeader = context.request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No valid token provided');
  }

  // For development/testing, we'll temporarily allow requests without full validation
  // In production, this would validate the JWT token properly
  if (import.meta.env.DEV) {
    console.warn('Development mode: Skipping full authentication validation');
    return {
      id: 'dev-user',
      email: 'dev@test.com',
      user_metadata: { role: 'contributor' }
    };
  }
  
  // TODO: Implement proper JWT validation when Netlify Identity is fully configured
  throw new Error('Authentication not fully configured in production');
}

export function hasRole(user: NetlifyUser, role: string): boolean {
  // Check user_metadata.role first
  if (user.user_metadata?.role === role) return true;
  
  // Check app_metadata.roles array
  if (user.app_metadata?.roles?.includes(role)) return true;
  
  return false;
}

export function requireRole(user: NetlifyUser, role: string): void {
  if (!hasRole(user, role)) {
    throw new Error(`Forbidden: Role '${role}' required`);
  }
}

export function canContribute(user: NetlifyUser): boolean {
  return hasRole(user, 'contributor') || 
         hasRole(user, 'steward') || 
         hasRole(user, 'editor');
}

export function requireContributor(user: NetlifyUser): void {
  if (!canContribute(user)) {
    throw new Error('Forbidden: Contributor role required');
  }
}