var mongoose = require('mongoose');

var Schema = mongoose.Schema;

const { DateTime } = require('luxon')

var BookInstanceSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, //reference to the associated book
    imprint: {type: String, required: true},
    status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance'},
    due_back: {type: Date, default: Date.now}
  }
);

// Virtual for bookinstance's URL
BookInstanceSchema
.virtual('url')
.get(function () {
  return '/catalog/bookinstance/' + this._id;
});
// Formatted Time
BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
  if(this.due_back===null || this.due_back===undefined) return 'Unavailable'
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED)
})
// formatted return date for html form
BookInstanceSchema.virtual('due_back_html')
.get(function(){
  if(this.due_back===null || this.due_back===undefined) return ''
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_SHORT).split('/').reverse().join('-')
})

//Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
