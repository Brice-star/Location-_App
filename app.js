import { createRequire } from "module";
const require = createRequire(import.meta.url); 


const express = require('express'); // MODULE POUR UTILISER EXPRESS


const app = express(); // LANCEMENT DU SERVEUR


app.use(express.static('Public')); // POUR DONNER ACCES AUX RESSOURCES STAITQUES CONTENUES DANS LE DOSSIER PUBLIC


const multer = require('multer'); // MODULE POUR LE UPLOAD DE FICHIER


const mysql = require('mysql'); /* MODULE POUR POUVOIR UTILISER MYSQL */
const myConnection = require('express-myconnection'); /* MODULE POUR POUVOIR UTILISER MYSQL */


/* CONNEXION A MYSQL (DEBUT)*/

const optionBD = {
    host : 'localhost',
    user : 'root',
    password : '',
    port : 3306,
    database : 'location_projet'
}
/* CONNEXION A MYSQL (FIN)*/


app.use(myConnection(mysql,optionBD,'pool')); //MIDDLEWARE POUR UTILISER MYSQL



/* POUR SPECIFIER QU'ON UTILISE LE MOTEUR DE VISUALISATION EJS */
app.set('view engine', 'ejs');
app.set('views', 'views');




// POUR POUVOIR UTILISER LES SESSIONS (DEBUT)

const session = require('express-session');
const bodyParser = require('body-parser');


app.use(session({ /* Ceci concerne l'authentification par session */
    secret: 'mySecretKey', // Changez ceci pour une clé secrète sécurisée
    resave: false,
    saveUninitialized: true
}));

// POUR POUVOIR UTILISER LES SESSIONS (FIN)




app.use(express.urlencoded({extended : false})); // MIDDLEWARE PERMETTANT DE PRENDRE EN CHARGE LES DONNEES DU FORMULAIRE

 


//POUR POUVOIR FAIRE DES UPLOADS DANS LE PROJET (DEBUT)

const storage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null,"./Public/pics");
    },

    filename : (req, file, cb)=>{ 
        cb(null, Date.now() + "_" + file.originalname);
    }
});

const upload = multer({storage : storage});


const personnes =[
    {
        nom : 'Amani Bisima',
        image : "/data/uploads/1.png",
    },
    {
        nom : 'Luis Musole',
        image : "/data/uploads/2.png",
    }
]
//POUR POUVOIR FAIRE DES UPLOADS DANS LE PROJET (FIN)



 const bcrypt = require('bcrypt'); // MODULE POUR HASHER LE MOT DE PASSE



/* GESTIION DES INSCRIPTIONS (DEBUT)*/

app.post('/signin', upload.single('profil'), async (req,res)=>{

        	
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);



    req.getConnection((erreur, connection)=>{

        if(erreur){
            console.log(erreur);
        }else{

            /* On recherche dans la BDD le mail entré par le user pour voir s'il n'existe pas.
            S'il existe, alors on lui dit que cet utilisateur existe déja. S'il n'existe pas, 
            on insere dans la BDD les informations entrées, dont le mot de passe hashé (hashedPassword)*/


            connection.query('SELECT * FROM demarcheur WHERE mail = ?', [req.body.mail],
            (erreur, resultats)=>{

                if(resultats != '' ){

                    console.log('Cet utilisateur existe déja');

                    //res.redirect('signin'); 

                /*A supprimer en cas de pb*/ res.render('signup',{ message : 'Cet utilisateur existe déja !'})

                }else{

                    const nom = req.body.nom;
                    const filename = req.file.filename;
                    
                    const nouvellePersonne = {
                        nom : req.body.nom,
                        image : 'pics' + req.file.filename
                    }
                    personnes.push(nouvellePersonne);
        
                    connection.query ('INSERT INTO demarcheur( nom,prenom,mail,pass,profil ) VALUES(?,?,?,?,?)', 
                    [req.body.nom,req.body.prenom,req.body.mail,hashedPassword,filename], (erreur, resultats)=>{

                        if(erreur){

                            console.log (erreur);

                        }else{

                            res.status(300).redirect('login'); 

                        }
                    })
                }
            });
        }
    });

});


 /* GESTION DES INSCRIPTIONS (FIN)*/




