const Book = require('../models/book')
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const async = require('async');
const { body, validationResult } = require('express-validator')

exports.index = function(req,res) {
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({},callback)
        },
        book_instance_count : function(callback) {
            BookInstance.countDocuments({}, callback)
        },
        book_instance_available_count : function(callback) {
            BookInstance.countDocuments({status : "Available"},callback)
        },
        author_count : function(callback) {
            Author.countDocuments({}, callback)
        },
        genre_count : function(callback) {
            Genre.countDocuments({}, callback)
        }
    }, function(err, results) {
        console.log("rendering with result")
        res.render('index', { title : "Local Library Home", error: err, data : results})
    }
    )
}
// Display list of all books.
exports.book_list = function(req,res) {
    Book.find({}, 'title author')
    .sort({title : 1})
    .populate('author')
    .exec(function (err, result) {
        if(err) return next(err)
        res.render('book_list', { title : 'Book List', book_list: result})
    })
}
// Display detail page for specific book.
exports.book_detail = function(req,res) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback)
        },
        book_instance : function(callback) {
            BookInstance.find({'book' : req.params.id})
            .exec(callback)
        }
    }, function(err, result) {
        if(err) return next(err)
        if(result.book == null){
            let err = new Error("Book not found.")
            err.status = 404
            return next(err)
        }
        res.render('book_detail', { title : result.book.title, book : result.book, book_instances : result.book_instance})
    })
}
// Display book create form on GET.
exports.book_create_get = function(req,res) {
    async.parallel({
        authors: function(callback){
            Author.find(callback)
        },
        genres: function(callback){
            Genre.find(callback)
        }
    },function(err,result){
        res.render('book_form', { title : 'Create Book', authors:result.authors, genres:result.genres})
    })
}
// Handle book create form on POST.
exports.book_create_post = [
    // Convert genre to an array
    (req,res,next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre === 'undefined') req.body.genre = []
            else req.body.genre = new Array(req.body.genre)
        }
    },
    body('title', 'Title must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('author','Author must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('isbn', 'ISBN must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('genre.*').escape(),

    (req,res,next) => {
        // Extract validation errors from request
        const errors = validationResult(req)

        // Create new Book object with clean data.
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        })

        if(!errors.isEmpty()){

            async.parallel({
                authors: function(callback){
                    Author.find(callback)
                },
                genres: function(callback){
                    Genre.find(callback)
                }
            },function(err,result){
                if(err) return next(err)
                // Mark previously checked genres as checked
                for(let i = 0; i < result.genres.length; i++){
                    if(book.genre.indexOf(result.genres[i]._id) > -1){
                        // Cureent genre is selected. Set 'Checked' flag.
                        result.genres[i].checked = 'true'
                    }
                }
                res.render('book_form', { title : 'Create Book', authors : result.authors, genres: result.genres, book: book, errors: errors.array()})
            })
        }else {
            book.save(function(err){
                if(err) return next(err)
                res.redirect(book.url)
            })
        }
    }
]
// Display book delete form on GET.
exports.book_delete_get = function(req,res) {
    res.send("NOT IMPLEMENTED : Book delete GET")
}
// Handle book delete on POST.
exports.book_delete_post = function(req,res) {
    res.send("NOT IMPLEMENTED : Book delete POST")
}
// Display book update form on GET.
exports.book_update_get = function(req,res) {
    res.send("NOT IMPLEMENTED : Book update GET")
}
// Handle book update on POST.
exports.book_update_post = function(req,res) {
    res.send("NOT IMPLEMENTED : Book update POST")
}