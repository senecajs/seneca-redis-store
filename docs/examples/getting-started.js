// Save, load, list and remove entities in Redis.
// Start Redis first: npm run services:up (host port 16380).
const Seneca = require('seneca')

const host = process.env.SENECA_TEST_REDIS_HOST || '127.0.0.1'
const port = process.env.SENECA_TEST_REDIS_PORT || '16380'

const seneca = Seneca({ legacy: false })
  .quiet()
  .use('seneca-entity')
  .use(require('../../redis-store.js'), {
    uri: 'redis://' + host + ':' + port,
  })

seneca.ready(function () {
  const apple = seneca.make$('fruit')
  apple.id$ = 'apple'
  apple.name = 'Pink Lady'
  apple.price = 0.99

  apple.save$(function (err, saved) {
    if (err) throw err
    console.log('saved:', saved.id, saved.name, saved.price)

    seneca.make$('fruit').load$('apple', function (err, loaded) {
      if (err) throw err
      console.log('loaded:', loaded.name)

      seneca.make$('fruit').list$({ name: 'Pink Lady' }, function (err, list) {
        if (err) throw err
        console.log('listed:', list.length)

        seneca.make$('fruit').remove$('apple', function (err) {
          if (err) throw err
          console.log('removed: apple')
          seneca.close(function () {
            console.log('closed')
          })
        })
      })
    })
  })
})
