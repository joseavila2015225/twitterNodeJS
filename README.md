Para insertar los comandos en Postman:
--------------------------------------------------
Todas las peticiones deben ser POST.
--------------------------------------------------
commands        register nombre correo usuario contraseña
commands        login usuario contraseña true
commands        add_tweet Todo el contenido del tweet --Se acepta máximo 280 caracteres. NECESITA AUTENTICACIÓN
commands        edit_tweet ID del Tweet contenido a cambiar --Se acepta máximo 280 caracteres. NECESITA AUTENTICACIÓN
commands        delete_tweet ID del Tweet NECESITA AUTENTICACIÓN
commands        view_tweets usuario NECESITA AUTENTICACIÓN
commands        set_tweet ID del Tweet ID del usuario NECESITA AUTENTICACIÓN
commands        follow usuario --Solo al usuario al que deseo seguir, no se puede seguir dos veces al mismo usuario. NECESITA AUTENTICACIÓN
commands        unfollow usuario --Solo al usuario al que deseo dejar de seguir, no se puede dejar de seguir dos veces al mismo usuario NECESITA AUTENTICACIÓN
commands        like ID del Tweet --SE DEBE SEGUIR AL USUARIO PARA PODER DARLE LIKE NECESITA AUTENTICACIÓN
commands        dislike ID del Tweet --SE DEBE SEGUIR AL USUARIO PARA PODER DARLE LIKE NECESITA AUTENTICACIÓN
commands        reply ID del tweet comentario que se quiere realizar --NECESITA AUTENTICACIÓN
commands        profile usuario --NECESITA AUTENTICACIÓN
commands        retweet ID del tweet usuario que desea retweetear --NECESITA AUTENTICACIÓN