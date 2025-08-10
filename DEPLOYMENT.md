# rf617 Deployment Guide

## GitHub Pages Deployment

rf617 is configured for automatic deployment to GitHub Pages.

### Automatic Deployment

rf617 automatically deploys to GitHub Pages when changes are pushed to the `main` branch using GitHub Actions.

**Prerequisites:**

1. Enable GitHub Pages for your repository
2. Set source to "GitHub Actions" in repository settings

**Workflow:**

1. Push changes to the `main` branch
2. GitHub Actions will automatically:
   - Install dependencies
   - Run tests, linting, and type checking
   - Build the production bundle
   - Deploy to GitHub Pages

### Manual Deployment

You can also deploy manually using the npm script:

```bash
npm run deploy
```

This will build rf617 and push it to the `gh-pages` branch.

### Local Testing

To test the production build locally:

```bash
# Build for production
NODE_ENV=production npm run build

# Preview the build
npm run preview
```

### Configuration

- **Base Path**: Configured for `/rf617/` in production
- **Build Output**: `dist/` directory
- **GitHub Actions**: `.github/workflows/deploy.yml`

### Accessing rf617

Once deployed, rf617 will be available at:
`https://[username].github.io/rf617/`

Replace `[username]` with your GitHub username.
