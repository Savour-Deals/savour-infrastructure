import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
import BusinessUser from "../model/businessUser";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(event);
  const user: BusinessUser = JSON.parse(event.body);
  const params = {
    TableName: process.env.businessUserTable,
    Item: user
  };
  return dynamoDb.call("put", params).then(() => {
    return success(user);
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured creating the user account"});
  });
}