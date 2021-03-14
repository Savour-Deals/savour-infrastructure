import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const businessId: string = event.pathParameters.id;
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
    return failure({ error: "An error occured getting the records" });
  });
}