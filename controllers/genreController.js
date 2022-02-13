const Genre = require('../models/genre')
const Book = require('../models/book')
const async = require('async')
const { body, validationResult } = require('express-validator')
const genre = require('../models/genre')

// Display list of all Genre.
exports.genre_list = function(req,res) {
    Genre.find()
    .sort({name : 'ascending'})
    .exec(function (err, result) {
        if(err) return next(err)
        console.log(result)
        res.render('genre_list', { title : 'Genre List', genre_list : result})
    })
}

// Display detail page for a specific Genre.
exports.genre_detail = function(req,res) {
    async.parallel({
        genre : function(callback) {
            Genre.findById(req.params.id)
            .exec(callback)
        },
        genre_books : function(callback) {
            Book.find({'genre': req.params.id})
            .exec(callback)
        }
    }, function(err, result){
        if(err) return next(err)
        if(result.genre == null){
            let err = new Error("Genre not found.")
            err.status = 404
            return next(err)
        }
        res.render('genre_detail',{ title : 'Genre Detail', genre : result.genre, genre_books : result.genre_books})
    })
}

// Display Genre create form on GET.
exports.genre_create_get = function(req,res) {
    res.render('genre_form', { title : 'Create'})
}

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validation and sanitization
    body('name', 'Genre name required.').trim().isLength({ min : 1}).escape(),

    // Proceeds after validation.
    (req, res, next) => {
            // Extract validation errors.
            const errors = validationResult(req)
            // Create new Genre Object with data
            const genre = new Genre({name : req.body.name})

            if(!errors.isEmpty()){
                res.render('genre_form', { title : 'Create Genre', genre : genre, errors: errors.array() })
                return
            }else{
                // Check if Genre already exists
                Genre.findOne({ name :  req.params.name})
                .exec(function(err,found_genre){
                    if(err) return next(err)

                    if(found_genre){
                        res.redirect(found_genre.url)
                    }else{
                        genre.save(function(err) {
                            if(err) return next(err)
                            res.redirect(genre.url)
                        })
                    }
                })
            }


    }
]


// Display Genre delete form on GET.
exports.genre_delete_get = function(req,res) {
    res.send("NOT IMPLEMENTED : Genre delete GET")
}
// Handle Genre delete on POST.
exports.genre_delete_post = function(req,res) {
    res.send("NOT IMPLEMENTED : Genre delete POST")
}
// Display Genre update form on GET.
exports.genre_update_get = function(req,res) {
    res.send("NOT IMPLEMENTED : Genre update GET")
}
// Handle Genre update on POST.
exports.genre_update_post = function(req,res) {
    res.send("NOT IMPLEMENTED : Genre update POST")
}