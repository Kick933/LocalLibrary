const BookInstance = require('../models/bookinstance')
const book = require('../models/book')
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
    Book.find({},'title')
    .exec(function(err,books){
        if(err) return next(err)
        res.render('bookinstance_form',{ title : 'Create Book Instance', book_list : books})
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
            Book.find({}, 'title')
            .exec(function(err,books){
                res.render('bookinstance_form', { title : 'Create Book Instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array()})
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
    res.send("NOT IMPLEMENTED : BookInstance delete GET")
}
// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req,res) {
    res.send("NOT IMPLEMENTED : BookInstance delete POST")
}
// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req,res) {
    res.send("NOT IMPLEMENTED : BookInstance update GET")
}
// Handle BookInstance update on POST.
exports.bookinstance_update_post = function(req,res) {
    res.send("NOT IMPLEMENTED : BookInstance update POST")
}