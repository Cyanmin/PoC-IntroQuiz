# PoC Intro Quiz

This project is a proof of concept for a YouTube intro quiz application.

## Getting Started

Use the provided setup script to install dependencies for both client and server:

```bash
./scripts/setup.sh
```

### Development

In one terminal run the server:

```bash
npm run server
```

In another terminal run the client:

```bash
npm --workspace=client run dev
```

### Testing

Run unit tests with:

```bash
npm test
```

### Notes

Dependency installation may fail in environments without internet access. Configure a registry mirror or pre-install packages if required.
