const Author = require('../models/author')
const Book = require('../models/book')
const { body, validationResult } = require('express-validator')

const async = require('async')



// Display list of all authors.
exports.author_list = function(req,res) {
    Author.find()
    .sort({'family_name':'ascending'})
    .exec(function (err, result){
        if(err) return next(err)
        res.render('author_list', { title : 'Author List', author_list: result})
    })
}
// Display detail page for specific Author.
exports.author_detail = function(req,res) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
            .exec(callback)
        },
        author_books: function(callback) {
            Book.find({'author' : req.params.id},'title summary')
            .exec(callback)
        }
    }, function(err,result) {
        if(err) return next(err)
        if(result.author == null){
            let err = new Error("Author not found.")
            err.status = 404
            return next(err)
        }
        res.render('author_detail', { title: 'Author detail', author: result.author, author_books : result.author_books})
    })
}
// Display Author Create form on GET.
exports.author_create_get = function(req,res) {
    res.render('author_form', { title : 'Create Author'})
}
// Handle Author create on POST.
exports.author_create_post = [
    
    body('first_name').trim().isLength({ min : 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First Name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min : 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy : true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy : true}).isISO8601().toDate(),
    (req,res,next) => {
        // Extract validation errors.
        const errors = validationResult(req)

        if(!errors.isEmpty()){
            res.render('author_form', { title : 'Create Author', author: req.body, errors: errors.array() })
            return
        } else{
            const author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            })
            author.save(function(err){
                if(err) return next(err)
                res.redirect(author.url)
            })
        }

    }
]
// Display Author delete form on GET.
exports.author_delete_get = function(req,res) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        author_books: function(callback) {
            Book.find({'author' : req.params.id }).exec(callback)
        }
    },function(err,result){
        if(err) return next(err)
        if(result.author_books.length===null){
            res.redirect('/catalog/authors')
        }
        res.render('author_delete', { title : 'Delete Author', author : result.author, author_books : result.author_books})
    })
}
// Handle Author delete on POST.
exports.author_delete_post = function(req,res) {
    async.parallel({
        author: function(callback){
            Author.findById(req.body.authorid).exec(callback)
        },
        author_books: function(callback){
            Book.find({'author': req.body.authorid}).exec(callback)
        }
    }, function(err, result){
        if(err) return next(err)
        // If author has linked books,render their details
        if(result.author_books.length > 0){
            res.render('author_delete', { title : 'Delete Author', author : result.author, author_books : result.author_books})
            return
        }else{
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){
                if(err) return next(err)
                // On success, redirect to author list page
                res.redirect('/catalog/authors')
            })
        }

    })
}
// Display Author update form on GET.
exports.author_update_get = function(req,res) {
    Author.findById(req.params.id).exec(
        function(err, author){
            if(err) return next(err)
            if(author===null){
                res.redirect('/catalog/authors')
                return
            }else{
                res.render('author_form', { title : 'Update Author', author: author})
            }
        }
    )
}
// Handle Author update on POST.
exports.author_update_post = [
    // validation and sanitization
   
    body('first_name').trim().isLength({ min : 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First Name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min : 1 }).escape().withMessage('Family name must be specified.')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy : true}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({ checkFalsy : true}).isISO8601().toDate(),
    // Handles request afterwards.
    (req,res,next) => {
        // Extract validation errors.
        const errors = validationResult(req)
        // Create new author with same id.
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id
        })
        if(!errors.isEmpty()){
            res.render('author_form',{ title : 'Update Author', author : author, errors: errors.array()})
        }else{
            Author.findByIdAndUpdate(req.params.id, author, function(err, theauthor){
                if(err) return next(err)
                // Redirect to author page on success
                res.redirect(theauthor.url)
            })
        }
    }

]
