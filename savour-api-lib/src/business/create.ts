import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
import Business from "../model/business";

export default function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const business: Business = JSON.parse(event.body);
  const params = {
    TableName: process.env.businessTable,
    Item: business
  };
  return dynamoDb.call("put", params).then(() => {
    return success(business);
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while creating the business." });
  });
}
