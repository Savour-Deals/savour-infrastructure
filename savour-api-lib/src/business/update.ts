import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import businessDao from 'src/dao/businessDao';
import { success, failure } from "../common/response-lib";
import Business from "../model/business";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const business: Business = JSON.parse(event.body);
	const id: string = event.pathParameters.id;

	return businessDao.update(id, business)
	.then((result) => success(result))
	.catch((e) => {
		console.log(e);
		return failure({ error: "An error occured while updating the business." });
	});
}