const logger = (req, res, next) => {
    const time = new Date();
    const method = req.method;
    const url = req.url;
    console.log(time, method, url);
    next();
}


module.exports = logger;