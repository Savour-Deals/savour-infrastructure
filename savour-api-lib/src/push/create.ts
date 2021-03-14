import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(event);
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.pushMessageTable,
    Item: data
  };
  return dynamoDb.call("put", params).then(() => success(data))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured creating the record"});
  });
}