function flattenDeep (array, parent = []) {
	array.reduce((parent, item) => (Array.isArray(item) ? flattenDeep(item, parent) : parent.push(item), parent), parent);
	return parent;
}

function invokeHandler (handler, handlerArgs) {
	return new Promise((resolve, reject) => {
		handler.call(null, ...handlerArgs, (err, res) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(res);
			}
		});
	});
}

export default function invokeMiddleware (middlewares, request, response) {
	return flattenDeep([middlewares])
		.reduce(
			(chain, handler) => {
				if (handler.length === 4) {
					return chain.catch(error => invokeHandler(handler, [request, response, error]));
				}
				else if (handler.length === 3) {
					return chain.then(() => invokeHandler(handler, [request, response]));
				}
				return chain;
			},
			Promise.resolve(),
		);
}
