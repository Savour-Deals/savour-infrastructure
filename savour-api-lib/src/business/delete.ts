import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  const params = {
    TableName: process.env.businessTable,
    Key: {
      id: id,
    }
  };
  return dynamoDb.call("delete", params).then(() => {
    return success(id);
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while deleting the business." });
  });
}