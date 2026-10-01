# SECRET
Gestor de contraseñas

Permite guardar credenciales de acceso, notas y datos de tarjetas bancacias.
La bóveda está encriptada y se guarda en local, dentro de la carpeta de la app.
La compartición de los datos se realiza mediante http con un tunel hacia trycloudflare, que crea una URL de un úncico uso. Previamente se encripta los datos a compartir.
Una vez se abre la url, la información se muestra durante 20 segundos, para posteriormente eliminarse (Burn-After-Reading)

Desarrollado con Tauri + React + Typescript


