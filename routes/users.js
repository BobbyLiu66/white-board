let express = require('express');
let router = express.Router();

router.post('/login', async function (req, res) {
    if(req.body.username.length === 0||req.body.password === 0){
        res.status(400);
        res.json({
            message:"Input type wrong"
        });
        return
    }
    let result = await user_service.checkUser(req.body.username, req.body.password);
    if (result.state) {
        res.status(200);
        res.json(result)
    }
    else {
        res.status(500);
        res.json(result)
    }
});

router.get('/room',async function (req,res) {
    if(req.query.ID.length === 0){
        res.status(400);
        res.json({
            message:"Input type wrong"
        });
        return
    }
    let result = await user_service.checkRoom(req.query.ID);
    if (result.state) {
        res.status(200);
        res.json(result)
    }
    else {
        res.status(500);
        res.json(result)
    }
});

router.get('/friend', async function (req, res) {
    if(req.query.ID.length === 0){
        res.status(400);
        res.json({
            message:"Input type wrong"
        });
        return
    }
    let result = await user_service.checkUser(req.query.ID);
    if (result.state) {
        res.status(200);
        res.json(result)
    }
    else {
        res.status(500);
        res.json(result)
    }
});


module.exports = router;
