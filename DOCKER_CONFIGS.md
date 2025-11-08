# Docker Compose Configurations

This project uses multiple Docker Compose files for different environments:

- **docker-compose.yml** - Production environment
- **docker-compose.dev.yml** - Development environment
- **docker-compose.test.yml** - Testing environment
- **docker-compose.optimized.yml** - Optimized production environment

## Usage

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Testing
```bash
docker-compose -f docker-compose.test.yml up
```

### Production
```bash
docker-compose up
```

### Optimized Production
```bash
docker-compose -f docker-compose.optimized.yml up
```
