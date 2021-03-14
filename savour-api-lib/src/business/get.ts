import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
import Business from "../model/business";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  const params = {
    TableName: process.env.businessTable,
    Key: {
      id: id,
    }
  };
  return dynamoDb.call("get", params).then((result) => {
    const business: Business = result.Item;
    if (business) {
      return success(business);
    } else {
      return failure({ error: "Business not found." });
    }
  }).catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while getting the business." });
  });
}