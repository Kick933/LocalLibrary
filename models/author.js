var mongoose = require('mongoose');

var Schema = mongoose.Schema;

const {DateTime} = require('luxon')
var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
// To avoid errors in cases where an author does not have either a family name or first name
// We want to make sure we handle the exception by returning an empty string for that case
  var fullname = '';
  if (this.first_name && this.family_name) {
    fullname = this.family_name + ', ' + this.first_name
  }
  if (!this.first_name || !this.family_name) {
    fullname = '';
  }
  return fullname;
});

// Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get(function() {
  var lifetime_string = '';
  if (this.date_of_birth) {
    lifetime_string = this.date_of_birth.getFullYear().toString();
  }else{
    lifetime_string = 'Unknown'
  }
  lifetime_string += ' - ';
  if (this.date_of_death) {
    lifetime_string += this.date_of_death.getFullYear()
  } else {
    lifetime_string += 'Present'
  }
  return lifetime_string;
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

// Formatted date of birth in yyyy-mm-dd
AuthorSchema
.virtual('dob')
.get(function(){
  return DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_SHORT).split('/').reverse().join('-')
})
// Formatted date of death in yyyy-mm-dd
AuthorSchema
.virtual('dod')
.get(function(){
  if(this.date_of_death===null || this.date_of_death===undefined) return ""
  return DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_SHORT).split('/').reverse().join('-')
})
//Export model
module.exports = mongoose.model('Author', AuthorSchema);
