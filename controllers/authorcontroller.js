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
    res.send("NOT IMPLEMENTED : Author delete GET")
}
// Handle Author delete on POST.
exports.author_delete_post = function(req,res) {
    res.send("NOT IMPLEMENTED : Author delete POST")
}
// Display Author update form on GET.
exports.author_update_get = function(req,res) {
    res.send("NOT IMPLEMENTED : Author update GET")
}
// Handle Author update on POST.
exports.author_update_post = function(req,res) {
    res.send("NOT IMPLEMENTED : Author update POST")
}