/* GESTION DES CONNEXIONS (DEBUT)*/

app.post('/login',(req,res)=>{


    req.getConnection((erreur, connection)=>{

        if(erreur){
            console.log(erreur);
        }else{

            connection.query('SELECT * FROM demarcheur WHERE mail = ?', [req.body.mail],
            (erreur, resultats)=>{ 

                if(resultats != '' ){

                    /* La fonction verify verifie si le mot de passe entré par le user est 
                    identique à celui qu'il avait entré lors de l'inscription et qui avait été hashé avant 
                    d'etre stocké dans la bdd */

                    async function verify(){ 
                     
                        /* On compare le password entré par le user à la connexion à celui
                        hashé et stocké dans la bdd au moment de son inscription */
                        const passwordMatch = await bcrypt.compare(req.body.password, resultats[0].pass);

                        
                        if(passwordMatch){ /* Si le password entré par le user à la connexion
                        est identique à celui qu'il avait entré au moment de son inscription et qui avait
                        été hashé avant d'etre inséré dans la bdd, alors cet utilisateur existe. Donc
                        on lui crée une session et le redirige vers l'espace membre. */

                            console.log('Cet utilisateur a effectivement un compte');
    
                            req.session.mail = req.body.mail; /* On crée une session qui stocke le mail
                            du user qui s'authentifie */
        
                            const session = req.session.mail; /*
                            On stocke cette session dans la variable session qu'on a créée */

                            console.log(session);
                            res.redirect('dashboard')// ON REDIRIGE VERS LE DASHBOARD
    
                        }else{
                            console.log("Email ou mot de passe incorrect");

                            /*A supprimer en cas de pb */ 
                            res.render('login', {message : 'Email ou mot de passe incorrect !'});

                           // res.redirect('signin');
                        }
                    };
                    verify(); /* On exécute la fonction */

                }else{

                    console.log("Email ou mot de passe incorrect");
                    
                    /*A supprimer en cas de pb */ 
                    
                    /* Si le systeme ne trouve pas le mail dans la bdd, cela veut dire que le user n'existe pas.
                    Mais pour ne pas dire clairement qu'il n'existe pas, je dis email ou mot de passe incorrect
                    pour pas que les hackers trouvent une faille */
                    res.render('login', {message : 'Email ou mot de passe incorrect !'});

                   // res.status(200).redirect('signin');
                }
            });
        }
    });

});

 /* GESTIION DES CONNECTIONS (FIN)*/





 /* GESTION DES PUBLICATIONS DE BIENS IMMOBILIERS */


 app.post('/ajouter', upload.single('photo'), async (req,res)=>{


    req.getConnection((erreur, connection)=>{

        if(erreur){
            console.log(erreur);
        }else{
                    const type = req.body.type;
                    const filename = req.file.filename;
                    
                    const nouvellePersonne = {
                        nom : req.body.nom,
                        image : 'pics' + req.file.filename
                    }
                    personnes.push(nouvellePersonne);

                    var date_pub = new Date();
        
                    connection.query ('INSERT INTO bien(typee,pays,quartier,numéro,loyer,photo,description,statut,photo_demarcheur,nom_demarcheur,date_pub,id_demarcheur) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', 
                    [req.body.type,req.body.pays,req.body.quartier,req.body.numero,req.body.loyer,filename,req.body.description,'actif',req.session.photo,req.session.username,date_pub,req.session.idd], (erreur, resultats)=>{
                        if(erreur){
                            console.log (erreur);
                        }else{
                            res.status(300).redirect('dashboard');
                        }
                    })
                }
            });

});

 /* FIN DE LA GESTION DES PUBLICATIONS DE BIENS IMMOBILIERS */




/* RECHERCHE DE CHAMBRES A LOUER (DEBUT) */

app.post('/rechercher',(req,res)=>{

    req.getConnection((erreur,connection)=>{
        if(erreur){
            console.log(erreur);
        }else{
            
            connection.query('SELECT * FROM bien WHERE typee = ? AND pays = ? AND quartier = ?',
            [req.body.categorie, req.body.pays, req.body.quartier],(erreur,trouvé)=>{

                var tr = trouvé[0]; console.log(tr); 
                res.status(200).render('index',{tr});

            })
        }
    })
})

