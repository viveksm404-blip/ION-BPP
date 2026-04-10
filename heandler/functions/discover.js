const { default: axios } = require("axios");

function discover(body) {
  const { providerId, resorceId, offerId } = body.message;
  const url = `http://localhost:8082/bpp/caller/discover`;
  const payload={}
  payload.context = generateContext()
  axios
    .post(url, body)
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
}
module.exports = { discover };
