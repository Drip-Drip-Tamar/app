# Netlify Identity Setup Guide

This document outlines the required manual configuration steps for Netlify Identity to enable authentication in the Drip Drip Tamar application.

## Current Status

❌ **Netlify Identity NOT CONFIGURED** - The following features are currently non-functional:
- Admin authentication for sample management
- Protected API endpoints (create/update/delete samples) 
- Decap CMS login and content editing
- Role-based access control

## Required Manual Setup Steps

### 1. Enable Netlify Identity in Dashboard

1. Go to your Netlify site dashboard
2. Navigate to **Site settings > Identity**
3. Click **Enable Identity**

### 2. Configure Registration Settings

Set registration to **"Invite only"** to prevent unauthorized access:

1. In Identity settings, go to **Registration > Registration preferences**
2. Select **"Invite only"**
3. Save changes

### 3. Configure Email Templates

Customize the email templates for better user experience:

1. Go to **Identity > Emails**
2. Configure templates for:
   - **Invitation template**: Welcome message for new users
   - **Confirmation template**: Account confirmation
   - **Recovery template**: Password reset emails

### 4. Set Site URL

Ensure the correct site URL is configured:

1. In Identity settings, verify **Site URL** matches your domain
2. For development: `http://localhost:8888`
3. For production: Your actual domain (e.g., `https://dripdrip.tamar.org.uk`)

### 5. Configure Git Gateway (for Decap CMS)

Enable Git Gateway to allow Decap CMS to work with your repository:

1. Go to **Identity > Services**
2. Click **Enable Git Gateway**
3. This allows content editors to modify files without Git knowledge

## User Roles and Permissions

The application supports the following roles:

- **Contributor**: Can create, edit, and delete water quality samples
- **Steward**: Contributor permissions + user management
- **Editor**: Can manage content via Decap CMS

### Adding Users

1. Go to **Identity > Users** in Netlify dashboard
2. Click **Invite users**
3. Enter email addresses
4. In the invitation, set user metadata with role:
   ```json
   {
     "role": "contributor"
   }
   ```

## Testing the Setup

Once configured, test the following:

### 1. Admin Authentication
- Navigate to `/admin/log-sample`
- Should redirect to Netlify Identity login
- After login, should access admin interface

### 2. API Endpoints
- Try creating a sample via admin form
- Should work without authentication errors

### 3. Decap CMS
- Navigate to `/admin/cms/`
- Should login via Netlify Identity
- Should be able to edit content

## Environment Variables

Ensure these are set in Netlify:

```bash
DATABASE_URL=your_neon_connection_string
NETLIFY_IDENTITY_URL=auto_configured_by_netlify
```

## Troubleshooting

### Common Issues

1. **"Access to script at 'https://identity.netlify.com/v1/netlify-identity-widget.js' blocked"**
   - This is expected in local development
   - Will work correctly in production

2. **Authentication not working in admin pages**
   - Verify Identity is enabled in Netlify dashboard
   - Check site URL configuration
   - Ensure Git Gateway is enabled

3. **CMS login failures**
   - Verify Git Gateway is enabled
   - Check repository permissions
   - Ensure user has appropriate role

### Development vs Production

- **Development**: Identity widget may show CORS errors but functionality works
- **Production**: All Identity features should work seamlessly

## Impact on Phase 7 Testing

❗ **Important**: The following Phase 7 tasks require Netlify Identity to be configured:

- User acceptance testing of admin interface
- Testing sample creation workflow
- Content management testing
- Authentication flow testing

## Next Steps

1. Complete manual Netlify Identity setup following this guide
2. Test authentication flows
3. Proceed with remaining Phase 7-9 tasks
4. User acceptance testing with non-technical volunteers

---

*This setup must be completed manually in the Netlify dashboard. The application code is ready and will work immediately once Identity is configured.*