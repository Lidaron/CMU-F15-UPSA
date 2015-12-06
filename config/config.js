var baseurl = process.env.CMU_UPSA_DEVMODE === '1' ? "http://localhost:3000" : "https://cmu-f15-upsa.mybluemix.net";

require('os').hostname();

module.exports = {
	"baseurl": {
		"development": "http://localhost:3000",
		"production": "https://cmu-f15-upsa.mybluemix.net"
	}
}
