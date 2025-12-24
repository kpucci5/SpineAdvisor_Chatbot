## Quick Start

1. Upload this repo and its contents to Vercel or another hosting service
2. Add two environment variables
3. Customize colors in the config
4. Done

## Deploying to Vercel

### Option 1: Deploy from Command Line

```bash
# Install Vercel CLI (one time)
npm i -g vercel

# Deploy
cd your-chatbot-folder
vercel

# Follow prompts, then deploy to production
vercel --prod
```

### Option 2: Deploy from GitHub

1. Push your code to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Import your repo
5. Click "Deploy"


## File Structure

You only need two things:

```
your-chatbot/
├── index.html          The chatbot interface
└── api/
    └── chat.js        Backend that talks to Personal AI
```

Everything else is optional.

## Configuration

Open `index.html` and find the config section at the top (starts around line 11). Here's what each setting does:

### API Settings

```javascript
apiUrl: '/api/chat'
```
Leave this as-is. It points to your backend.

### Branding

```javascript
chatbotName: 'AI Assistant'
aiAvatarUrl: 'https://your-site.com/bot-avatar.png'
userAvatarUrl: 'https://your-site.com/user-avatar.png'
```

Change the name and upload your own avatars. Use square images (ideally 150x150px or larger).

### API Parameters

```javascript
sourceName: 'Chat Widget'
userName: 'Visitor'
context: ''
```

- `sourceName` - How you identify this chatbot in your analytics
- `userName` - Default username if contact form is disabled
- `context` - Optional context sent with every message (e.g., "You are a medical assistant"). This is not needed as the AI will follow the guidelines set forth in the custom directive.

### Contact Form (Lead Capture)

```javascript
showContactForm: false
contactFormTitle: 'Let\'s Get Started'
contactFormSubtitle: 'Please provide your information to begin chatting'
requirePhone: false
webhookUrl: ''
```

Set `showContactForm: true` to collect names, emails, and phone numbers before chatting.

The form data is saved in the browser session (clears when they close the tab), so users don't have to re-enter it on refresh.

**Webhook:** If you want to send form submissions to another system (Zapier, Google Sheets, your CRM), add a webhook URL.

### Colors

```javascript
primaryColor: '#3B82F6'
userMessageColor: '#3B82F6'
userMessageTextColor: '#FFFFFF'
aiMessageColor: '#FFFFFF'
aiMessageTextColor: '#000000'
```

Pick colors that match your brand. All values are hex codes.

### Messages

```javascript
initialQuestion: 'Hello! I\'m your AI assistant...'
```

- `initialQuestion` - First message users see when chat opens

### Footer

```javascript
footerText: 'I\'m an AI-powered assistant...'
termsUrl: ''
privacyUrl: ''
showLegalLinks: false
```

The footer appears at the bottom of the chat. Add links to your terms/privacy policy if needed.

## Backend Setup

The backend (`api/chat.js`) needs three things configured:

### 1. Add Your Domain to Allowed List

Open `api/chat.js` and find line 8:

```javascript
const ALLOWED_DOMAINS = [
  "spine-advisor-chatbot.vercel.app",  // ← Add your Vercel URL here
];
```

Add your chatbot's URL. This prevents unauthorized sites from using your API.

### 2. Environment Variables (Required)

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

**Required:**
```
PERSONAL_AI_API_KEY = your-api-key-here
DOMAIN_NAME = your-domain-name
```

### How to Get These Values

- **PERSONAL_AI_API_KEY**: Get from your Personal AI account under Workspace Settings
- **DOMAIN_NAME**: The domain identifier shown when clciked in to your Personal AI persona (e.g., "spine-clinic")

After adding environment variables, redeploy:
```bash
vercel --prod
```

## Testing

### Test Locally

```bash
# Install a simple server
npm install -g serve

# Run it
serve

# Open http://localhost:3000
```

If it works locally, it'll work on Vercel.

### Test on Mobile

Important: Test on actual mobile devices, not just in dev tools. The chatbot uses special viewport handling for mobile browsers.

Open the Vercel URL on your phone and check:
- Form displays correctly
- Chat fills the screen properly
- Input field is visible when keyboard opens
- Messages scroll smoothly

## Embedding

You can embed the chatbot on any website in several ways. Open `embedding-demo.html` to see live examples of each option as well as the embed codes


## Troubleshooting

### Chat loads but doesn't respond

**Check:**
1. Environment variables set in Vercel? (PERSONAL_AI_API_KEY, DOMAIN_NAME)
2. Your domain added to ALLOWED_DOMAINS in `api/chat.js`?
3. API key is valid?

Open browser console (F12) to see error messages.

### "Access denied: Unauthorized domain"

Your chatbot's Vercel URL isn't in the ALLOWED_DOMAINS list in `api/chat.js`. Add it and redeploy.

### Form not showing

Set `showContactForm: true` in the config (around line 24 in index.html).

## Customization Tips

### Change Colors

All colors are in the config. Use hex codes. The primary color affects:
- Contact form buttons
- Send button
- Typing indicator
- Links

### Custom Avatars

Upload square images (PNG or JPG) and use the full URL. Recommended size: 150x150px or larger.


## Security Notes

- Environment variables (API keys) are only accessible server-side
- The ALLOWED_DOMAINS list prevents unauthorized API usage
- Contact form data is stored in sessionStorage (clears when tab closes)
- Webhook calls are fire-and-forget (won't block chat if they fail)


## Support

If something's not working:
1. Check browser console for errors (F12)
2. Verify environment variables are set
3. Check your domain is in ALLOWED_DOMAINS
4. Make sure API key is valid

Reach out to support@personal.ai with any questions.

## Files Overview

- `index.html` - Main chatbot file (edit config here)
- `api/chat.js` - Backend proxy to Personal AI

## Next Steps

After deploying:
1. Test the chatbot on mobile and desktop
2. Customize colors and messages
3. Enable contact form if you want lead capture
4. Set up a webhook if you want form data sent somewhere
5. Embed on your website using an iframe code snipped
