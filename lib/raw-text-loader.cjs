/**
 * `.md` を既定エクスポートの文字列にする。
 * OpenNext の Worker は `content/legal` をファイルとして持たないため、本文はモジュールに入れる。
 */
module.exports = function rawTextLoader(source) {
  const text = typeof source === "string" ? source : source.toString("utf8");
  return `export default ${JSON.stringify(text)};\n`;
};
