/** Email shape check for the Create and parent-invite screens. Pure (no react-native) so it can be unit tested. */
export const isEmailShape = (v: string) => /^[^\s@]{1,64}@[^\s@.][^\s@]{0,253}\.[^\s@.]{2,}$/.test(v.trim());
