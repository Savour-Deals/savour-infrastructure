import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event) {
  const uid: string = event.pathParameters.uid;
  const params = {
    TableName: process.env.pushMessageTable,
    Key: {
      uid: uid,
    }
  };

  return dynamoDb.call("get", params)
  .then((result) => {
    if (result.Item) {
      return success(result.Item);
    } else {
      return failure({ status: false, error: "Item not found." });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ status: false });
  });
}