function load() {
    const params = (new URL(document.location)).searchParams;

    $("#floatingUsername")[0].value = params.get("u");
    $("#floatingEmail")[0].value = params.get("e");
    //$("#pfp")[0].src = params.get("pfp");

    //history.pushState("signup", "signup", "/signup");
}

function signup(event) {
    event.preventDefault();
    
    let u = $("#floatingUsername")[0].value;
    let e = $("#floatingEmail")[0].value;

    sha256($("#floatingPassword")[0].value).then(a => {
        sha256(a).then(b => {
            sha256(b).then(c => {
                fetch(`/api/v1/signup/?u=${u}&e=${e}&h=${c}`).then(response => {
                    response.text().then(text => {
                        console.log(text);
                    })
                })
            })
        })
    })
}