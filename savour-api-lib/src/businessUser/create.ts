import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import businessUserDao from "src/dao/businessUserDao";
import { success, failure } from "../common/response-lib";
import BusinessUser from "../model/businessUser";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const user: BusinessUser = JSON.parse(event.body);
  
  return businessUserDao.create(user)
  .then((result) => success(result))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured creating the user account"});
  });
}