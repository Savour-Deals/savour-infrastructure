import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
import BusinessUser from "../model/businessUser";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const user: BusinessUser = JSON.parse(event.body);
	const id: string = event.pathParameters.id;
	const update: dynamoDb.UpdateExpression = dynamoDb.getUpdateExpression(user, ["businessess"]);
	if (update) {
		const params = {
			TableName: process.env.businessUserTable,
			Key: {
				id: id,
			},
			UpdateExpression: update.expression,
			ExpressionAttributeValues: update.values,
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then((response) => success(response.Item))
		.catch((e) => {
			console.log(e);
			return failure({ error: "An error occured updating the user account"});
		});
	} else {
		//nothing to update. return false
		return failure({ error: "User account update was empty"});
	}
}