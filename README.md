# Welcome to RH Val d'oise!

- 📖 [Remix docs](https://remix.run/docs)
- 📚 [Application Documentation](./docs/readme.md)

## Documentation Quick Reference
- [Introduction](./docs/1-introduction/readme.md)
- [Application Functionality](./docs/2-application-functionality/readme.md)
- [Design System](./docs/3-design-system/readme.md)
- [Codebase Organization](./docs/4-codebase-organization/readme.md)
- [Key Features](./docs/5-key-features)
- [Development Guide](./docs/6-development-guide/readme.md)

## Initial Setup

### Creating an Administrator Account
To create the initial administrator account:

```sh
npm run init-admin -- --email admin@example.com --password securePassword --name "Admin User"
```

This command creates a pharmacy-owner (admin) user with the provided credentials. Make note of the PIN displayed after creation as it will only be shown once.

## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
