/* ############################################################################
The MIT License (MIT)

Copyright (c) 2019 Van Schroeder
Copyright (c) 2019 Webfreshener, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

############################################################################ */
module.exports = {
    $id: "http://schemas.webfreshener.com/pipe/node-event/input#",
    $schema: "http://json-schema.org/draft-07/schema#",
    oneOf: [{
        $id: "#/oneOf/0",
        type: "object",
        required: ["off"],
        // additionalProperties: false,
        properties: {
            off: {
                oneOf: [{
                    $ref: "#/definitions/eventItem",
                }, {
                    $ref: "#/definitions/eventItems",
                }],
            }
        },
    }, {
        $id: "#/oneOf/1",
        type: "object",
        required: ["on"],
        // additionalProperties: false,
        properties: {
            on: {
                oneOf: [{
                    $ref: "#/definitions/eventItem",
                }, {
                    $ref: "#/definitions/eventItems",
                }],
            }
        },
    }
    // , {
    //     $ref: "#/definitions/once",
    // }
    ],
    definitions: {
        emitter: {
            $id: "#/definitions/emitter",
            type: "object",
            required: ["_events", "_eventsCount"],
            properties: {
                _events: {
                    type: "object",
                    properties: {},
                },
                _eventsCount: {
                    type: "number",
                    min: 0,
                },
                _maxListeners: {
                    type: "number",
                }
            }
        },
        eventItems: {
            $id: "#/definitions/eventItems",
            type: "array",
            items: {
                $ref: "#/definitions/eventItem",
            },
            minLength: 1,
        },
        eventItem: {
            $id: "#/definitions/eventItem",
            type: "object",
            required: ["emitter", "events"],
            properties: {
                emitter: {
                    $ref: "#/definitions/emitter",
                },
                events: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                },
            },
        },
        once: {
            $id: "#/definitions/once",
            type: "object",
            required: ["once"],
            // additionalProperties: false,
            properties: {
                once: {
                    oneOf: [{
                        $ref: "#/definitions/eventItem",
                    }, {
                        $ref: "#/definitions/eventItems",
                    }],
                }
            },
        },
    },
};
