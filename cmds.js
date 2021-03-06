
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');


/**
 * Muestra la ayuda
 */
exports.helpCmd = rl => {
    log("Comandos");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente");
    log("  delete <id> - Borrar el quiz indicado");
    log("  edit <id> - Editar el quiz indicado");
    log("  test <id> - Probar el quiz indicado");
    log("  p|play = Jugar a preguntar aleatoriamente todos los quizzes");
    log("  credits = Créditos.");
    log("  q|quit = Salir del programa");
    rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd = rl => {

    models.quiz.findAll()
        .each(quiz => {
                log(` [${colorize(quiz.id, 'magenta')})]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
    });

};

/**
 * Esta funcion devuelve una promesa que:
 * -Valida que se ha introducido un valor para el parametro.
 * -Convierte el parametro en un numero entero.
 * @param id Parametro con el indice a validar.
 */
const validateId = id => {

    return new Sequelize.Promise ((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>. `));
        }else{
        id = parseInt(id);
        if (Number.isNaN(id)) {
            reject(new Error(`El valor del paramtero <id> no es un numero. `));
        } else {
            resolve(id);
        }
    }
    });
};






/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};





/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asincrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interaccion con el usuario,
 * es decir, la llamada a rl.prompt() se debe haer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.addCmd = rl => {
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, 'Introduzca la respuesta')
                .then(a => {
                    return {question: q, answer: a};
            });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Borra un quiz del modelo.
 *
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Edita un quiz del modelo.
 *
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }

        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(rl, 'Introduzca la pregunta: ')
            .then(q => {
                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                return makeQuestion(rl, 'Introduzca la respuesta')
                    .then(a => {
                        quiz.question = q;
                        quiz.answer =a;
                        return quiz;
                });

        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz=> {
        if (!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    return makeQuestion (rl, quiz.question + " ") //promesa que finaliza cuando la pregunta es introducida
        .then(answer => {

        if(answer.toLowerCase().trim()===quiz.answer.toLowerCase().trim()){


        console.log("Correcta");


    }else{
        console.log("Incorrecta");
        //resolve();
    }


});
})
.catch(Sequelize.ValidationError, error => {
        errorlog ('El quiz es erróneo: ');
    error.errors.forEach(({message}) => errorlog (message));
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
})

};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 */
exports.playCmd = rl => {
    let score =0;
    let toBePlayed=[];

    const playone = () => {

        return Promise.resolve()
            .then (() => {

            if(toBePlayed.length<=0){
            console.log("final!");
            //resolve();
            return;
        }
        let pos =Math.floor(Math.random()*toBePlayed.length)
        let quiz = toBePlayed[pos];
        toBePlayed.splice(pos,1);

        return makeQuestion(rl, quiz.question +'? ')
            .then(answer => {

            if(answer.toLowerCase().trim()===quiz.answer.toLowerCase().trim()){

            score++;
            console.log("Correcta");
            return playone();

        }else{
            console.log("Incorrecta");
            //resolve();
        }
    })
    })
        //return new Sequelize.Promise((resolve,reject)=>{

        //})
    };



    models.quiz.findAll({raw: true})//raw devuelve un array mas pequeño que sin el
        .then(quizzes => {
        toBePlayed=quizzes;

})
.then(()=>{
        return playone();// con el return el catch se espera hasta que la promesa playone haya acabado(devuelve una promesa)
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        console.log('Fin.');
    console.log('Tu resultado es: ' + score);
    rl.prompt();
})
};

/**
 * Muestra el nombre del autor de la práctica.
 */
exports.creditsCmd = rl => {
    log('Autor de la práctica');
    log('Carlos García Manrique', 'green');
    rl.prompt();
};

/**
 * Terminar el programa.
 */
exports.quitCmd = rl => {
    rl.close();
};