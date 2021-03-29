import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import businessUserDao from "src/dao/businessUserDao";
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const id: string = event.pathParameters.id;
  
  return businessUserDao.delete(id)
  .then((result) => success(result))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while deleting the business user account." });
  });
}