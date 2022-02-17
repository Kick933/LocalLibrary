const BookInstance = require('../models/bookinstance')
const Book = require('../models/book')
const async = require('async')
const { body,  validationResult } = require('express-validator')


// Dispkay list of all BookInstances.
exports.bookinstance_list = function(req,res) {
    BookInstance.find()
    .populate('book')
    .exec(function(err, result) {
        if(err) return next(err)
        res.render('bookinstance_list', { title : 'Book Instance List', bookinstance_list : result})
    })
}
// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req,res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err,bookinstance) {
        if(err) return next(err)
        if(bookinstance == null){
            let err = new Error('Book copy not found')
            err.status = 404
            return next(err)
        }
        res.render('bookinstance_detail', { title : 'Copy : ' + bookinstance.book.title, bookinstance : bookinstance})
    })
}
// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req,res) {
    async.parallel({
        books: function(callback){
            Book.find({},'title').exec(callback)
        },
        status: function(callback){
            const val = BookInstance.schema.path('status').enumValues.sort((a,b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1)
            callback(null,val)
        }
    }, function(err,result){
        if(err) return next(err)
        res.render('bookinstance_form', {title: 'Create Book Instance', book_list : result.books, status:result.status})
    })
}
// Handle Bookinstance create on POST.
exports.bookinstance_create_post = [
    // Validating and sanitizing data
    body('book', 'Book must be specified.').trim().isLength({ min : 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min : 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date.').optional({ checkFalsy : true }).isISO8601().toDate(),

    (req,res,next) => {
        // Extract validation errors from request
        const errors = validationResult(req)
        
        const bookinstance = new BookInstance({
            book:req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        })

        if(!errors.isEmpty()){
            // If errors, render the form again.
            async.parallel({
                books: function(callback){
                    Book.find({},'title').exec(callback)
                },
                status: function(callback){
                    const val = BookInstance.schema.path('status').enumValues.sort((a,b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1)
                    callback(null,val)
                }
            }, function(err,result){
                if(err) return next(err)
                const selected = bookinstance.status
                console.log(selected)
                res.render('bookinstance_form', {title: 'Create Book Instance', book_list : result.books, status:result.status, errors:errors.array(), selected: selected})
            })
            return
        }else {
                bookinstance.save(function(err){
                    if(err) return next(err)
                    res.redirect(bookinstance.url)
                })
        }
    }

]
// Display BookInstance delete form.
exports.bookinstance_delete_get = function(req,res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err,bookinstance){
        if(err) return next(err)
        if(bookinstance===null){
            res.redirect('/catalog/bookinstances')
            return
        }
        res.render('bookinstance_delete', { bookinstance : bookinstance })
    })
}
// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req,res) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function(err, result){
        if(err) return next(err)
        res.redirect('/catalog/bookinstances')
    })
}
// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req,res) {
    async.parallel({
        book_list: function(callback){
            Book.find({}).exec(callback)
        },
        bookinstance: function(callback){
            BookInstance.findById(req.params.id).exec(callback)
        },
        status: function(callback){
            const val = BookInstance.schema.path('status').enumValues.sort((a,b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1)
            callback(null,val)
        }
    },function(err, { book_list, bookinstance, status}){
        if(err) return next(err)
        if(bookinstance === null){
            const err = new Error("Book instance not found.")
            err.status = 404
            return next(err)
        }
        res.render('bookinstance_form', { title : 'Update Book Instance', bookinstance : bookinstance, book_list : book_list, status:status})
    })
}
// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
    // form validation and sanitization.
    body('book', 'Book must be specified.').trim().isLength({ min : 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min : 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date.').optional({ checkFalsy : true }).isISO8601().escape(),

    // Handles request after form data sanitization.
    (req,res,next) => {
        // Extract validation errors
        const errors = validationResult(req)
        // create new instance with form data.
        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id : req.params.id
        })
        // Re-render form if errors is non-empty with data.
        if(!errors.isEmpty()){
            async.parallel({
                book_list: function(callback){
                    Book.find({}).exec(callback)
                },
                bookinstance: function(callback){
                    BookInstance.findById(req.params.id).exec(callback)
                },
                status: function(callback){
                    const val = BookInstance.schema.path('status').enumValues.sort((a,b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1)
                    callback(null,val)
                }
            },function(err, { book_list, bookinstance, status}){
                if(err) return next(err)
                if(bookinstance === null){
                    const err = new Error("Book instance not found.")
                    err.status = 404
                    return next(err)
                }
                res.render('bookinstance_form', { title : 'Update Book Instance', bookinstance : bookinstance, book_list : book_list, status : status})
        })
        }else{
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, function(err,instance){
                if(err) return next(err)
                // redirect to instance page on success
                res.redirect(instance.url)
            })
        }
    }
]