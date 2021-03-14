import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event) {
  const params = {
    TableName: process.env.subscriberUserTable,
		// 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'mobile_number': Mobile number identifying user
    Key: {
      mobile_number: event.pathParameters.mobileNumber,
    }
  };

  try {
    await dynamoDb.call("delete", params);
    return success({ status: true });
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
}