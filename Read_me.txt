## Pour inclure du bootstrap dans un express, ce n'est pas compliqué. Il s'uffit :

    --> D'installer bootstrap dans le porjet avec : npm install bootstrap

    --> De mettre les fichiers et statiques tels que images, css, js, etc dans 
        le dossier Public

    --> Ecrire ce code dans le fichier principal app.js pour dire à express de donner l'acces au 
        contenu du dossier Public :

            app.use(express.static('Public'));

    --> Au niveau des liens css href du header et des autres liens qui pointent sur les images, il s'uffit de
        bien les mettre et c'est bon. Préceder le lien de "/"