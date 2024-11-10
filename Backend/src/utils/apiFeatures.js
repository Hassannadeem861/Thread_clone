class ApiFeature {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword?.trim()
      ? {
          name: {
            $regex: this.queryStr.keyword.trim(),
            $options: "i",
          },
        }
      : {};
    // console.log("keyword :", keyword);
    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {

    const queryCopy = { ...this.queryStr };
    // console.log("queryCopy1: ", queryCopy);

    // Remove some field for category
    const removeField = ["keyword", "page", "limit"];

    removeField.forEach((key) => delete queryCopy[key]);
    console.log("queryCopy2: ", queryCopy);
    


    // // Filter for price and rating
    // console.log("queryCopy: ", queryCopy);
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
  
    // this.query = this.query.find(queryCopy);
    this.query = this.query.find(JSON.parse(queryStr));
    console.log("queryStr: ", queryStr);

    return this;
    
  }

  pagination(resultParPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    console.log("currentPage: ", currentPage);

    const skip = resultParPage * (currentPage - 1);
    console.log("skip: ", skip);

    this.query = this.query.limit(resultParPage).skip(skip);
    return this;
  }
}

export default ApiFeature;
