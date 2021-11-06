// still lots to do and clean up in this file
async function encrypt(pubKeys, message) {
    const publicKeysArmored = [
        pubKeys
    ];

    const plaintext = message;

    const publicKeys = await Promise.all(publicKeysArmored.map(armoredKey => openpgp.readKey({ armoredKey })));

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: plaintext }),
        encryptionKeys: publicKeys,
    });

    return encrypted;
}

async function decrypt(pubKeys, privKey, encrypted_message, password) {
    const publicKeysArmored = [
        pubKeys
    ];

    const privateKeyArmored = privKey;
    const passphrase = password;

    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readKey({ armoredKey: privateKeyArmored }),
        passphrase
    });

    const message = await openpgp.readMessage({
        armoredMessage: encrypted_message
    });

    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey
    });

    return decrypted;
}