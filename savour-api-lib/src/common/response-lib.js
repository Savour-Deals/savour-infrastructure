export function success(body) {
  return buildResponse(200, body);
}

export function failure(body) {
  return buildResponse(200, body); //change to 500 in future
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods" : "DELETE,GET,OPTIONS,PUT,POST",
			"Access-Control-Allow-Headers" : "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(body)
  };
}