/* RECHERCHE DE CHAMBRES A LOUER (FIN) */



/* DESACTIVER UNE PUBLICATION */

app.get('/desactivate', (req, res) => {

    // Récupérer la valeur du paramètre 'id' depuis l'url'
    const id = req.query.id;

    // Afficher la valeur de l'id dans la console (pour vérification)
    //console.log('ID à désactiver :', id);

    // Requete pour changer le statut de la publication afin que cette derniere soit inactive
    req.getConnection((erreur,connection)=>{

        if(erreur){
            console.log(erreur);
        }else{

            connection.query('UPDATE bien SET statut = ?',['inactif'],(erreur, resultats)=>{
                if(erreur){
                 console.log(erreur);
                }else{ 
                    res.redirect('mes_biens');
                }   
     
             })
        }

    })

    // Exemple de réponse
    //res.send(`ID à désactiver : ${id}`);

    res.redirect('mes_biens');
});


/* FIN DESACTIVER UNE PUBLICATION */





/* MODIFIER UNE PUBLICATION */


app.get('/edit', (req, res) => {
    // Récupérer la valeur du paramètre 'id' depuis l'url'
    const id = req.query.id;

    // Requete pour selectionner les données liées à cet id
    req.getConnection((erreur,connection)=>{

        if(erreur){
            console.log(erreur);
        }else{

            connection.query('SELECT * from bien WHERE id = ?',[id],(erreur, resultats)=>{
                if(erreur){
                 console.log(erreur);
                }else{ 
                    res.render('edit',{resultats : resultats[0]});
                }   
     
             })
        }

    })


});

/* FIN MODIFIER UNE PUBLICATION */






app.get('/signin',(req,res)=>{
    res.status(200).render('signup', { message : null});
});

app.get('/mon_profil',(req,res)=>{

    if(req.session.mail != undefined){
        res.status(200).render('mon_profil');
    }else{
        res.status(200).render('login');
    }

});

app.get('/login',(req,res)=>{
    res.status(200).render('login', {message : null});
}); 


app.get('/',(req,res)=>{

    req.getConnection((erreur,connection)=>{

        if(erreur){
            console.log(erreur);
        }else{

            connection.query('SELECT * FROM bien ORDER BY id DESC',(erreur, resultats)=>{
                if(erreur){
                 console.log(erreur); console.log(resultats);
                }else{ 
                     res.status(200).render('index',{resultats});
                }   
     
             })
        }

    })
});



//GESTION DE LA PARTIE CONSULTER MES BIENS(DEBUT)

app.get('/mes_biens',(req,res)=>{
 
    if(req.session.mail != undefined){

        req.getConnection((erreur,connection)=>{
            connection.query('SELECT * FROM bien where id_demarcheur=? ORDER BY id DESC',[req.session.idd],(erreur,resultats)=>{
                if(erreur){
                    console.log(erreur);
                }else{
                    const photo = req.session.photo;
                    const username = req.session.username;
                    const mail = req.session.mail;
                    res.status(200).render('mes_biens',{resultats,photo,username,mail});
                }
            })
        })

    }else{
        res.redirect('login');
    }

});

//GESTION DE LA PARTIE CONSULTER MES BIENS(FIN)




app.get('/changer_motdepasse',(req,res)=>{

    if(req.session.mail != undefined){
        res.status(200).render('changer_motdepasse');
    }else{
        res.redirect('login');
    }

});

app.get('/ajouter_bien_immobilier',(req,res)=>{
    
    if(req.session.mail != undefined){

        const photo = req.session.photo;
        const username = req.session.username;
        const mail = req.session.mail;
        res.status(200).render('ajouter_bien_immobilier',{photo,username,mail});
    }else{
        res.redirect('login');
    }

});



