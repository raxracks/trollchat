function login(event) {
    event.preventDefault();
    
    let u = $("#floatingUsername")[0].value;

    sha256($("#floatingPassword")[0].value).then(a => {
        sha256(a).then(b => {
            sha256(b).then(c => {
                fetch(`/api/v1/login/?u=${u}&h=${c}`).then(response => {
                    response.text().then(text => {
                        clearCookies();
                        setCookie("u", u);
                        setCookie(randomstring(20), randomstring(65));
                        setCookie(randomstring(20), text);
                        setCookie(randomstring(20), randomstring(65));

                        document.location.href = "/api/v1/checksession";
                    })
                })
            })
        })
    })
}