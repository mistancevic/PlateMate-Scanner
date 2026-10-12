import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, waLink } from "./phone";

test("the mobile number is optional, kept as + and digits, and a wrong one is refused", () => {
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("   "), "");
  assert.equal(normalizePhone("+49 151 2345 6789"), "+4915123456789");
  assert.equal(normalizePhone("0049 (151) 234-56789"), "+4915123456789");
  assert.equal(normalizePhone("0151 23456789"), "015123456789");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone("call me"), null);
  assert.equal(normalizePhone("+49 151 2345 6789 0000 1111 2222"), null);
  assert.equal(waLink("+4915123456789"), "https://wa.me/4915123456789");
});
