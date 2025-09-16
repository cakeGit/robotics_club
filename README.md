# Robotics Club Documentation Editor

This repository contains a documentation system for the Robotics Club with
secure editing capabilities through email authentication.

## Features

- **Documentation Viewing**: Browse documentation pages through a clean,
  responsive UI
- **Secure Editing**: Edit documentation pages after email verification
- **Side-by-Side Editor**: Live preview of Markdown content while editing
- **Email Authentication**: Secure access control via email verification links

## Environment Setup

The system requires the following environment variables:

```
AUTHORIZED_EMAILS=comma,separated,list@of.emails
JWT_SECRET=generate
```

If `JWT_SECRET` is set to `generate`, a random UUID will be generated on server
start.

## Project Structure

- `/src/components/docs`: Documentation display components
- `/src/components/editor`: Document editor components
- `/src/components/auth`: Authentication components
- `/src/api`: API routes for authentication and document management
- `/src/lib`: Utility libraries and services
- `/data/pages`: Markdown content for documentation pages

## Authentication Flow

1. User clicks the edit button on a documentation page
2. User enters their email address in the modal
3. If the email is in the authorized list, a verification email is sent
4. User clicks the link in the email, which sets an authentication cookie
5. User is redirected to the editor for the page they were viewing

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Adding New Documentation

Simply create a new Markdown file in the `/data/pages` directory structure. The
file will automatically be added to the documentation system.

## Security Considerations

- Email verification links expire after 24 hours
- JWT tokens are stored in HTTP-only secure cookies
- Only authorized emails can receive verification links
- File paths are validated to prevent directory traversal attacks
