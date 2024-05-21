const Mongoose = require("mongoose");
const propertySchema = new Mongoose.Schema({
  ownerNumber:{
    required:true,
    type:Number
  },
  optionsBhk: {
    required: true,
    type: String,
  },
  area: {
    required: true,
    type: String,
  },
  address:{
    type:String,
    required:true,
  },
  landmark:{
    type:String,
    required:true,
  },
  likes:{
    type:Number,
    default:0
  }
});
propertySchema.methods.Addlikes = function () {
  this.likes++;
  return this.save();
};
const propertyModel = Mongoose.model("propertys", propertySchema);
module.exports = propertyModel;
