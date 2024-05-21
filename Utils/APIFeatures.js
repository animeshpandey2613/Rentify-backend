class APIFeatures {
  //
  constructor(ReqQuery, MongooseModel) {
    this.MongooseModel = MongooseModel;
    this.ReqQuery = ReqQuery;
  }
  filter = () => {
    const ExcludedFields = ["page", "sort", "limit", "fields"];
    const TempQuery = { ...this.ReqQuery };
    ExcludedFields.forEach((ele) => delete TempQuery[ele]);
    let QueryString = JSON.stringify(TempQuery);
    QueryString = QueryString.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );
    this.MongooseQuery = this.MongooseModel.find(JSON.parse(QueryString));
    return this;
  };

  //

  sort = () => {
    if (this.ReqQuery.sort) this.MongooseQuery.sort(this.ReqQuery.sort);
    return this;
  };

  //

  fieldLimiting = () => {
    if (this.ReqQuery.fields) {
      const Fields = this.ReqQuery.fields.split(",").join(" ");
      this.MongooseQuery = this.MongooseQuery.select(Fields);
    }
    return this;
  };

  //

  pagination = () => {
    if (this.ReqQuery.page && this.ReqQuery.limit) {
      const page = this.ReqQuery.page * 1;
      const limit = this.ReqQuery.limit * 1;
      const skip = limit * (page - 1);
      this.MongooseQuery = this.MongooseQuery.skip(skip).limit(limit);
    }
    return this;
  };
}
module.exports = APIFeatures;
