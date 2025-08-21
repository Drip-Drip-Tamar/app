// Authentication utilities for Netlify Identity
import type { NetlifyIdentityUser } from 'netlify-identity-widget';

declare global {
  interface Window {
    netlifyIdentity: any;
  }
}

export type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: 'contributor' | 'steward' | 'editor';
  };
  app_metadata?: {
    roles?: string[];
  };
};

export function initializeNetlifyIdentity() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.on('init', (user: NetlifyIdentityUser | null) => {
      if (!user) {
        window.netlifyIdentity.on('login', () => {
          document.location.href = '/admin/';
        });
      }
    });
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    const user = window.netlifyIdentity.currentUser();
    if (user) {
      return {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      };
    }
  }
  return null;
}

export function login() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.open();
  }
}

export function logout() {
  if (typeof window !== 'undefined' && window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false;
  
  // Check user_metadata.role first
  if (user.user_metadata?.role === role) return true;
  
  // Check app_metadata.roles array
  if (user.app_metadata?.roles?.includes(role)) return true;
  
  return false;
}

export function canContribute(user: User | null): boolean {
  return hasRole(user, 'contributor') || 
         hasRole(user, 'steward') || 
         hasRole(user, 'editor');
}

export function canManageUsers(user: User | null): boolean {
  return hasRole(user, 'steward');
}

export function canEditContent(user: User | null): boolean {
  return hasRole(user, 'editor') || hasRole(user, 'steward');
}