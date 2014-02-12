Seneca-Redis is a Redis storage driver for [Seneca] MVP toolkit


Current Version: 0.0.4

Tested on: Node 0.10.24, Seneca 0.5.15, Redis 2.2.5


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
