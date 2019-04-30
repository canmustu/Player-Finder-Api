module.exports = {
    mongodb: {
        // URI: 'mongodb://localhost:27017/player_finder_db'
        URI: 'mongodb://canmustu:3569466can@ds149596.mlab.com:49596/player_finder_db'
    },
    encryption: {
        salt_for_password: '0cd1e9E3d1bD079a'
    },
    token_key: {
        secret: 'Hm9bQeThWmZq4t7w'
    },
    google: {
        clientID: '339914601400-ikk60dkpd5r2bmn93dbr3kunpddk1t9s.apps.googleusercontent.com',
        clientSecret: 'JpH2bVo3g95PyA9OJzReZ0hV'
    },
    facebook: {
        appID: '1944720785835404',
        appSecret: '5fc2387a5622ecc2296a93a5945c78bc'
    },
    steam: {
        apiKey: '8E91974DBD8A1F0DCE262C827D56BCD6',
    },
    website_url: 'http://localhost:4200/',
    api_url: 'http://localhost'
    // api_url: 'https://player-finder-api.herokuapp.com'
}
