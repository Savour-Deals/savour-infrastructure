import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SubscriberUser from "src/model/subscriberUser";
import subscriberUserDao from 'src/dao/subscriberUserDao';
import { success, failure } from "../common/response-lib";

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const subscriber: SubscriberUser = JSON.parse(event.body);
  return subscriberUserDao.create(subscriber)
  .then((result) => success(result))
  .catch((e) => {
    console.log(e);
    return failure({ error: "An error occured creating the subscriber user"});
  });
}