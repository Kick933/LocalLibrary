const Book = require('../models/book')
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const async = require('async');
const { body, validationResult } = require('express-validator');
const book = require('../models/book');
const req = require('express/lib/request');

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
        // Sort book instance by status
        result.book_instance.sort((a,b) => a.status.toUpperCase() > b.status.toUpperCase() ? 1 : -1)
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
        next()
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
                // Redirect to book url on success
                res.redirect(book.url)
            })
        }
    }
]
// Display book delete form on GET.
exports.book_delete_get = function(req,res) {
    async.parallel({
        book_instance : function(callback) {
            BookInstance.find({'book': req.params.id})
            .exec(callback)
        },
        book : function(callback) {
            Book.findById(req.params.id).exec(callback)
        }
    }, function(err, result) {
        if(err) return next(err)
        // If book is not found in record, redirect to book list
        if(book === null){
            res.redirect('/catalog/books')
            return
        }
        // If no book instance found, render book deletion page.
        if(result.book_instance.length === null){
            res.render('book_delete', { title : 'Delete Book ', book : result.book})
        }else{
            // Sort the book instance array
            result.book_instance.sort((a,b) => a.status.toUpperCase() > b.status.toUpperCase() ? 1 : -1)
            // Else show list of book instance to be deleted.
            res.render('book_delete', { title : 'Delete Book ', book : result.book, book_instance : result.book_instance})
        }
    })
}
// Handle book delete on POST.
exports.book_delete_post = function(req,res) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.body.id)
            .populate('author')
            .populate('genre')
            .exec(callback)
        },
        book_instance : function(callback) {
            BookInstance.find({'book' : req.body.id})
            .exec(callback)
        }
    },function(err,result) {
        if(err) return next(err)
        // If book has copies, render delete page.
        if(result.book_instance.length > 0){
            // Sort the book instance array.
            result.book_instance.sort((a,b) => a.status.toUpperCase() > b.status.toUpperCase() ? 1 : -1)
            res.render('book_detail', { title : result.book.title, book : result.book, book_instances : result.book_instance})
            return
        }
        Book.findByIdAndRemove(req.body.bookid, function (err){
            if(err) return next(err)
            // Redirect to book list on success or if book not found in database
            res.redirect('/catalog/books')
        })
    })
}
// Display book update form on GET.
exports.book_update_get = function(req,res) {
    async.parallel({
        book:function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
        },
        authors:function(callback){
            Author.find(callback)
        },
        genres:function(callback){
            Genre.find(callback)
        }
    },function(err,result){
        if(err) return next(err)
        if(book==null){ // If book not found.
            const err = new Error('Book not found.')
            err.status = 404
            return next(err)
        }
        // If book is found,render details in book_form
        // Marking selected genres as marked.
        result.book.genre.forEach(book_genre => {
            result.genres.forEach(genre => {
                if(book_genre._id.toString()===genre._id.toString()){
                    genre.checked='true'
                }
            })
        })
        // rendering the form.
        res.render('book_form' ,{ title : 'Update Book', authors: result.authors, genres : result.genres, book : result.book})
    })
}
// Handle book update on POST.
exports.book_update_post = [
    // Convert genre to array.
    (req,res,next) => {
        if(!req.body.genre instanceof Array){
            if(typeof req.body.genre === 'undefined'){
                req.body.genre=[]
            }else{
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },

    // validation and Sanitization.
    body('title','Title must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('author','Auhtor must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('summary','Summary must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('isbn','ISBN must not be empty.').trim().isLength({ min : 1 }).escape(),
    body('genre.*').escape(),

    // Process request afterwards
    (req,res,next) => {
        // get validation errors
        const errors = validationResult(req)
        // Create new book object with new data and old ID.
        const book = new Book({
            title: req.body.title,
            summary: req.body.summary,
            isbn: req.body.isbn,
            _id: req.params.id,
            author: req.body.author,
            genre: req.body.genre
        })
        // If errors found,re-render book_form for POST request.
        if(!errors.isEmpty()){
            async.parallel({
                authors: function(callback){
                    Author.find(callback)
                }, 
                genres: function(callback){
                    Genre.find(callback)
                }
            }, function(err,result){
                if(err) return next(err)
                // Set previously selected genres as checked
                result.genres.forEach(genre => {
                    req.body.genre.forEach(val => {
                        if(genre._id===val._id){
                            genre.checked = 'true'
                        }
                    })
                })
                // Renders the form again
                res.render('book_form', { title : 'Update Book', authors : result.authors, genres: result.genres, book : book, errors : errors.array()})
                return
            })
        }else{
            // Update the record.
            Book.findByIdAndUpdate( req.params.id, book, {}, function(err,thebook){
                if(err) return next(err)
                // redirect to book page on success
                res.redirect(thebook.url)
            })
        }
    }
]