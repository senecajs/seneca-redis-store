Seneca-Redis is a Redis storage driver for [Seneca] MVP toolkit

Usage:

    var seneca              = require('seneca');
    var senecaRedisStore   = require('seneca-redis');

    var senecaConfig = {}
    var senecaRedisStoreOpts = {
        host: 'localhost',
        port: 12000
    };

    ...

    var si = seneca(senecaConfig);
    si.use(senecaRedisStore, senecaRedisStoreOpts);
    si.ready( function(){
        var product = si.make('product');
        ...
    });
    ...

[Seneca]: http://senecajs.org/
