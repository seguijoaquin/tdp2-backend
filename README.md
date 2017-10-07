# Taller de desarrollo de proyectos 2 - Server - Link Up

Servidor web en NodeJs con arquitectura de microservicios que utiliza MongoDB como base de datos.


## Tutos

Es conveniente ver este video antes, es el tutorial en el que se basó la implementación:

https://www.youtube.com/playlist?list=PLillGF-RfqbZMNtaOXJQiDebNXjVapWPZ

## Como instalarlo

Instalar Node JS (también se instalará NPM):
https://nodejs.org/es/

Instalar mongodb:
https://www.mongodb.com/download-center?jmp=nav#community


Una vez instalado, ejecutar desde el directorio raiz:

> $ npm install

Esto instala las dependencias del proyecto (bibliotecas externas definidas en el package.json).

## Cómo levantar el servidor

### Levantar el motor de Base de Datos primero:

> $ sudo mongod

Si este error ocurrre:
exception in initAndListen: 29 Data directory /data/db not found., terminating

Ejecutar como root:
> $ mkdir -p /data/db

### Levantar el servidor:

Para correr el servidor:

> $ npm start

### Correr las pruebas:

> $ npm test

# API publica

## Status

### GET /ping

Mensaje:

    body: {}

Respuesta:

	respuesta --> 200
	body: {
		status: "ok"
	}

## Login

### GET /login

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {}

Respuesta:

	respuesta --> 200
	body: {
    photos: [
      'photo-link-1',
      'photo-link-2',
      'photo-link-3'
    ]
  }

  #o si ya estás logueado

	  body: {
      profile: {},
      setting: {},
      links: [],
      candidates: []
    }

## Perfil

### GET /users/me/profile

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {}

Respuesta:

	respuesta --> 200
	  body: {
	    photo: 'http://google.com',
	    photos: [
	      'http://google.com',
	      'http://imagen-perfil.com'
	    ],
	    description: 'description'
	    work: 'maestro',
	    id: '1411063048948357',
	    name: 'papa noel',
	    gender: 'male',
	    birthday: '08/13/1993',
	    interests: [
	      'futbol',
	      'mas futbol'
	    ],
	    education: 'High School'
	  }


### PATCH /users/me/profile (update)

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: { // alguno de estos campos, no hace falta que sean todos
      photo: 'http://google.com',
      photos: [
        'http://google.com',
        'http://imagen-perfil.com'
      ],
      description: 'description'
    }

Respuesta:

	respuesta --> 200

  body: // profile


## Settings

### GET /users/me/settings

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {}

Respuesta:

	respuesta --> 200
	  body: {
	    ageRange: {
        min: 18,
        max: 32
      },
      distRange: {
        min: 1,
        max: 500
      },
      invisible: true,
      interestType: 'female' // male, both, friends
	  }


### PATCH /users/me/settings (update)

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: { // alguno de estos campos, no hace falta que sean todos
      ageRange: {
        min: 18,
        max: 32
      },
      distRange: {
        min: 1,
        max: 500
      },
      invisible: true,
      interestType: 'female' // male, both, friends
	  }

Respuesta:

	respuesta --> 200

  body: // settings


## Users (candidates)

### GET /users/me/candidates

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {}

Respuesta:

	respuesta --> 200
	  body: {
	    profiles: []
	  }

## Links

### PUT /users/{id}/actions

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {
      action: 'link', // 'super-link', 'reject', 'block', 'report'
      message: ''     // 'Reporto al usuario por irrespetuoso e ignorante'
    }

Respuesta:

	respuesta --> 201
	  body: { link: false }


### GET /users/me/links

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {}

Respuesta:

	respuesta --> 200
	  body: {
	    profiles: []
	  }

### DELETE /users/{id}

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {}

Respuesta:

	respuesta --> 204
	  body: {}


## CHAT

### POST /users/{id}/chats/message

Mensaje:

    headers: {
      Authorization: 'access_token'
    }
    body: {
      message: 'message to user'
    }

Respuesta:

	respuesta --> 200
	  body: {}
