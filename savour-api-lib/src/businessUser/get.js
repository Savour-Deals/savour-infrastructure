import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

export default async function main(event, context) {
  const params = {
    TableName: process.env.businessUserTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'uid': User ID to identify a user by Cognito
    Key: {
      uid: event.pathParameters.uid,
    }
  };

  try {
    const result = await dynamoDb.call("get", params);
    if (result.Item) {
      // Return the retrieved item
      return success(result.Item);
    } else {
      return failure({ status: false, error: "Item not found." });
    }
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
}