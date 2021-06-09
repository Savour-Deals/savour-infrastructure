import businessUserDao from 'src/dao/businessUserDao';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";
import BusinessUser from "../model/businessUser";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const user: BusinessUser = JSON.parse(event.body);
	const id: string = event.pathParameters.id;

	return businessUserDao.update(id, user)
	.then((result) => success(result))
	.catch((e) => {
		console.log(e);
		return failure({ error: "An error occured while updating the user account." });
	});
}