app.get('/dashboard',(req,res)=>{

    if(req.session.mail != undefined){
        
    req.getConnection((erreur, connection)=>{

        // ON RECUPERE LE ID DU USER CONNECTé EN FONCTION DE SON ADRESSE MAIL STOCKée DANS LA SESSION
        connection.query ('SELECT * FROM demarcheur WHERE mail=?', [req.session.mail], (erreur, resultats)=>{
            if(erreur){
                console.log (erreur);
            }else{

               const id = resultats[0].id; // ON STOCKE DANS LA VAR id L'id DE L'UTILISATEUR RéCUPéRée
               req.session.idd = resultats[0].id; // ON STOCKE DANS LA SESSION NOMMéd idd l'id DE L'UTILISATEUR RECUPERée

               req.session.photo = resultats[0].profil;
               const photo = req.session.photo;console.log(photo);

               req.session.username = resultats[0].nom+' '+resultats[0].prenom;
               const username = req.session.username

              
               const mail = req.session.mail;

               //ON SELECTIONNE LE NOMBRE DE BIENS PUBLIéS PAR L'UTILISATEUR CONNECTé
                connection.query('SELECT COUNT (*) AS count FROM bien WHERE id_demarcheur= ?',[id], (erreur, resultats)=>{

                    if(resultats[0].count === undefined){
                        const count = 0;


                        /*ON FAIT DES REQUETES IMBRIQUEE LES UNES DANS LES AUTRESN LES UNES APRES L'AUTRE
                        CA NOUS PERMET DE RECUPERER TOUTES LES DONNEES QU'ON VEUT ENVOYER SUR LA PAGE DASHBOARD */

                        connection.query('SELECT COUNT (*) AS countActif FROM bien WHERE id_demarcheur= ? AND statut= ?',[id,'actif'],(erreur,resultats)=>{
                            if(resultats[0].countActif === undefined){
                               const counta = 0;

                               connection.query('SELECT COUNT (*) AS countInactif FROM bien WHERE id_demarcheur= ? AND statut= ?',[id,'inactif'],(erreur,resultats)=>{
                                if(resultats[0].countInactif === undefined){
                                   const countina = 0;
                                   res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                }else{
                                    const countina = resultats[0].countInactif;
                                    res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                }                

                            });

                            }else{
                                const counta = resultats[0].countActif;

                                connection.query('SELECT COUNT (*) AS countInactif FROM bien WHERE id_demarcheur= ? AND statut= ?',[id,'inactif'],(erreur,resultats)=>{
                                    if(resultats[0].countInactif === undefined){
                                       const countina = 0;
                                       res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                    }else{
                                        const countina = resultats[0].countInactif;
                                        res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                    }                
    
                                });
                            }
                        });                      

                    }else{
                        const count = resultats[0].count;

                        connection.query('SELECT COUNT (*) AS countActif FROM bien WHERE id_demarcheur= ? AND statut= ?',[id,'actif'],(erreur,resultats)=>{
                            if(resultats[0].countActif === undefined){
                               const counta = 0;

                               connection.query('SELECT COUNT (*) AS countInactif FROM bien WHERE id_demarcheur= ? AND statut= ?',[id,'inactif'],(erreur,resultats)=>{
                                if(resultats[0].countInactif === undefined){
                                   const countina = 0;
                                   res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                }else{
                                    const countina = resultats[0].countInactif;
                                    res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                }                

                            })
                            }else{
                                const counta = resultats[0].countActif;

                                connection.query('SELECT COUNT (*) AS countInactif FROM bien WHERE id_demarcheur= ? AND statut= ?',[id,'inactif'],(erreur,resultats)=>{
                                    if(resultats[0].countInactif === undefined){
                                       const countina = 0;
                                       res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                    }else{
                                        const countina = resultats[0].countInactif;
                                        res.status(200).render('dashboard',{count,counta,countina,photo,username,mail});
                                    }                
    
                                });
                            }
                        });
                       
                    }
                })

            }
        })
    }) 

    }else{
        res.redirect('login');
    }

});




app.get('/404',(req,res)=>{
    res.status(404).render('404');
})

app.get('/logout',(req,res)=>{
    req.session.destroy; /* On bousille la session. Ainsi
    le user qui a cliqué sur le bouton deconnexion ne pourra plus repartir sur la page
    membersArea car la session n'est plus active en ce moment. Il devra se reconnecter d'abord. */

    req.session.mail = undefined;
    console.log('Déconnexion réussie !');

    res.redirect('login');
})

app.use((req,res)=>{
    res.redirect('404');
})


app.listen(3009);
console.log('Attente des requetes au port 3009');