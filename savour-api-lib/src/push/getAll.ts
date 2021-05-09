import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { success, failure } from "../common/response-lib";
import pushDao from "src/dao/pushDao";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const businessId: string = event.pathParameters.id;
  
  return pushDao.getAllForBusiness(businessId)
  .then((result) => success(result))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured getting the records" });
  });
}