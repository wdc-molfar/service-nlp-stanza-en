const axios = require("axios")
const { extend } = require("lodash")


const processMessage = async (config, m) => {

    let stanzaResponse
    let embeddingResponse

    await Promise.all(
        [
            (async () => {

                try {

                    stanzaResponse = await axios.post(
                        config.service.stanza.url, {
                            text: m.scraper.message.text
                        }
                    )

                    return true

                } catch (e) {

                    stanzaResponse = {
                        data: {
                            error: e.toString()
                        }
                    }

                }

            })(),

            (async () => {

                try {

                    embeddingResponse = await axios.post(
                        config.service.embedding.url, {
                            text: m.scraper.message.text
                        }
                    )

                    return true

                } catch (e) {

                    stanzaResponse = {
                        data: {
                            detail: e.toString()
                        }
                    }

                }

            })()
        ]
    )

    if(stanzaResponse.data && embeddingResponse.data){
        if (!stanzaResponse.data.error && !embeddingResponse.data.detail) {
            return {
                nlp: extend({},
                    stanzaResponse.data.response, { embedding: embeddingResponse.data.response }
                )
            }
        }
    } else {
        if(!stanzaResponse.data) console.log("STANZA ERROR", JSON.stringify(stanzaResponse))
        if(!embeddingResponse.data) console.log("EMBEDDING ERROR", JSON.stringify(embeddingResponse))
        return {
            error: "No data"
        }    
    }    

    return {
        error: `
${JSON.stringify(new Date())}
STANZA ERROR: ${JSON.stringify((stanzaResponse.data.error || ""))}
EMBEDDING ERROR: ${JSON.stringify((embeddingResponse.data.detail || ""))}
CONFIG:${JSON.stringify(config, null, "")}
MESSAGE: ${JSON.stringify(m, null, " ")}
`
    }

}


module.exports = processMessage



// const test = async () => {

//     const config = {
//         service: {
//             stanza: {
//                 url: "https://stanza-nvidia.molfar.science/stanza"
//             },
//             embedding: {
//                 url: "https://embedding-rest.molfar.science/embedding"
//             }    
//         }
//     }

//     const m = {
//         scraper:{
//             message: {
//                 "text": "Ukrainian troops used US-supplied Himars missiles to destroy an advanced air defence system inside Russia, as the Kremlin warned Washington it could suffer “fatal consequences” for backing the cross-border attacks.\nSeveral missiles are understood to have hit an air defence installation in Belgorod, Russia that was equipped with S-300/400 surface-to-air missiles.\nPhotos of the aftermath of the attack appeared to show fires raging from destroyed vehicles, with smoke billowing into the air. It is understood that the strike occurred on Sunday.\nEarlier, Sergei Ryabkov, Moscow’s deputy foreign minister, said that the US would face “fatal consequences” if it allowed Ukraine to use American weapons for attacks inside Russia.\nThe US has so far allowed Kyiv to hit targets within Russia only if they pose an immediate threat to Ukrainian forces. Volodymyr Zelensky, the Ukrainian president, has since requested permission to use US munitions for long range strikes."  
//             }
//         }
//     }

//     for( let i=1; i < 5; i++) {
//         await Promise.all([
//             (async () => {
//                 console.log(i, 1, (await processMessage(config, m)))        
//             })(),
//             (async () => {
//                 console.log(i, 2, (await processMessage(config, m)))        
//             })(),
//             (async () => {
//                 console.log(i, 3,(await processMessage(config, m)))        
//             })()
//         ])
        
//     }    

// }

// test()