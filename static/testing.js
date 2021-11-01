gen_keys("sam", "multisniperism@gmail.com", "password123").then(a => {
    encrypt(a[0], "bruh").then(b => {
        console.log(b);
        decrypt(a[0], a[1], b, "password123").then(c => {
            console.log(c);
        });
    });
});