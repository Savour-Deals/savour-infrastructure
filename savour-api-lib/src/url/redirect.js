import * as dynamoDb from "../common/dynamodb-lib";

export default async function main(event) {
	const params = {
    TableName: process.env.redirectTable,
    Key: {
      id: event.token,
    }
  };

  return dynamoDb.call("get", params).then((result) => {
    if (result.Item) {
      const url = result.Item.destinationUrl;
      const content = "<html><body>Moved: <a href=\"" + url + "\">" + url + "</a></body></html>"
      return {"destination_url": url, "content": content}
    } else {
      const content = "<html><body><h1>404: Not Found</h1></body></html>"
      return {"content": content}
    }
  }).catch((e) => {
    console.log(e);
    const content = "<html><body><h1>404: Not Found!</h1></body></html>"
    return {"content": content}
  });
}