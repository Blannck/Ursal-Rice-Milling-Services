db.Product.updateOne(
  { "_id": ObjectId("68cc349f661479bdae01b828") },
  {
    "$set": {
      "isMilledRice": true,
      "millingYieldRate": 65
    }
  }
);