const bip39 = require('bip39');
const crypto = require("crypto");
const eccrypto = require("eccrypto");
const BN = require('bn.js');
const createHash = require('create-hash');
const createHmac = require('create-hmac');

const utils = require("./utils.js");

var derivableKey = exports;

derivableKey.version = "0.0.1";
derivableKey.DerivableKey = DerivableKey;


function DerivableKey(seed) {
  this.seed = seed;
  // Convert privkey to required format
  this.privkey = Buffer.from(this.seed.slice(0, 32));
  this.chainCode = Buffer.from(this.seed.slice(32));
}


function hmacSHA512(key, data) {
  return createHmac('sha512', key).update(data).digest();
}

//module.exports = DerivableKey

DerivableKey.prototype.to_pubkey = function to_pubkey() {
    //Computes and sends back pubkey, point(kpar) of current key(kpar)
    if (this.pubkey === undefined) this.pubkey = eccrypto.getPublic(this.privkey);
    return this.pubkey;
    /*
    kpar = PrivateKey.from_hex(this.seed[:32].hex())
    K = kpar.public_key.format(compressed=False)
    return K
    */
}

DerivableKey.prototype.to_aes_key = function to_pubkey() {
    // Returns sha256 hash of the pubkey, to use as AES key
    return createHash('sha256').update(this.to_pubkey()).digest();
    /* pubkey = self.to_pubkey()
    return sha256(pubkey).digest()
    */
}

DerivableKey.prototype.derive = function derive(s) {
    //Derive with given buffer
    var data = Buffer.from(utils.bytesToHex(this.to_pubkey()) + s);
    //console.log("data", data);
    //console.log("datahex", utils.bytesToHex(data));
    // datahex 303431386239393038643433663530336165386564333132386333356564643865306239333530633031613338396266356438336165636534383232373232623632323364626661656331353830313235336436353833353638333638303261343363343031666564313431356133313266316130396635326439366135326165344269735f746573745f6164647265737331
    const I = hmacSHA512(this.chainCode, data);
    const IL = I.slice(0, 32);
    //console.log("IL", utils.bytesToHex(IL));
    // IL 302c59827f6951917978ccab0abeca2d6a24f3a6502887bf2eab4cfb0c27ff3b
    const IR = I.slice(32);
    //console.log("Seedp", utils.bytesToHex(this.privkey));
    // seedp 95a7ecb56bda5eba808eec2407b418002b824c6c1cb159ec44b8371405629f84
    //const ks = new BN(this.privkey, 16).add(new BN(IL, 16));
    const ks = new BN(IL, 16).add(new BN(this.privkey, 16));
    ks_string = ks.toString('hex').slice(-64);  // Slice does the modulo 2**256
    //console.log("ks", ks_string);
    // ks_hex c5d44637eb43b04bfa07b8cf1272e22d95a740126cd9e1ab7363840f118a9ebf
    const seed_string = ks_string + IR.toString('hex');
    //console.log("seed_string", seed_string);
    return new DerivableKey(utils.hexToBytes(seed_string));
    /*
    data = this.to_pubkey().hex() + s
    I = hmac.new(self.seed[32:], data.encode("utf-8"), sha512).digest()
    IL, IR = I[:32], I[32:]
    ks_int = (string_to_int(IL) + string_to_int(self.seed[:32])) % FIELD_ORDER
    ks = int_to_string(ks_int)
    cs = IR
    return DerivableKey(seed=ks + cs)
    */

    /* key_motion 1a
    IL c1772e0d5ff856e726f511bb9a7dd3a1cabe109838f0df4efe1cf4bb4d4557f5
seed c5d44637eb43b04bfa07b8cf1272e22d95a740126cd9e1ab7363840f118a9ebf
ks_hex 874b74454b3c073320fcca8aacf0b5cf606550aaa5cac0fa718078ca5ecff6b4
Seed1a 874b74454b3c073320fcca8aacf0b5cf606550aaa5cac0fa718078ca5ecff6b43ee220e340fbfdd51d9202c2598f2f8930777c4d146c41a2bf915101a4bd72cb
AES1a fdbe119cf50392b483e072af11b6731cfbb457e35e54e811e3f1ca1fae4ceece
*/


}
