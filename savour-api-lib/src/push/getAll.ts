import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event) {
  const businessId: string = event.pathParameters.businessId;
  const params = {
    TableName: process.env.pushMessageTable,
    IndexName: "business_id-index",

    KeyConditionExpression: "business_id = :id",
    ExpressionAttributeValues: {
      ":id": businessId
    }
  };

  return dynamoDb.call("query", params)
  .then((result) => {
    return success(result.Items);
  }).catch((e) => {
    console.log(e);
    return failure({ status: false });
  });
}