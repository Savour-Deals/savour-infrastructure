import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
import BusinessUser from "../model/businessUser";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  const params = {
    TableName: process.env.businessUserTable,
    Key: {
      id: id,
    }
  };
  return dynamoDb.call("get", params).then((result) => {
    const user: BusinessUser = result.Item;
    if (user) {
      return success(user);
    } else {
      return failure({ error: "Business user not found." });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured getting the user account"});
  });
}