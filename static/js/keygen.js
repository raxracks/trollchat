async function gen_keys(name, email, password) {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{ name: name, email: email }],
        passphrase: password,
        format: 'armored'
    });

    return [publicKey, privateKey];
};