import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.mobileNumber;
  const params = {
    TableName: process.env.subscriberUserTable,
    Key: {
      mobileNumber: id,
    }
  };
  return dynamoDb.call("delete", params).then(() => {
    return success(id);
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while deleting the subscriberUser." });
  });
}