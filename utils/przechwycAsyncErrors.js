module.exports = fn => { // wywołuje global error handler 
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}