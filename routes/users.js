let express = require('express');
let router = express.Router();
let user_service = require('../src/service/user');

router.post('/login', async function (req, res) {
    if(req.body.username.length === 0||req.body.password === 0){
        res.state(400);
        res.json({
            message:"Input type wrong"
        });
        return
    }
    let result = await user_service.checkUser(req.body.username, req.body.password)
    if (result.status) {
        res.state(200);
        res.json(result)
    }
    else {
        res.state(500);
        res.json(result)
    }
});

module.exports = router;
