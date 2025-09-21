# Restaurant Management Backend

## Descripción

Backend para el sistema de gestión de restaurantes construido con NestJS.

## Configuración del Entorno

El proyecto utiliza diferentes archivos de configuración para los entornos de desarrollo y producción:

1. Crea los siguientes archivos en la raíz del proyecto:

`.env.development`:

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=restaurant_dev
JWT_SECRET=your_dev_secret
JWT_EXPIRATION=1d
PORT=3000
NODE_ENV=development
```

`.env.production`:

```bash
MONGODB_URI=your_production_mongodb_uri
MONGODB_DATABASE=restaurant_prod
JWT_SECRET=your_production_secret
JWT_EXPIRATION=1d
PORT=3000
NODE_ENV=production
```

## Instalación

```bash
$ npm install
```

## Ejecutar la aplicación

```bash
# modo desarrollo
$ npm run start:dev

# modo producción
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Variables de Entorno

| Variable         | Descripción                        | Requerido | Valor por defecto |
| ---------------- | ---------------------------------- | --------- | ----------------- |
| NODE_ENV         | Entorno de ejecución               | Sí        | development       |
| MONGODB_URI      | URI de conexión a MongoDB          | Sí        | -                 |
| MONGODB_DATABASE | Nombre de la base de datos         | Sí        | -                 |
| JWT_SECRET       | Secreto para firmar tokens JWT     | Sí        | -                 |
| JWT_EXPIRATION   | Tiempo de expiración del token JWT | Sí        | 1d                |
| PORT             | Puerto del servidor                | No        | 3000              |

## Estructura del Proyecto

```
src/
├── config/              # Configuración de la aplicación
├── modules/             # Módulos de la aplicación
│   ├── auth/           # Autenticación y autorización
│   ├── dishes/         # Gestión de platos
│   ├── menu/           # Gestión del menú
│   ├── orders/         # Gestión de órdenes
│   ├── settings/       # Configuraciones del sistema
│   └── users/          # Gestión de usuarios
└── main.ts             # Punto de entrada de la aplicación
```
