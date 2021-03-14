import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
import Business from "../model/business";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const business: Business = JSON.parse(event.body);
	const id: string = event.pathParameters.id;
	const update: dynamoDb.UpdateExpression = dynamoDb.getUpdateExpression(business);
	if (update) {
		const params = {
			TableName: process.env.businessTable,
			Key: {
				id: id,
			},
			UpdateExpression: update.expression,
			ExpressionAttributeValues: update.values,
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then(() => {
				return success(business);
		}).catch((e) => {
			console.log(e);
			return failure({ error: "An error occured while updating the business." });
		})
	} else {
		//nothing to update. return false
		return failure({ error: "Business update was empty."});
	}
}