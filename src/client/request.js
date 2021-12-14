export function request (method, path, header, body) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", () => {
            let data;
            try {
                data = JSON.parse(xhr.responseText);
            } catch (err) {
                data = xhr.responseText;
            }
            resolve(data);
        });
        xhr.addEventListener("error", (evt) => {
            debugger
            reject();
        });
        xhr.addEventListener("abort", ()  => {
            debugger
            reject();
        });

        xhr.open(method, path, true);

        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        Object.keys(header).forEach((function (key) {
            xhr.setRequestHeader(key, header[key]);
        }));

        xhr.send(body);
    });
}