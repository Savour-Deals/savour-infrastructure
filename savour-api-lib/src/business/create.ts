import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import businessDao from "src/dao/businessDao";
import { success, failure } from "../common/response-lib";
import Business from "../model/business";

export default function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const business: Business = JSON.parse(event.body);
  
  return businessDao.create(business)
  .then((result) => success(result))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured while creating the business." });
  });
}
