const { ServiceWrapper, AmqpManager, Middlewares } = require("@molfar/service-chassis")
const { extend } = require("lodash")
const axios = require("axios")

let service = new ServiceWrapper({
    consumer: null,
    publisher: null,
    config: null,

    //-------------- Add heartbeat exported method

    async onHeartbeat(data, resolve){
        resolve({})
    },
 
    //--------------------------------------------
   

    async onConfigure(config, resolve) {

        this.config = config

        console.log(`configure ${ this.config._instance_name || this.config._instance_id}`)

        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        await this.consumer.use([
            Middlewares.Json.parse,
            Middlewares.Schema.validator(this.config.service.consume.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,
            

            async (err, msg, next) => {
                console.log("CONSUME", msg.content)
                next()
            },    

            Middlewares.Filter( msg =>  {
                if( msg.content.langDetector.language.locale != "en") {
                    console.log("IGNORE", msg.content.langDetector.language.locale)
                    msg.ack()
                } else {
                    console.log("ACCEPT", msg.content.langDetector.language.locale)
                } 
                return msg.content.langDetector.language.locale == "en"
            }),

            async (err, msg, next) => {
                let m = msg.content
                let res = await axios.post(
                    this.config.service.stanza.url,
                    {
                        text: m.scraper.message.text
                    }
                )
                if( !res.data.response.error ){
                    m = extend( {}, m, { nlp: res.data.response} )
                    this.publisher.send(m)
                }
                msg.ack()
            }

        ])

        this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
        
        await this.publisher.use([
            Middlewares.Schema.validator(this.config.service.produce.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,
            Middlewares.Json.stringify
        ])

        resolve({ status: "configured" })

    },

    onStart(data, resolve) {
        this.consumer.start()
        resolve({ status: "started" })
    },

    async onStop(data, resolve) {
        await this.consumer.close()
        await this.publisher.close()
        resolve({ status: "stoped" })
    }

})

service.start()
