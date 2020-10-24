const {TxPipe} = require('../dist/txpipe.node').TxPipe;
const fetch = require('node-fetch');
const config = {query: "{ collections(first: 250) { edges { node { id title } } } }"};

const _tx = new TxPipe(
    // {
    //     type: "object",
    //     properties: {},
    // },
    async () => {
        const {query} = config;
        return await new Promise((res) => {
            setTimeout(() => {
                res({data: {status: "ok"}});
            }, 100);
            // fetch("https://cvoir.myshopify.com/admin/api/2019-07/graphql.json", {
            //     method: "post",
            //     body: query,
            //     headers: {
            //         "Content-Type": "application/graphql",
            //         "X-Shopify-Access-Token": "8a37e4f3da17c195d91c90aba1f1de63",
            //     },
            // })
            //     .then((r) => r.json())
            //     .then(json => {
            //         // console.log(JSON.stringify(json));//,null,2))
            //         console.log(json);
            //         return res(json);
            //     }).catch((e) => {
            //     throw e;
            // });
        });
    },
    (results) => {
        console.log(`results: ${JSON.stringify(results)}`);
        return {body: results}
    },
    {
        type: "object",
        properties: {
            data: {}
        },
    },
);

_tx.subscribe({
    next: (d) => console.log("data"),
    error: (e) => console.log(e),
});

_tx.txWrite({});


// const _f = () => {
//     const {query} = config;
//     return new Promise((res) => {
//         setTimeout(() => {
//             res({data: "ok"});
//         }, 100);
//
//         // fetch("https://cvoir.myshopify.com/admin/api/2019-07/graphql.json", {
//         //     method: "post",
//         //     body: query,
//         //     headers: {
//         //         "Content-Type": "application/graphql",
//         //         "X-Shopify-Access-Token": "8a37e4f3da17c195d91c90aba1f1de63",
//         //     },
//         // })
//         //     .then((r) => r.json())
//         //     .then(json => {
//         //         // console.log(JSON.stringify(json));//,null,2))
//         //         console.log(json);
//         //         return res(json);
//         //     }).catch((e) => {
//         //     throw e;
//         // });
//     });
// };
//
// _f().then( (d) => {
//     console.log(d);
// });
